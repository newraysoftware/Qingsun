import type { ContentLearningProgress, TrainingContent } from '../types'
import { getPreviewKind } from './previewKind'
import { parseLearningMeta } from './learningMeta'
import { learningStatusLabel } from './learning'

function formatVideoTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}分${s.toString().padStart(2, '0')}秒`
}

export function learningPositionSummary(
  content: TrainingContent,
  progress: ContentLearningProgress,
): string {
  const pos = progress.lastPosition
  if (!pos) return '—'

  const meta = parseLearningMeta(pos.meta)
  const kind = getPreviewKind(content)

  if (pos.kind === 'pdf' || pos.kind === 'ppt') {
    const n = Math.max(1, Math.round(pos.value))
    const hl = meta.highlights?.length ?? 0
    return hl > 0 ? `第 ${n} 页 · ${hl} 条标注` : `第 ${n} 页`
  }

  if (pos.kind === 'video' || kind === 'video') {
    const extra =
      meta.playbackRate && meta.playbackRate !== 1 ? ` · ${meta.playbackRate}x` : ''
    return `${formatVideoTime(pos.value)}${extra}`
  }

  if (kind === 'animation3d') {
    if (meta.animationElapsed != null) {
      return `已播放 ${formatVideoTime(meta.animationElapsed)}`
    }
    if (meta.cameraOrbit) return '已保存查看角度'
    return pos.value > 0 ? formatVideoTime(pos.value) : '进行中'
  }

  if (content.mediaType === 'vr' || pos.kind === 'vr') {
    if (meta.fbxCamera || meta.cameraOrbit) return '已保存查看视角'
    return 'VR 学习进行中'
  }

  return learningStatusLabel(progress.status, progress.progressPercent)
}
