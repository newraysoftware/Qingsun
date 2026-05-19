import { NEWS_ITEMS } from '../data/experts'
import { STAGE_LABEL } from '../data/trainingSystem'

export function News() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="section-title">行业资讯</h1>
      <p className="section-subtitle">按培训体系阶段分类推送政策、技术与指南更新</p>

      <ul className="mt-6 space-y-3">
        {NEWS_ITEMS.map((n) => (
          <li key={n.id} className="card flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs text-primary-600">{STAGE_LABEL[n.stageId]} · {n.category}</span>
              <h2 className="mt-1 font-semibold">{n.title}</h2>
            </div>
            <span className="text-sm text-slate-400">{n.date}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
