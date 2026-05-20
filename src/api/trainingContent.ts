import { apiRequest } from './client'
import type { ContentStatus, ContentType, MediaType, TrainingContent, TrainingStageId, VrFormat } from '../types'

export interface ContentListParams {
  stageId?: TrainingStageId
  category?: ContentType
  includeDraft?: boolean
}

export interface ContentInput {
  title: string
  description?: string
  stageId: TrainingStageId
  category: ContentType
  mediaType?: MediaType
  duration?: string
  tags?: string[] | string
  vrFormat?: VrFormat | null
  status?: ContentStatus
  sortOrder?: number
}

function mapItem(raw: TrainingContent): TrainingContent {
  return {
    ...raw,
    type: raw.category,
  }
}

export async function listTrainingContents(params: ContentListParams = {}) {
  const q = new URLSearchParams()
  if (params.stageId) q.set('stageId', params.stageId)
  if (params.category) q.set('category', params.category)
  if (params.includeDraft) q.set('includeDraft', '1')
  const suffix = q.toString() ? `?${q}` : ''
  const { items } = await apiRequest<{ items: TrainingContent[] }>(
    `/api/training-contents${suffix}`,
  )
  return items.map(mapItem)
}

export async function getTrainingContent(id: string) {
  const { item } = await apiRequest<{ item: TrainingContent }>(`/api/training-contents/${id}`)
  return mapItem(item)
}

export async function createTrainingContent(input: ContentInput) {
  const { item } = await apiRequest<{ item: TrainingContent }>('/api/training-contents', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return mapItem(item)
}

export async function updateTrainingContent(id: string, input: Partial<ContentInput>) {
  const { item } = await apiRequest<{ item: TrainingContent }>(`/api/training-contents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return mapItem(item)
}

export async function deleteTrainingContent(id: string) {
  return apiRequest<{ ok: boolean }>(`/api/training-contents/${id}`, { method: 'DELETE' })
}

async function uploadFile(id: string, path: string, file: File) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('originalFilename', file.name)
  const res = await apiRequest<{ item: TrainingContent; url: string; warning?: string | null }>(
    `/api/training-contents/${id}${path}`,
    { method: 'POST', body: fd },
  )
  return { ...res, item: mapItem(res.item) }
}

export async function uploadPreviewImage(id: string, file: File) {
  return uploadFile(id, '/preview', file)
}

export function uploadPdfMaterial(id: string, file: File) {
  return uploadFile(id, '/material/pdf', file)
}

export function uploadPptMaterial(id: string, file: File) {
  return uploadFile(id, '/material/ppt', file)
}

export function uploadVideoMaterial(id: string, file: File) {
  return uploadFile(id, '/material/video', file)
}

export function uploadVrMaterial(id: string, file: File) {
  return uploadFile(id, '/material/vr', file)
}

export async function deleteContentMaterial(id: string) {
  const { item } = await apiRequest<{ item: TrainingContent }>(
    `/api/training-contents/${id}/material`,
    { method: 'DELETE' },
  )
  return mapItem(item)
}
