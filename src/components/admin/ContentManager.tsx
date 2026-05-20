import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2, Upload, X } from 'lucide-react'
import {
  createTrainingContent,
  deleteContentMaterial,
  deleteTrainingContent,
  listTrainingContents,
  updateTrainingContent,
  uploadPdfMaterial,
  uploadPptMaterial,
  uploadPreviewImage,
  uploadVideoMaterial,
  uploadVrMaterial,
  type ContentInput,
} from '../../api/trainingContent'
import { ApiError } from '../../api/client'
import { STAGE_LABEL, TRAINING_STAGES } from '../../data/trainingSystem'
import { CONTENT_TYPE_LABEL } from '../../data/content'
import type { ContentType, MediaType, TrainingContent, TrainingStageId } from '../../types'
import { useApp } from '../../context/AppContext'
import { ContentPreview } from '../preview/ContentPreview'

const CATEGORIES: ContentType[] = ['theory', 'dsa', 'virtual', 'case']
const MEDIA_LABEL: Record<MediaType, string> = {
  none: '暂无课件',
  pdf: 'PDF 文本',
  ppt: 'PPT 演示文稿',
  video: '视频',
  vr: '虚拟课件 (VR)',
}

const emptyForm: ContentInput = {
  title: '',
  description: '',
  stageId: 'foundation',
  category: 'theory',
  mediaType: 'none',
  duration: '',
  tags: '',
  status: 'published',
  sortOrder: 0,
}

export function ContentManager() {
  const { showToast } = useApp()
  const [items, setItems] = useState<TrainingContent[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStage, setFilterStage] = useState<TrainingStageId | ''>('')
  const [filterCategory, setFilterCategory] = useState<ContentType | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TrainingContent | null>(null)
  const [form, setForm] = useState<ContentInput>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const previewSectionRef = useRef<HTMLElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await listTrainingContents({
        stageId: filterStage || undefined,
        category: filterCategory || undefined,
        includeDraft: true,
      })
      setItems(list)
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [filterStage, filterCategory, showToast])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (item: TrainingContent) => {
    setEditing(item)
    setForm({
      title: item.title,
      description: item.description,
      stageId: item.stageId,
      category: item.category,
      mediaType: item.mediaType,
      duration: item.duration,
      tags: item.tags.join('，'),
      status: item.status,
      sortOrder: item.sortOrder,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const scrollToPreview = () => {
    window.setTimeout(() => {
      previewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
  }

  const handleSaveMeta = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await updateTrainingContent(editing.id, form)
        showToast('已保存')
      } else {
        const created = await createTrainingContent(form)
        setEditing(created)
        showToast('已创建，可继续上传预览图与课件')
      }
      await load()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: TrainingContent) => {
    if (!confirm(`确定删除「${item.title}」？`)) return
    try {
      await deleteTrainingContent(item.id)
      showToast('已删除')
      await load()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '删除失败')
    }
  }

  const uploadPreview = async (file: File) => {
    if (!editing) {
      showToast('请先保存基本信息')
      return
    }
    setUploading(true)
    try {
      await uploadPreviewImage(editing.id, file)
      showToast('预览图已上传')
      const fresh = await listTrainingContents({ includeDraft: true })
      const found = fresh.find((x) => x.id === editing.id)
      if (found) setEditing(found)
      await load()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const uploadMaterial = async (file: File, kind: MediaType) => {
    if (!editing) {
      showToast('请先保存基本信息')
      return
    }
    setUploading(true)
    try {
      let res
      if (kind === 'pdf') res = await uploadPdfMaterial(editing.id, file)
      else if (kind === 'ppt') res = await uploadPptMaterial(editing.id, file)
      else if (kind === 'video') res = await uploadVideoMaterial(editing.id, file)
      else if (kind === 'vr') res = await uploadVrMaterial(editing.id, file)
      else return
      let item = res.item
      if (!item.previewImageUrl) {
        const { captureMaterialPreviewThumbnail } = await import('../../utils/captureMaterialPreview')
        const thumb = await captureMaterialPreviewThumbnail(item)
        if (thumb) {
          const previewRes = await uploadPreviewImage(editing.id, thumb)
          item = previewRes.item
          showToast(res.warning ? `${res.warning}；已自动生成预览图` : '课件已上传，已自动生成预览图')
        } else if (res.warning) {
          showToast(res.warning)
        } else {
          showToast('课件已上传')
        }
      } else if (res.warning) {
        showToast(res.warning)
      } else {
        showToast('课件已上传')
      }
      setEditing(item)
      setForm((prev) => ({ ...prev, mediaType: item.mediaType }))
      await load()
      scrollToPreview()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const removeMaterial = async () => {
    if (!editing) return
    setUploading(true)
    try {
      await deleteContentMaterial(editing.id)
      showToast('课件已移除')
      const fresh = await listTrainingContents({ includeDraft: true })
      const found = fresh.find((x) => x.id === editing.id)
      if (found) setEditing(found)
      await load()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '操作失败')
    } finally {
      setUploading(false)
    }
  }

  const hasMaterialPreview =
    Boolean(editing?.contentFileUrl) && editing?.mediaType !== 'none'

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          管理培训内容元数据，支持 PDF 文本、视频（MP4/MOV 等）、VR 课件（GLB/GLTF/FBX）
        </p>
        <button type="button" onClick={openCreate} className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> 新增内容
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <select
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value as TrainingStageId | '')}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
        >
          <option value="">全部阶段</option>
          {TRAINING_STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as ContentType | '')}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
        >
          <option value="">全部分类</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CONTENT_TYPE_LABEL[c]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-slate-500">
              <th className="px-4 py-3">预览</th>
              <th className="px-4 py-3">标题</th>
              <th className="px-4 py-3">阶段</th>
              <th className="px-4 py-3">分类</th>
              <th className="px-4 py-3">课件</th>
              <th className="px-4 py-3">时长</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  加载中…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  暂无内容，点击「新增内容」创建
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-2">
                    {item.previewImageUrl ? (
                      <img
                        src={item.previewImageUrl}
                        alt=""
                        className="h-10 w-14 rounded object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-300">无</span>
                    )}
                  </td>
                  <td className="max-w-[200px] px-4 py-2 font-medium">{item.title}</td>
                  <td className="px-4 py-2">{STAGE_LABEL[item.stageId]}</td>
                  <td className="px-4 py-2">{CONTENT_TYPE_LABEL[item.category]}</td>
                  <td className="px-4 py-2">{MEDIA_LABEL[item.mediaType]}</td>
                  <td className="px-4 py-2">{item.duration || '—'}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        item.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {item.status === 'published' ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="text-primary-600 hover:underline"
                    >
                      <Pencil className="inline h-3.5 w-3.5" /> 编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="ml-3 text-red-600 hover:underline"
                    >
                      <Trash2 className="inline h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? '编辑培训内容' : '新增培训内容'}</h2>
              <button type="button" onClick={closeModal} aria-label="关闭">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeta} className="space-y-4">
              <label className="block text-sm">
                标题 *
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                简介
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  培训阶段 *
                  <select
                    value={form.stageId}
                    onChange={(e) =>
                      setForm({ ...form, stageId: e.target.value as TrainingStageId })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  >
                    {TRAINING_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  内容分类 *
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as ContentType })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CONTENT_TYPE_LABEL[c]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  预计时长
                  <input
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="如 45分钟"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  发布状态
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as 'draft' | 'published',
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <option value="published">已发布</option>
                    <option value="draft">草稿</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm">
                标签（逗号分隔）
                <input
                  value={typeof form.tags === 'string' ? form.tags : form.tags?.join('，')}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                排序（数字越小越靠前）
                <input
                  type="number"
                  value={form.sortOrder ?? 0}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>

              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? '保存中…' : editing ? '保存基本信息' : '创建并继续上传'}
              </button>
            </form>

            {editing && (
              <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
                <h3 className="font-medium text-slate-800">资源上传</h3>

                <div>
                  <p className="mb-2 text-sm text-slate-600">预览图（JPG / PNG / WebP）</p>
                  {editing.previewImageUrl && (
                    <img
                      src={editing.previewImageUrl}
                      alt="预览"
                      className="mb-2 h-24 rounded-lg object-cover"
                    />
                  )}
                  <label className="btn-secondary inline-flex cursor-pointer text-sm">
                    <Upload className="h-4 w-4" />
                    选择预览图
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) void uploadPreview(f)
                      }}
                    />
                  </label>
                </div>

                <div className="rounded-lg bg-slate-50 p-4 text-sm">
                  <p className="font-medium text-slate-700">课程内容文件</p>
                  {editing.contentFileUrl ? (
                    <p className="mt-1 text-slate-600">
                      当前：{editing.contentFileName}（{MEDIA_LABEL[editing.mediaType]}
                      {editing.vrFormat ? ` · ${editing.vrFormat.toUpperCase()}` : ''}）
                      {editing.contentFileSize
                        ? ` · ${(editing.contentFileSize / 1024 / 1024).toFixed(2)} MB`
                        : ''}
                    </p>
                  ) : (
                    <p className="mt-1 text-slate-400">尚未上传课件</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <label className="btn-secondary inline-flex cursor-pointer text-xs">
                      PDF
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) void uploadMaterial(f, 'pdf')
                        }}
                      />
                    </label>
                    <label className="btn-secondary inline-flex cursor-pointer text-xs">
                      PPT / PPTX
                      <input
                        type="file"
                        accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) void uploadMaterial(f, 'ppt')
                        }}
                      />
                    </label>
                    <label className="btn-secondary inline-flex cursor-pointer text-xs">
                      视频 MP4/MOV
                      <input
                        type="file"
                        accept=".mp4,.mov,.webm,.m4v,video/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) void uploadMaterial(f, 'video')
                        }}
                      />
                    </label>
                    <label className="btn-secondary inline-flex cursor-pointer text-xs">
                      VR GLB/GLTF/FBX
                      <input
                        type="file"
                        accept=".glb,.gltf,.fbx"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) void uploadMaterial(f, 'vr')
                        }}
                      />
                    </label>
                    {editing.contentFileUrl && (
                      <button
                        type="button"
                        onClick={() => removeMaterial()}
                        disabled={uploading}
                        className="text-xs text-red-600 hover:underline"
                      >
                        移除课件
                      </button>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    PPT/PPTX 单文件建议 ≤80MB；需稳定网页内阅读时可另传 PDF。VR 课件优先 GLB，建议压缩至
                    20MB 以内以确保 3 秒内可加载。
                  </p>

                </div>
              </div>
            )}

            {hasMaterialPreview && editing && (
              <section
                ref={previewSectionRef}
                className="mt-6 scroll-mt-4 border-t-2 border-primary-200 pt-6"
              >
                <h3 className="text-base font-semibold text-primary-900">课件预览</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {editing.contentFileName}
                  {editing.contentFileSize
                    ? ` · ${(editing.contentFileSize / 1024 / 1024).toFixed(2)} MB`
                    : ''}
                  {' '}
                  · {MEDIA_LABEL[editing.mediaType]}
                </p>
                <div className="mt-3 min-h-[200px] rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                  <ContentPreview content={editing} />
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
