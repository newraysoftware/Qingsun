import type { ContentType, LearningStatus, MediaType } from '../types'
import { CONTENT_TYPE_LABEL } from '../data/content'

/** 课件形式标签（理论文档 / 视频 / VR 等） */
export function mediaTypeLabel(mediaType: MediaType): string {
  switch (mediaType) {
    case 'pdf':
      return '理论文档'
    case 'ppt':
      return '演示文稿'
    case 'video':
      return '视频'
    case 'vr':
      return 'VR课件'
    default:
      return '图文简介'
  }
}

/** 内容类型 + 课件形式组合展示 */
export function contentFormatLabel(category: ContentType, mediaType: MediaType): string {
  const cat = CONTENT_TYPE_LABEL[category]
  const media = mediaTypeLabel(mediaType)
  if (mediaType === 'none') return cat
  return `${cat} · ${media}`
}

export const PROGRESS_FILTER_OPTIONS: { value: '' | LearningStatus; label: string }[] = [
  { value: '', label: '全部进度' },
  { value: 'not_started', label: '未开始' },
  { value: 'in_progress', label: '学习中' },
  { value: 'completed', label: '已完成' },
]

export function progressStatusBadgeClass(status: LearningStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'in_progress':
      return 'bg-amber-100 text-amber-800'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}
