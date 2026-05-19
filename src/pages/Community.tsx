import { COMMUNITY_GROUPS } from '../data/experts'
import { STAGE_LABEL } from '../data/trainingSystem'
import { MessageSquare, Users } from 'lucide-react'

export function Community() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="section-title">交流互动</h1>
      <p className="section-subtitle">按培训阶段与内容分类的交流小组，病例研讨与专家答疑</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {COMMUNITY_GROUPS.map((g) => (
          <article key={g.id} className="card active:scale-[0.99] cursor-pointer">
            <span className="text-xs font-medium text-primary-600">{g.category}</span>
            <h2 className="mt-1 text-lg font-semibold">{g.name}</h2>
            {g.stageId && (
              <p className="text-xs text-slate-500">{STAGE_LABEL[g.stageId]}</p>
            )}
            <div className="mt-4 flex gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {g.members} 人</span>
              <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> {g.posts} 帖</span>
            </div>
            <button type="button" className="btn-primary mt-4 w-full text-sm">加入小组</button>
          </article>
        ))}
      </div>

      <div className="mt-8 card">
        <h3 className="font-semibold">发布学习疑问</h3>
        <textarea
          className="mt-2 w-full rounded-lg border border-slate-200 p-3 text-sm"
          rows={3}
          placeholder="描述病例或学习问题，专家与同行将为您解答…"
        />
        <button type="button" className="btn-primary mt-2 text-sm">发布</button>
      </div>
    </div>
  )
}
