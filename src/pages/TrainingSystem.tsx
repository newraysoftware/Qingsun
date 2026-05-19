import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { StageTimeline } from '../components/StageTimeline'
import { TRAINING_STAGES } from '../data/trainingSystem'

export function TrainingSystem() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="section-title">培训体系总览</h1>
      <p className="section-subtitle">
        四级递进框架：规培基础期 → 专培进阶期 → 授权提升期 → 持续精进期
      </p>

      <div className="mt-8 rounded-xl border border-primary-100 bg-primary-50/50 p-6">
        <p className="text-sm text-slate-700">
          <strong>核心逻辑：</strong>培训体系（骨架）→ 培训规划（路径）→ 培训内容（支撑）。
          明确「处于哪个阶段 → 该学什么 → 怎么学 → 如何检验」。
        </p>
      </div>

      <div className="mt-8">
        <StageTimeline horizontal={false} linkToPlan />
      </div>

      <div className="mt-10 space-y-6">
        {TRAINING_STAGES.map((stage, i) => (
          <article key={stage.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className={`rounded-full bg-gradient-to-r ${stage.color} px-3 py-1 text-xs text-white`}>
                  第{i + 1}级 · {stage.period}
                </span>
                <h2 className="mt-2 text-xl font-semibold">{stage.name}</h2>
                <p className="mt-1 text-sm text-slate-500">适用：{stage.targetAudience}</p>
                <p className="mt-3 text-slate-700">{stage.coreGoal}</p>
              </div>
              <div className="flex gap-2">
                <Link to={`/plan?stage=${stage.id}`} className="btn-primary text-sm">
                  查看规划 <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to={`/content?stage=${stage.id}`} className="btn-secondary text-sm">
                  学习内容
                </Link>
              </div>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {stage.keyContent.map((k) => (
                <li key={k} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {k}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  )
}
