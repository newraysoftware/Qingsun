import type { ContentLearningProgress, LearningStatus } from '../types'

export const LEARNING_COMPLETE_THRESHOLD = 90

export function parseDurationMinutes(duration: string): number {
  const m = duration.match(/(\d+)\s*分钟/)
  if (m) return Number(m[1])
  const h = duration.match(/(\d+)\s*小时/)
  if (h) return Number(h[1]) * 60
  return 30
}

export function emptyProgress(contentId: string): ContentLearningProgress {
  return {
    contentId,
    status: 'not_started',
    progressPercent: 0,
    lastPosition: null,
    startedAt: null,
    completedAt: null,
    updatedAt: new Date().toISOString(),
  }
}

export function learningStatusLabel(status: LearningStatus, percent: number): string {
  if (status === 'completed') return '已完成'
  if (status === 'in_progress') return `学习中 ${percent}%`
  return '未开始'
}

export function learningActionLabel(progress: ContentLearningProgress | undefined): string {
  if (!progress || progress.status === 'not_started') return '开始学习'
  if (progress.status === 'completed') return '复习'
  return '继续学习'
}
