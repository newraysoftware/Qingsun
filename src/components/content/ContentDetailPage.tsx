import { Bookmark, PlayCircle, Share2 } from 'lucide-react'
import type { TrainingContent } from '../../types'
import type { ContentLearningProgress } from '../../types'
import type { PlanTask } from '../../types'
import { STAGE_LABEL } from '../../data/trainingSystem'
import { ContentPreview } from '../preview/ContentPreview'
import { ContentProgressBar } from '../ContentProgressBar'
import { contentFormatLabel } from '../../utils/contentDisplay'
import { learningActionLabel, learningStatusLabel } from '../../utils/learning'
interface ContentDetailPageProps {
  content: TrainingContent
  progress?: ContentLearningProgress
  linkedTask?: PlanTask
  ready: boolean
  isFavorite: boolean
  onToggleFavorite: () => void
  onShare: () => void
  onStartLearning: () => void
  onBack: () => void
}

export function ContentDetailPage({
  content,
  progress,
  linkedTask,
  ready,
  isFavorite,
  onToggleFavorite,
  onShare,
  onStartLearning,
  onBack,
}: ContentDetailPageProps) {
  const status = progress?.status ?? 'not_started'

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 sm:pb-32">
      <article className="mx-auto max-w-4xl">
        {/* ① 内容基础信息 */}
        <header className="card border-primary-200">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-primary-100 px-2.5 py-0.5 font-medium text-primary-800">
              {STAGE_LABEL[content.stageId]}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
              {contentFormatLabel(content.category, content.mediaType)}
            </span>
            {ready && (
              <span
                className={`rounded-full px-2.5 py-0.5 font-medium ${
                  status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : status === 'in_progress'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                {learningStatusLabel(status, progress?.progressPercent ?? 0)}
              </span>
            )}
          </div>

          <h1 className="mt-3 text-xl font-semibold text-slate-900 md:text-2xl">{content.title}</h1>

          {linkedTask && (
            <p className="mt-2 text-sm text-primary-700">
              对应规划任务：第{linkedTask.week}周 · {linkedTask.title}
              {linkedTask.completed && (
                <span className="ml-2 text-green-600">（已完成）</span>
              )}
            </p>
          )}

          <p className="mt-3 text-sm leading-relaxed text-slate-600">{content.description}</p>

          <p className="mt-2 text-sm text-slate-500">预计学习时长：{content.duration}</p>

          {ready && progress && (
            <ContentProgressBar progress={progress} className="mt-4 max-w-md" />
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {content.tags.map((tag) => (
              <span key={tag} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {tag}
              </span>
            ))}
          </div>
        </header>

        {/* ② 课件预览 */}
        <section className="mt-4 card">
          <h2 className="text-sm font-semibold text-slate-800">课件预览</h2>
          <p className="mt-1 text-xs text-slate-500">
            无需开始学习即可快速了解课件要点；正式学习请点击底部「开始学习」
          </p>
          <div className="mt-4 min-h-[200px]">
            <ContentPreview content={content} />
          </div>
        </section>
      </article>

      {/* ③ 底部固定操作栏 */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        role="toolbar"
        aria-label="内容操作"
      >
        <div className="mx-auto flex max-w-4xl items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary shrink-0 px-3 py-2.5 text-xs sm:px-4 sm:text-sm"
          >
            返回列表
          </button>
          <button
            type="button"
            onClick={onToggleFavorite}
            className={`btn-secondary shrink-0 px-3 py-2.5 text-xs sm:text-sm ${
              isFavorite ? 'border-amber-300 bg-amber-50 text-amber-800' : ''
            }`}
            aria-pressed={isFavorite}
          >
            <Bookmark className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            <span className="hidden xs:inline sm:inline">{isFavorite ? '已收藏' : '收藏'}</span>
          </button>
          <button
            type="button"
            onClick={onShare}
            className="btn-secondary shrink-0 px-3 py-2.5 text-xs sm:text-sm"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">分享</span>
          </button>
          <button
            type="button"
            onClick={onStartLearning}
            className="btn-primary min-w-0 flex-1 py-2.5 text-sm sm:flex-[1.2]"
          >
            <PlayCircle className="h-5 w-5 shrink-0" />
            {learningActionLabel(progress)}
          </button>
        </div>
      </div>
    </div>
  )
}
