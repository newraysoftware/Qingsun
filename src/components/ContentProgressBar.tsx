import type { ContentLearningProgress } from '../types'
import { learningStatusLabel } from '../utils/learning'

interface ContentProgressBarProps {
  progress: ContentLearningProgress | undefined
  className?: string
}

export function ContentProgressBar({ progress, className = '' }: ContentProgressBarProps) {
  const percent = progress?.progressPercent ?? 0
  const status = progress?.status ?? 'not_started'

  return (
    <div className={className}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600">{learningStatusLabel(status, percent)}</span>
        <span className="font-medium text-primary-700">{percent}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            status === 'completed' ? 'bg-green-500' : 'bg-primary-500'
          }`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  )
}
