import { EXPERTS } from '../data/experts'
import { STAGE_LABEL } from '../data/trainingSystem'
import { Video, MessageCircle } from 'lucide-react'

export function Experts() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="section-title">专家资源库</h1>
      <p className="section-subtitle">按培训阶段与内容分类，直播授课、病例点评、在线咨询</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {EXPERTS.map((e) => (
          <article key={e.id} className="card">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">
                {e.name[0]}
              </div>
              <div>
                <h2 className="font-semibold">{e.name}</h2>
                <p className="text-sm text-slate-500">{e.title} · {e.hospital}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">{e.bio}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {e.specialties.map((s) => (
                <span key={s} className="rounded bg-slate-100 px-2 py-0.5 text-xs">{s}</span>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              服务阶段：{e.stages.map((s) => STAGE_LABEL[s]).join('、')}
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-primary flex-1 text-sm">
                <Video className="h-4 w-4" /> 预约直播
              </button>
              <button type="button" className="btn-secondary flex-1 text-sm">
                <MessageCircle className="h-4 w-4" /> 在线咨询
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
