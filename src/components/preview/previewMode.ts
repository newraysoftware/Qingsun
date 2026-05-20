import type { TrainingContent } from '../../types'

export type PreviewMode = 'document' | 'video' | 'animation3d' | 'vr' | 'text'

const PREVIEW_MAX_PAGES = 3
const PREVIEW_MAX_CHARS = 500
const VIDEO_PREVIEW_SECONDS = 30
const ANIMATION_PREVIEW_SECONDS = 20
const VR_TRIAL_SECONDS = 10

export const PREVIEW_LIMITS = {
  maxPages: PREVIEW_MAX_PAGES,
  maxChars: PREVIEW_MAX_CHARS,
  videoSeconds: VIDEO_PREVIEW_SECONDS,
  animationSeconds: ANIMATION_PREVIEW_SECONDS,
  vrTrialSeconds: VR_TRIAL_SECONDS,
  loadTimeoutMs: 2000,
}

export function getPreviewMode(content: TrainingContent): PreviewMode {
  if (content.mediaType === 'pdf' || content.mediaType === 'ppt') return 'document'
  if (content.mediaType === 'video') {
    if (content.tags.some((t) => /3d|3D|动画|解剖/i.test(t))) return 'animation3d'
    return 'video'
  }
  if (content.mediaType === 'vr') {
    if (content.category === 'virtual' || content.vrFormat === 'fbx') return 'vr'
    return 'animation3d'
  }
  return 'text'
}

/** 由文件大小粗估页数（预览标注用） */
export function estimatePageCount(content: TrainingContent): number {
  if (content.mediaType === 'ppt') {
    const mb = (content.contentFileSize ?? 0) / (1024 * 1024)
    return Math.max(3, Math.min(80, Math.round(mb * 3) || 12))
  }
  if (content.mediaType === 'pdf') {
    const mb = (content.contentFileSize ?? 0) / (1024 * 1024)
    return Math.max(1, Math.min(200, Math.round(mb * 8) || 10))
  }
  return 1
}

export function excerptText(text: string, max = PREVIEW_MAX_CHARS): string {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}
