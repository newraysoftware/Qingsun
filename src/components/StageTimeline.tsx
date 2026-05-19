import { Link } from 'react-router-dom'
import { TRAINING_STAGES } from '../data/trainingSystem'
import type { TrainingStageId } from '../types'

interface StageTimelineProps {
  horizontal?: boolean
  linkToPlan?: boolean
  activeId?: TrainingStageId
  onSelect?: (id: TrainingStageId) => void
}

export function StageTimeline({
  horizontal = true,
  linkToPlan = true,
  activeId,
  onSelect,
}: StageTimelineProps) {
  return (
    <div
      className={
        horizontal
          ? 'flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin'
          : 'space-y-4'
      }
    >
      {TRAINING_STAGES.map((stage, index) => {
        const isActive = activeId === stage.id
        const inner = (
          <div
            className={`min-w-[240px] snap-start rounded-xl border-2 bg-white p-4 transition active:scale-[0.99] ${
              isActive ? 'border-primary-500 shadow-md' : 'border-slate-200 hover:border-primary-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${stage.color} text-sm font-bold text-white`}
              >
                {index + 1}
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">{stage.name}</h3>
                <p className="text-xs text-primary-600">{stage.period}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600 line-clamp-2">{stage.coreGoal}</p>
            <ul className="mt-2 space-y-1">
              {stage.keyContent.slice(0, 3).map((k) => (
                <li key={k} className="text-xs text-slate-500 before:mr-1 before:text-primary-400 before:content-['•']">
                  {k}
                </li>
              ))}
            </ul>
            {linkToPlan && (
              <div className="mt-3 flex gap-2 text-xs">
                <span className="text-primary-600">规划 →</span>
                <span className="text-slate-400">内容 →</span>
              </div>
            )}
          </div>
        )

        if (onSelect) {
          return (
            <button key={stage.id} type="button" onClick={() => onSelect(stage.id)} className="text-left">
              {inner}
            </button>
          )
        }

        return (
          <Link
            key={stage.id}
            to={`/plan?stage=${stage.id}`}
            state={{ contentStage: stage.id }}
            className="block"
          >
            {inner}
          </Link>
        )
      })}
    </div>
  )
}
