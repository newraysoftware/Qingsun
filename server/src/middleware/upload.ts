import multer from 'multer'
import { mkdirSync } from 'fs'
import { extname, join } from 'path'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { decodeUploadFilename } from '../utils/filename.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const UPLOAD_ROOT = join(__dirname, '..', '..', 'uploads')

for (const sub of ['previews', 'materials/pdf', 'materials/ppt', 'materials/video', 'materials/vr']) {
  mkdirSync(join(UPLOAD_ROOT, sub), { recursive: true })
}

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const PDF_EXT = new Set(['.pdf'])
const PPT_EXT = new Set(['.ppt', '.pptx'])
const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm', '.m4v'])
const VR_EXT = new Set(['.glb', '.gltf', '.fbx'])

/** VR 课件建议 ≤20MB 以保证网页快速加载（目标 3 秒内） */
export const VR_RECOMMENDED_MAX_BYTES = 20 * 1024 * 1024
export const VR_HARD_MAX_BYTES = 80 * 1024 * 1024
export const VIDEO_MAX_BYTES = 500 * 1024 * 1024
export const PDF_MAX_BYTES = 50 * 1024 * 1024
export const PPT_MAX_BYTES = 80 * 1024 * 1024
export const PREVIEW_MAX_BYTES = 5 * 1024 * 1024

function storage(subdir: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, join(UPLOAD_ROOT, subdir)),
    filename: (_req, file, cb) => {
      const ext = extname(decodeUploadFilename(file.originalname)).toLowerCase()
      cb(null, `${randomUUID()}${ext}`)
    },
  })
}

function extFilter(allowed: Set<string>, label: string) {
  return (
    _req: import('express').Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
  ) => {
    const ext = extname(decodeUploadFilename(file.originalname)).toLowerCase()
    if (!allowed.has(ext)) {
      cb(new Error(`不支持的${label}格式: ${ext || '未知'}`))
      return
    }
    cb(null, true)
  }
}

export const uploadPreview = multer({
  storage: storage('previews'),
  limits: { fileSize: PREVIEW_MAX_BYTES },
  fileFilter: extFilter(IMAGE_EXT, '预览图'),
})

export const uploadPdf = multer({
  storage: storage('materials/pdf'),
  limits: { fileSize: PDF_MAX_BYTES },
  fileFilter: extFilter(PDF_EXT, 'PDF'),
})

export const uploadPpt = multer({
  storage: storage('materials/ppt'),
  limits: { fileSize: PPT_MAX_BYTES },
  fileFilter: extFilter(PPT_EXT, 'PPT'),
})

export const uploadVideo = multer({
  storage: storage('materials/video'),
  limits: { fileSize: VIDEO_MAX_BYTES },
  fileFilter: extFilter(VIDEO_EXT, '视频'),
})

export const uploadVr = multer({
  storage: storage('materials/vr'),
  limits: { fileSize: VR_HARD_MAX_BYTES },
  fileFilter: extFilter(VR_EXT, 'VR课件'),
})

export function vrFormatFromFilename(name: string): 'glb' | 'gltf' | 'fbx' | null {
  const ext = extname(name).toLowerCase()
  if (ext === '.glb') return 'glb'
  if (ext === '.gltf') return 'gltf'
  if (ext === '.fbx') return 'fbx'
  return null
}

export function toPublicUrl(relativePath: string): string {
  return `/uploads/${relativePath.replace(/\\/g, '/')}`
}
