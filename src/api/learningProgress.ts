import { apiRequest } from './client'
import type { ContentLearningProgress, LearningPosition, LearningStatus } from '../types'

export interface UpsertLearningProgressBody {
  status?: LearningStatus
  progressPercent?: number
  lastPosition?: LearningPosition | null
}

export async function fetchAllLearningProgress() {
  const { items } = await apiRequest<{ items: ContentLearningProgress[] }>(
    '/api/users/me/learning-progress',
  )
  return items
}

export async function upsertLearningProgress(contentId: string, body: UpsertLearningProgressBody) {
  const { item } = await apiRequest<{ item: ContentLearningProgress }>(
    `/api/users/me/learning-progress/${encodeURIComponent(contentId)}`,
    { method: 'PUT', body: JSON.stringify(body) },
  )
  return item
}

export async function deleteLearningProgress(contentId: string) {
  return apiRequest<{ ok: boolean }>(
    `/api/users/me/learning-progress/${encodeURIComponent(contentId)}`,
    { method: 'DELETE' },
  )
}
