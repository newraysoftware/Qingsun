import { useState } from 'react'
import { TOOLS } from '../data/experts'
import { STAGE_LABEL } from '../data/trainingSystem'

export function Tools() {
  const [query, setQuery] = useState('')
  const filtered = TOOLS.filter(
    (t) => !query || t.name.includes(query) || t.desc.includes(query),
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="section-title">资讯 + 工具中心</h1>
      <p className="section-subtitle">适配各阶段的实用工具，支持关键词搜索</p>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索工具，如 解剖、器械、剂量"
        className="mt-4 w-full max-w-md rounded-lg border border-slate-200 px-4 py-2 text-sm"
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {filtered.map((t) => (
          <article key={t.id} className="card">
            <h2 className="font-semibold">{t.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{t.desc}</p>
            <p className="mt-2 text-xs text-slate-400">
              适用：{t.stages.map((s) => STAGE_LABEL[s as keyof typeof STAGE_LABEL]).join('、')}
            </p>
            <button type="button" className="btn-primary mt-4 text-sm">打开工具</button>
          </article>
        ))}
      </div>
    </div>
  )
}
