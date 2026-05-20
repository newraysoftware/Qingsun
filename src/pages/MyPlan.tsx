import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Link2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useLearningProgress } from '../context/LearningProgressContext'
import { ContentProgressBar } from '../components/ContentProgressBar'
import { STAGE_LABEL } from '../data/trainingSystem'
import type { TrainingStageId } from '../types'
import { CONTENT_TYPE_LABEL } from '../data/content'

export function MyPlan() {
  const [params] = useSearchParams()
  const stageParam = params.get('stage') as TrainingStageId | null
  const { user, tasks, completeTask, generatePlanFromAssessment } = useApp()
  const { ready, getProgress } = useLearningProgress()
  const [showAssessment, setShowAssessment] = useState(!user.assessmentDone)
  const [years, setYears] = useState(1)
  const [weakInput, setWeakInput] = useState('国产DSA操作,影像读片')

  const currentStage = stageParam || user.stageId
  const stageTasks = tasks.filter((t) => t.stageId === currentStage)
  const pending = stageTasks.filter((t) => !t.completed)

  const handleAssessment = () => {
    const weakAreas = weakInput.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
    generatePlanFromAssessment(years, weakAreas)
    setShowAssessment(false)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="section-title">我的培训规划</h1>
      <p className="section-subtitle">基于入学测评的专属自学计划，支持周/月复盘与任务提醒</p>

      {showAssessment && (
        <div className="mt-6 card border-primary-200 bg-primary-50/30">
          <h2 className="font-semibold text-slate-900">入学测评</h2>
          <p className="mt-1 text-sm text-slate-600">根据从业年限与薄弱项，生成专属四级体系学习计划</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              从业年限
              <input
                type="number"
                min={0}
                max={20}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              薄弱项（逗号分隔）
              <input
                type="text"
                value={weakInput}
                onChange={(e) => setWeakInput(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
          </div>
          <button type="button" onClick={handleAssessment} className="btn-primary mt-4">
            生成专属计划
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-slate-500">当前阶段</p>
          <p className="mt-1 text-lg font-semibold text-primary-700">{STAGE_LABEL[currentStage]}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">规划完成度</p>
          <p className="mt-1 text-lg font-semibold">{user.planProgress}%</p>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-primary-500" style={{ width: `${user.planProgress}%` }} />
          </div>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">薄弱点</p>
          <ul className="mt-1 text-sm text-amber-700">
            {user.weakAreas.map((w) => (
              <li key={w}>· {w}</li>
            ))}
          </ul>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          您有 {pending.length} 项未完成任务，截止日期临近将自动提醒
        </div>
      )}

      <h2 className="mt-8 text-lg font-semibold">本周 / 本月学习任务</h2>
      <ul className="mt-4 space-y-3">
        {stageTasks.map((task) => (
            <li key={task.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                {task.completed ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                ) : (
                  <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-slate-300" />
                )}
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-slate-500">
                    第{task.week}周 · 截止 {task.dueDate} · {CONTENT_TYPE_LABEL[task.type]}
                  </p>
                  {ready && (
                    <ContentProgressBar
                      progress={getProgress(task.contentId)}
                      className="mt-2 max-w-xs"
                    />
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {!task.completed && (
                  <button type="button" onClick={() => completeTask(task.id)} className="btn-secondary text-xs">
                    标记完成
                  </button>
                )}
                <Link
                  to={`/content?id=${task.contentId}&learn=1`}
                  className="btn-primary flex items-center gap-1 text-xs"
                >
                  <Link2 className="h-3 w-3" />
                  {ready && getProgress(task.contentId).status === 'in_progress'
                    ? '继续学习'
                    : '开始学习'}
                </Link>
              </div>
            </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/assessment" className="btn-secondary">阶段考核</Link>
        <Link to="/content" className="btn-secondary">浏览全部内容</Link>
        <button type="button" onClick={() => setShowAssessment(true)} className="text-sm text-primary-600 hover:underline">
          重新测评并调整规划
        </button>
      </div>
    </div>
  )
}
