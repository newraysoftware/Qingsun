import { TRAINING_STAGES, STAGE_LABEL } from '../data/trainingSystem'
import { useApp } from '../context/AppContext'
import type { TrainingStageId } from '../types'

export function Assessment() {
  const { user, runAssessment } = useApp()

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="section-title">培训考核评估</h1>
      <p className="section-subtitle">按四级体系设置月/季/年考核，理论笔试 + 虚拟实操，生成达标报告</p>

      <div className="mt-6 card">
        <h2 className="font-semibold">当前阶段考核</h2>
        <p className="mt-1 text-sm text-slate-600">
          您处于 {STAGE_LABEL[user.stageId]}，考核内容匹配本阶段规划与培训内容（含国产DSA考点）
        </p>
        <button
          type="button"
          onClick={() => runAssessment(user.stageId)}
          className="btn-primary mt-4"
        >
          开始模拟考核
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {TRAINING_STAGES.map((stage) => (
          <AssessmentCard key={stage.id} stageId={stage.id} name={stage.name} onRun={runAssessment} />
        ))}
      </div>

      <p className="mt-6 text-sm text-slate-500">
        未达标将自动调整后续培训规划，补充对应薄弱内容；达标可获得积分与体系进度提升。
      </p>
    </div>
  )
}

function AssessmentCard({
  stageId,
  name,
  onRun,
}: {
  stageId: TrainingStageId
  name: string
  onRun: (id: TrainingStageId) => void
}) {
  return (
    <div className="card">
      <h3 className="font-semibold">{name}</h3>
      <ul className="mt-2 text-sm text-slate-600 space-y-1">
        <li>· 理论笔试（含国产DSA）</li>
        <li>· 虚拟实操考核</li>
        <li>· 月 / 季 / 年节点</li>
      </ul>
      <button type="button" onClick={() => onRun(stageId)} className="btn-secondary mt-4 w-full text-sm">
        参加考核
      </button>
    </div>
  )
}
