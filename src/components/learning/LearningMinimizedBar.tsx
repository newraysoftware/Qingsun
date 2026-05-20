import { BookOpen, X } from 'lucide-react'
import type { TrainingContent, ContentLearningProgress } from '../../types'

interface LearningMinimizedBarProps {
  content: TrainingContent
  progress?: ContentLearningProgress
  onRestore: () => void
  onClose: () => void
}

export function LearningMinimizedBar({
  content,
  progress,
  onRestore,
  onClose,
}: LearningMinimizedBarProps) {
  const pct = progress?.progressPercent ?? 0

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex max-w-[min(100vw-2rem,360px)] items-center gap-2 rounded-full border border-primary-200 bg-white py-2 pl-3 pr-2 shadow-lg ring-1 ring-primary-100">
      <button
        type="button"
        onClick={onRestore}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
        aria-label="恢复学习窗口"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
          <BookOpen className="h-4 w-4" />
        </span>
        <span className="min-w-0 truncate text-sm font-medium text-slate-800">{content.title}</span>
        <span className="shrink-0 text-xs text-primary-700">{pct}%</span>
      </button>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        aria-label="结束学习"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
