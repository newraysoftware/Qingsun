import { useSearchParams, Link } from 'react-router-dom'
import { TRAINING_CONTENTS, CONTENT_TYPE_LABEL } from '../data/content'
import { STAGE_LABEL, TRAINING_STAGES } from '../data/trainingSystem'
import type { TrainingStageId, ContentType } from '../types'

const TYPES: ContentType[] = ['theory', 'dsa', 'virtual', 'case']

export function ContentHub() {
  const [params] = useSearchParams()
  const stageFilter = (params.get('stage') as TrainingStageId) || ''
  const idFilter = params.get('id')
  const typeFilter = params.get('type') as ContentType | null

  let items = TRAINING_CONTENTS
  if (stageFilter) items = items.filter((c) => c.stageId === stageFilter)
  if (typeFilter) items = items.filter((c) => c.type === typeFilter)
  if (idFilter) items = items.filter((c) => c.id === idFilter)

  const detail = idFilter ? TRAINING_CONTENTS.find((c) => c.id === idFilter) : null

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="section-title">分阶段培训内容</h1>
      <p className="section-subtitle">按培训体系阶段分层，覆盖理论、国产DSA、虚拟实操、典型案例</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/content" className={`rounded-full px-3 py-1 text-sm ${!stageFilter ? 'bg-primary-600 text-white' : 'bg-slate-100'}`}>
          全部
        </Link>
        {TRAINING_STAGES.map((s) => (
          <Link
            key={s.id}
            to={`/content?stage=${s.id}`}
            className={`rounded-full px-3 py-1 text-sm ${stageFilter === s.id ? 'bg-primary-600 text-white' : 'bg-slate-100'}`}
          >
            {s.name}
          </Link>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <Link
            key={t}
            to={`/content?type=${t}${stageFilter ? `&stage=${stageFilter}` : ''}`}
            className="rounded-lg border border-slate-200 px-3 py-1 text-xs hover:border-primary-400"
          >
            {CONTENT_TYPE_LABEL[t]}
          </Link>
        ))}
      </div>

      {detail && (
        <article className="mt-6 card border-primary-200">
          <span className="text-xs text-primary-600">
            {STAGE_LABEL[detail.stageId]} · {CONTENT_TYPE_LABEL[detail.type]}
          </span>
          <h2 className="mt-2 text-xl font-semibold">{detail.title}</h2>
          <p className="mt-2 text-slate-600">{detail.description}</p>
          <p className="mt-2 text-sm text-slate-500">预计时长：{detail.duration}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {detail.tags.map((tag) => (
              <span key={tag} className="rounded bg-slate-100 px-2 py-0.5 text-xs">{tag}</span>
            ))}
          </div>
          {detail.type === 'virtual' && (
            <Link to="/virtual" className="btn-primary mt-4 inline-flex">进入虚拟实操</Link>
          )}
          {detail.type === 'case' && (
            <Link to="/cases" className="btn-primary mt-4 inline-flex">查看相关案例</Link>
          )}
        </article>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <Link key={c.id} to={`/content?id=${c.id}`} className="card block active:scale-[0.99]">
            <span className="text-xs font-medium text-primary-600">{CONTENT_TYPE_LABEL[c.type]}</span>
            <h3 className="mt-1 font-semibold">{c.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm text-slate-500">{c.description}</p>
            <p className="mt-2 text-xs text-slate-400">{STAGE_LABEL[c.stageId]} · {c.duration}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
