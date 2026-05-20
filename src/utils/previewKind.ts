import type { TrainingContent } from '../types'

export type PreviewKind = 'document' | 'video' | 'animation3d' | 'vr' | 'text'

const PREVIEW_3D = /3d|动画|三维/i

export function getPreviewKind(content: TrainingContent): PreviewKind {
  if (content.mediaType === 'vr') return 'vr'
  if (content.mediaType === 'pdf' || content.mediaType === 'ppt') return 'document'
  if (content.mediaType === 'video') {
    const hint = `${content.title} ${content.tags.join(' ')}`
    if (PREVIEW_3D.test(hint)) return 'animation3d'
    return 'video'
  }
  if (content.mediaType === 'none') return 'text'
  return 'text'
}

export function estimatePdfPages(content: TrainingContent): number {
  if (content.contentFileSize) {
    return Math.max(3, Math.min(120, Math.round(content.contentFileSize / 85_000)))
  }
  return Math.max(3, Math.ceil(parseDurationMinutes(content.duration) / 2))
}

export function estimatePptSlides(content: TrainingContent): number {
  if (content.contentFileSize) {
    return Math.max(3, Math.min(80, Math.round(content.contentFileSize / 120_000)))
  }
  return Math.max(3, Math.ceil(parseDurationMinutes(content.duration) / 3))
}

function parseDurationMinutes(duration: string): number {
  const m = duration.match(/(\d+)\s*分钟/)
  if (m) return Number(m[1])
  return 20
}

export function vrInteractionHint(_content: TrainingContent): string {
  return '左键旋转 · 中键或滚轮缩放 · 右键平移'
}
