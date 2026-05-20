import { useMemo } from 'react'
import { TRAINING_STAGES } from '../../data/trainingSystem'
import type { PlanTask, TrainingContent, TrainingStageId, ContentType, LearningStatus } from '../../types'
import type { ContentLearningProgress } from '../../types'
import { ContentEntryRow } from './ContentEntryRow'

interface ContentBrowseListProps {
  items: TrainingContent[]
  tasks: PlanTask[]
  stageFilter: TrainingStageId | ''
  typeFilter: ContentType | null
  progressFilter: LearningStatus | ''
  ready: boolean
  getProgress: (contentId: string) => ContentLearningProgress
  contentLink: (contentId: string) => string
}

function matchesFilters(
  content: TrainingContent,
  typeFilter: ContentType | null,
  progressFilter: LearningStatus | '',
  ready: boolean,
  getProgress: (id: string) => ContentLearningProgress,
): boolean {
  if (typeFilter && content.category !== typeFilter) return false
  if (progressFilter && ready) {
    if (getProgress(content.id).status !== progressFilter) return false
  }
  return true
}

export function ContentBrowseList({
  items,
  tasks,
  stageFilter,
  typeFilter,
  progressFilter,
  ready,
  getProgress,
  contentLink,
}: ContentBrowseListProps) {
  const itemMap = useMemo(() => new Map(items.map((c) => [c.id, c])), [items])

  const stages = stageFilter
    ? TRAINING_STAGES.filter((s) => s.id === stageFilter)
    : TRAINING_STAGES

  const sections = useMemo(() => {
    return stages.map((stage) => {
      const stageTasks = tasks.filter((t) => t.stageId === stage.id)
      const linkedIds = new Set(stageTasks.map((t) => t.contentId))

      const taskRows = stageTasks
        .map((task) => {
          const content = itemMap.get(task.contentId)
          if (!content) return null
          if (!matchesFilters(content, typeFilter, progressFilter, ready, getProgress)) return null
          return { task, content }
        })
        .filter(Boolean) as { task: PlanTask; content: TrainingContent }[]

      const otherContents = items.filter(
        (c) =>
          c.stageId === stage.id &&
          !linkedIds.has(c.id) &&
          matchesFilters(c, typeFilter, progressFilter, ready, getProgress),
      )

      return { stage, taskRows, otherContents }
    })
  }, [stages, tasks, items, itemMap, typeFilter, progressFilter, ready, getProgress])

  const hasAny = sections.some((s) => s.taskRows.length > 0 || s.otherContents.length > 0)

  if (!hasAny) {
    return (
      <p className="mt-8 rounded-lg bg-slate-50 py-12 text-center text-sm text-slate-500">
        暂无符合筛选条件的培训内容
      </p>
    )
  }

  return (
    <div className="mt-6 space-y-8">
      {sections.map(({ stage, taskRows, otherContents }) => {
        if (taskRows.length === 0 && otherContents.length === 0) return null
        return (
          <section key={stage.id} className="scroll-mt-24">
            <div className="sticky top-0 z-10 -mx-4 border-b border-slate-200/80 bg-slate-50/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
              <h2 className="text-base font-semibold text-slate-900 md:text-lg">{stage.name}</h2>
              <p className="text-xs text-slate-500">{stage.period} · {stage.coreGoal.slice(0, 48)}…</p>
            </div>

            {taskRows.length > 0 && (
              <div className="mt-4 space-y-6">
                {taskRows.map(({ task, content }) => (
                  <div key={task.id}>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      培训规划 · 第{task.week}周
                      {task.completed && (
                        <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-green-700 normal-case">
                          任务已完成
                        </span>
                      )}
                    </p>
                    <ContentEntryRow
                      content={content}
                      progress={ready ? getProgress(content.id) : undefined}
                      taskTitle={task.title}
                      taskWeek={task.week}
                      to={contentLink(content.id)}
                    />
                  </div>
                ))}
              </div>
            )}

            {otherContents.length > 0 && (
              <div className={taskRows.length > 0 ? 'mt-6' : 'mt-4'}>
                <p className="mb-2 text-xs font-medium text-slate-400">更多培训内容</p>
                <ul className="space-y-2">
                  {otherContents.map((content) => (
                    <li key={content.id}>
                      <ContentEntryRow
                        content={content}
                        progress={ready ? getProgress(content.id) : undefined}
                        to={contentLink(content.id)}
                        compact
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
