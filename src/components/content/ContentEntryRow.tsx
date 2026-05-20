import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { TrainingContent, ContentLearningProgress } from '../../types'
import { STAGE_LABEL } from '../../data/trainingSystem'
import { ContentProgressBar } from '../ContentProgressBar'
import { contentFormatLabel, progressStatusBadgeClass } from '../../utils/contentDisplay'
import { learningStatusLabel } from '../../utils/learning'

interface ContentEntryRowProps {
  content: TrainingContent
  progress?: ContentLearningProgress
  taskTitle?: string
  taskWeek?: number
  to: string
  compact?: boolean
}

export function ContentEntryRow({
  content,
  progress,
  taskTitle,
  taskWeek,
  to,
  compact = false,
}: ContentEntryRowProps) {
  const status = progress?.status ?? 'not_started'
  const percent = progress?.progressPercent ?? 0

  return (
    <Link
      to={to}
      className={`group flex gap-3 rounded-lg border border-slate-100 bg-white p-3 transition hover:border-primary-200 hover:shadow-sm active:scale-[0.99] ${
        compact ? '' : 'sm:p-4'
      }`}
    >
      {content.previewImageUrl ? (
        <img
          src={content.previewImageUrl}
          alt=""
          className="h-16 w-24 shrink-0 rounded-md object-cover sm:h-20 sm:w-28"
          loading="lazy"
        />
      ) : (
        <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md bg-primary-50 text-xs text-primary-600 sm:h-20 sm:w-28">
          {contentFormatLabel(content.category, content.mediaType).slice(0, 4)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h4 className="line-clamp-2 font-medium text-slate-900 group-hover:text-primary-700">
            {content.title}
          </h4>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium sm:text-xs ${progressStatusBadgeClass(status)}`}
          >
            {learningStatusLabel(status, percent)}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          <span className="text-primary-600">{STAGE_LABEL[content.stageId]}</span>
          <span className="mx-1 text-slate-300">·</span>
          {contentFormatLabel(content.category, content.mediaType)}
          <span className="mx-1 text-slate-300">·</span>
          {content.duration}
        </p>
        {taskTitle && (
          <p className="mt-0.5 text-xs text-slate-400">
            规划任务：第{taskWeek}周 · {taskTitle}
          </p>
        )}
        {status === 'in_progress' && progress && (
          <ContentProgressBar progress={progress} className="mt-2 max-w-xs" />
        )}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 self-center text-slate-300 group-hover:text-primary-500" />
    </Link>
  )
}
