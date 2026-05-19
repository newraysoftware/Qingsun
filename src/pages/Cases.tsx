import { useState } from 'react'
import { CASE_STUDIES } from '../data/cases'
import { STAGE_LABEL } from '../data/trainingSystem'

export function Cases() {
  const [selected, setSelected] = useState(CASE_STUDIES[0])
  const [comment, setComment] = useState('')

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="section-title">典型案例库</h1>
      <p className="section-subtitle">术前评估 · 术中操作（国产DSA要点）· 术后复盘 · 专家解读</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ul className="space-y-2 lg:col-span-1">
          {CASE_STUDIES.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setSelected(c)}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition active:scale-[0.99] ${
                  selected.id === c.id ? 'border-primary-500 bg-primary-50' : 'border-slate-200 bg-white'
                }`}
              >
                <span className="text-xs text-primary-600">{STAGE_LABEL[c.stageId]} · {c.direction}</span>
                <p className="mt-1 font-medium">{c.title}</p>
              </button>
            </li>
          ))}
        </ul>

        <article className="card lg:col-span-2">
          <span className="rounded bg-primary-100 px-2 py-0.5 text-xs text-primary-800">{selected.focus}</span>
          <h2 className="mt-2 text-xl font-semibold">{selected.title}</h2>

          <section className="mt-6">
            <h3 className="font-medium text-slate-800">术前评估</h3>
            <p className="mt-1 text-sm text-slate-600">{selected.preOp}</p>
          </section>
          <section className="mt-4">
            <h3 className="font-medium text-slate-800">术中操作</h3>
            <p className="mt-1 text-sm text-slate-600">{selected.intraOp}</p>
            <p className="mt-2 rounded-lg bg-primary-50 p-3 text-sm text-primary-900">
              <strong>国产DSA要点：</strong>{selected.dsaPoints}
            </p>
          </section>
          <section className="mt-4">
            <h3 className="font-medium text-slate-800">术后复盘</h3>
            <p className="mt-1 text-sm text-slate-600">{selected.postOp}</p>
          </section>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <h3 className="font-medium">讨论与提问</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="分享您的见解或疑问…"
              className="mt-2 w-full rounded-lg border border-slate-200 p-3 text-sm"
              rows={3}
            />
            <button type="button" className="btn-primary mt-2 text-sm">提交讨论</button>
            <p className="mt-3 text-xs text-slate-400">专家可入驻解答 · 定期更新案例</p>
          </div>
        </article>
      </div>
    </div>
  )
}
