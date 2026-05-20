import { Router } from 'express'
import { unlinkSync } from 'fs'
import { join, relative } from 'path'
import { createContentSchema, updateContentSchema } from '../schemas/content.js'
import {
  createContent,
  deleteContent,
  getContentById,
  listContents,
  updateContent,
  updateContentFiles,
} from '../repositories/contentRepository.js'
import { requireAdmin, requestIsAdmin, type AuthRequest } from '../middleware/auth.js'
import {
  UPLOAD_ROOT,
  VR_RECOMMENDED_MAX_BYTES,
  uploadPdf,
  uploadPpt,
  uploadPreview,
  uploadVideo,
  uploadVr,
  toPublicUrl,
  vrFormatFromFilename,
} from '../middleware/upload.js'
import { resolveUploadFilename } from '../utils/filename.js'

export const trainingContentsRouter = Router()

function paramId(req: { params: { id?: string | string[] } }): string {
  const id = req.params.id
  return Array.isArray(id) ? id[0] : (id ?? '')
}

function relativeUploadPath(absPath: string): string {
  return relative(UPLOAD_ROOT, absPath).replace(/\\/g, '/')
}

function handleMulterError(err: unknown, res: import('express').Response, next: import('express').NextFunction) {
  if (err instanceof Error) {
    res.status(400).json({ error: err.message })
    return
  }
  next(err)
}

/** 列表（学员端可访问已发布内容；管理端传 includeDraft=1 + 登录） */
trainingContentsRouter.get('/', (req, res) => {
  const includeDraft = req.query.includeDraft === '1' && requestIsAdmin(req)
  const items = listContents({
    stageId: typeof req.query.stageId === 'string' ? req.query.stageId : undefined,
    category: typeof req.query.category === 'string' ? req.query.category : undefined,
    status: includeDraft ? undefined : 'published',
  })
  res.json({ items })
})

trainingContentsRouter.get('/:id', (req, res) => {
  const item = getContentById(paramId(req))
  if (!item) {
    res.status(404).json({ error: '内容不存在' })
    return
  }
  res.json({ item })
})

trainingContentsRouter.post('/', requireAdmin, (req: AuthRequest, res) => {
  const parsed = createContentSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message || '参数无效' })
    return
  }
  const item = createContent(parsed.data)
  res.status(201).json({ item })
})

trainingContentsRouter.patch('/:id', requireAdmin, (req: AuthRequest, res) => {
  const parsed = updateContentSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message || '参数无效' })
    return
  }
  const item = updateContent(paramId(req), parsed.data)
  if (!item) {
    res.status(404).json({ error: '内容不存在' })
    return
  }
  res.json({ item })
})

trainingContentsRouter.delete('/:id', requireAdmin, (req: AuthRequest, res) => {
  const id = paramId(req)
  const existing = getContentById(id)
  if (!existing) {
    res.status(404).json({ error: '内容不存在' })
    return
  }
  deleteContent(id)
  res.json({ ok: true })
})

trainingContentsRouter.post(
  '/:id/preview',
  requireAdmin,
  (req, res, next) => {
    uploadPreview.single('file')(req, res, (err) => {
      if (err) handleMulterError(err, res, next)
      else next()
    })
  },
  (req: AuthRequest, res) => {
    const file = req.file
    if (!file) {
      res.status(400).json({ error: '请上传预览图' })
      return
    }
    const url = toPublicUrl(relativeUploadPath(file.path))
    const item = updateContentFiles(paramId(req), { previewImage: url })
    if (!item) {
      res.status(404).json({ error: '内容不存在' })
      return
    }
    res.json({ item, url })
  },
)

trainingContentsRouter.post(
  '/:id/material/pdf',
  requireAdmin,
  (req, res, next) => {
    uploadPdf.single('file')(req, res, (err) => {
      if (err) handleMulterError(err, res, next)
      else next()
    })
  },
  (req: AuthRequest, res) => {
    const file = req.file
    if (!file) {
      res.status(400).json({ error: '请上传 PDF 文件' })
      return
    }
    const url = toPublicUrl(relativeUploadPath(file.path))
    const item = updateContentFiles(paramId(req), {
      contentFile: url,
      contentFileName: resolveUploadFilename(file, req.body),
      contentFileSize: file.size,
      mediaType: 'pdf',
      vrFormat: null,
    })
    if (!item) {
      res.status(404).json({ error: '内容不存在' })
      return
    }
    res.json({ item, url, warning: null })
  },
)

trainingContentsRouter.post(
  '/:id/material/ppt',
  requireAdmin,
  (req, res, next) => {
    uploadPpt.single('file')(req, res, (err) => {
      if (err) handleMulterError(err, res, next)
      else next()
    })
  },
  (req: AuthRequest, res) => {
    const file = req.file
    if (!file) {
      res.status(400).json({ error: '请上传 PPT / PPTX 文件' })
      return
    }
    const url = toPublicUrl(relativeUploadPath(file.path))
    const item = updateContentFiles(paramId(req), {
      contentFile: url,
      contentFileName: resolveUploadFilename(file, req.body),
      contentFileSize: file.size,
      mediaType: 'ppt',
      vrFormat: null,
    })
    if (!item) {
      res.status(404).json({ error: '内容不存在' })
      return
    }
    res.json({ item, url, warning: null })
  },
)

trainingContentsRouter.post(
  '/:id/material/video',
  requireAdmin,
  (req, res, next) => {
    uploadVideo.single('file')(req, res, (err) => {
      if (err) handleMulterError(err, res, next)
      else next()
    })
  },
  (req: AuthRequest, res) => {
    const file = req.file
    if (!file) {
      res.status(400).json({ error: '请上传视频文件' })
      return
    }
    const url = toPublicUrl(relativeUploadPath(file.path))
    const item = updateContentFiles(paramId(req), {
      contentFile: url,
      contentFileName: resolveUploadFilename(file, req.body),
      contentFileSize: file.size,
      mediaType: 'video',
      vrFormat: null,
    })
    if (!item) {
      res.status(404).json({ error: '内容不存在' })
      return
    }
    res.json({ item, url })
  },
)

trainingContentsRouter.post(
  '/:id/material/vr',
  requireAdmin,
  (req, res, next) => {
    uploadVr.single('file')(req, res, (err) => {
      if (err) handleMulterError(err, res, next)
      else next()
    })
  },
  (req: AuthRequest, res) => {
    const file = req.file
    if (!file) {
      res.status(400).json({ error: '请上传 VR 课件（GLB / GLTF / FBX）' })
      return
    }
    const displayName = resolveUploadFilename(file, req.body)
    const format = vrFormatFromFilename(displayName)
    if (!format) {
      res.status(400).json({ error: '仅支持 GLB、GLTF、FBX 格式' })
      return
    }
    const warning =
      file.size > VR_RECOMMENDED_MAX_BYTES
        ? `文件 ${(file.size / 1024 / 1024).toFixed(1)}MB 偏大，建议压缩至 20MB 以内以确保网页 3 秒内加载`
        : null
    const url = toPublicUrl(relativeUploadPath(file.path))
    const item = updateContentFiles(paramId(req), {
      contentFile: url,
      contentFileName: displayName,
      contentFileSize: file.size,
      mediaType: 'vr',
      vrFormat: format,
    })
    if (!item) {
      res.status(404).json({ error: '内容不存在' })
      return
    }
    res.json({ item, url, warning })
  },
)

/** 删除课件文件（保留元数据） */
trainingContentsRouter.delete('/:id/material', requireAdmin, (req: AuthRequest, res) => {
  const existing = getContentById(paramId(req))
  if (!existing) {
    res.status(404).json({ error: '内容不存在' })
    return
  }
  if (existing.contentFileUrl) {
    try {
      const rel = existing.contentFileUrl.replace(/^\/uploads\//, '')
      unlinkSync(join(UPLOAD_ROOT, rel))
    } catch {
      /* 文件可能已不存在 */
    }
  }
  const item = updateContentFiles(paramId(req), {
    contentFile: null,
    contentFileName: null,
    contentFileSize: null,
    mediaType: 'none',
    vrFormat: null,
  })
  res.json({ item })
})
