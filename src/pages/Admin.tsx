import { useState } from 'react'
import { ContentManager } from '../components/admin/ContentManager'
import { AssistantConfigManager } from '../components/admin/AssistantConfigManager'
import { STAGE_LABEL } from '../data/trainingSystem'

type Tab = 'content' | 'assistant' | 'users' | 'system' | 'stats' | 'incentives'

export function Admin() {
  const [tab, setTab] = useState<Tab>('content')
  const tabs: { id: Tab; label: string }[] = [
    { id: 'content', label: '内容管理' },
    { id: 'assistant', label: '智能学习助手' },
    { id: 'users', label: '用户管理' },
    { id: 'system', label: '培训体系' },
    { id: 'stats', label: '数据统计' },
    { id: 'incentives', label: '激励机制' },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="section-title">管理后台</h1>
      <p className="section-subtitle">支撑网站运营：内容审核、用户权限、体系配置与培训效果报告</p>

      <nav className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm ${tab === t.id ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === 'content' && <ContentManager />}
        {tab === 'assistant' && <AssistantConfigManager />}
        {tab === 'users' && (
          <div className="card">
            <p className="text-sm">自学者 1,280 · 专家 24 · 可查看学习进度与考核情况</p>
            <button type="button" className="btn-primary mt-4 text-sm">导出用户报表</button>
          </div>
        )}
        {tab === 'system' && (
          <div className="card space-y-3 text-sm">
            <p>调整四级培训体系目标与周期，确保与规划、内容匹配</p>
            {Object.entries(STAGE_LABEL).map(([id, label]) => (
              <label key={id} className="block">
                {label} 周期
                <input className="mt-1 w-full rounded border px-2 py-1" defaultValue={id === 'foundation' ? '0-3年' : ''} />
              </label>
            ))}
            <button type="button" className="btn-primary text-sm">保存体系配置</button>
          </div>
        )}
        {tab === 'stats' && (
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: '体系进度均值', value: '62%' },
              { label: '规划完成率', value: '58%' },
              { label: '考核通过率', value: '71%' },
              { label: '内容学习人次', value: '12.4k' },
            ].map((s) => (
              <div key={s.label} className="card text-center">
                <p className="text-2xl font-bold text-primary-700">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        )}
        {tab === 'incentives' && (
          <div className="card space-y-3 text-sm">
            <label>每日打卡积分 <input type="number" defaultValue={10} className="ml-2 rounded border px-2 py-1 w-20" /></label>
            <label>连续7天奖励 <input type="number" defaultValue={20} className="ml-2 rounded border px-2 py-1 w-20" /></label>
            <button type="button" className="btn-primary text-sm">保存规则</button>
          </div>
        )}
      </div>
    </div>
  )
}
