import { useState } from 'react'
import { STAGE_LABEL, TRAINING_STAGES } from '../data/trainingSystem'
import type { TrainingStageId } from '../types'
import { useApp } from '../context/AppContext'

const SCENES: Record<TrainingStageId, { title: string; steps: string[] }> = {
  foundation: {
    title: '股动脉穿刺 · 国产DSA基础',
    steps: ['超声定位穿刺点', '18G针45°进针', 'DSA正位确认导丝', '压迫止血15分钟'],
  },
  advanced: {
    title: 'PTCD引流术 · 进阶参数',
    steps: ['肝内胆管穿刺', '导丝交换', '内外引流管放置', '剂量优化透视'],
  },
  authorization: {
    title: 'TIPS术 · 高级协同',
    steps: ['颈静脉入路', '门静脉穿刺', '球囊扩张', '覆膜支架释放'],
  },
  mastery: {
    title: '肺动脉取栓 · 多团队协作',
    steps: ['肺动脉造影', '抽吸导管到位', '取栓与复查', 'ICU交接'],
  },
}

export function VirtualPractice() {
  const { user, showToast } = useApp()
  const [stage, setStage] = useState<TrainingStageId>(user.stageId)
  const [step, setStep] = useState(0)
  const [feedback, setFeedback] = useState('')
  const scene = SCENES[stage]

  const nextStep = () => {
    if (step < scene.steps.length - 1) {
      setStep(step + 1)
      setFeedback('操作正确，进入下一步')
      showToast('步骤完成')
    } else {
      setFeedback('本次实操已完成，记录已保存，可复盘对比')
      showToast('实操记录已保存')
    }
  }

  const simulateError = () => {
    setFeedback('⚠ 进针角度偏大，请调整至45°；已启动语音指导')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="section-title">虚拟实操演练</h1>
      <p className="section-subtitle">1:1还原导管室与国产DSA，实时错误反馈与语音指导</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {TRAINING_STAGES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => { setStage(s.id); setStep(0); setFeedback('') }}
            className={`rounded-full px-3 py-1 text-sm ${stage === s.id ? 'bg-primary-600 text-white' : 'bg-slate-100'}`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 card min-h-[360px] bg-slate-900 text-white">
          <p className="text-xs text-primary-300">{STAGE_LABEL[stage]} · 虚拟导管室</p>
          <h2 className="mt-2 text-xl font-semibold">{scene.title}</h2>
          <div className="mt-8 flex h-48 items-center justify-center rounded-lg border border-slate-600 bg-slate-800">
            <div className="text-center">
              <div className="mx-auto h-24 w-40 rounded border-2 border-primary-400/50 bg-slate-700 flex items-center justify-center text-sm text-slate-400">
                国产 DSA 影像区
              </div>
              <p className="mt-4 text-sm text-primary-200">当前步骤：{scene.steps[step]}</p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={nextStep} className="btn-primary">执行操作</button>
            <button type="button" onClick={simulateError} className="btn-secondary border-slate-500 text-white hover:bg-slate-700">
              模拟纠错
            </button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold">操作步骤</h3>
            <ol className="mt-2 space-y-2">
              {scene.steps.map((s, i) => (
                <li key={s} className={`text-sm ${i <= step ? 'text-primary-700 font-medium' : 'text-slate-400'}`}>
                  {i + 1}. {s}
                </li>
              ))}
            </ol>
          </div>
          {feedback && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{feedback}</div>
          )}
          <p className="text-xs text-slate-500">支持实操记录保存与复盘对比（本地存储）</p>
        </div>
      </div>
    </div>
  )
}
