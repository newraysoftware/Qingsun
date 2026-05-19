import { useApp } from '../context/AppContext'
import { STAGE_LABEL } from '../data/trainingSystem'
import { Calendar, Trophy, Gift } from 'lucide-react'

const LEADERBOARD = [
  { name: '医师A', streak: 28, progress: 92 },
  { name: '医师B', streak: 21, progress: 85 },
  { name: '医师C', streak: 15, progress: 78 },
]

const REWARDS = [
  { stage: 'foundation', item: '基础案例精讲包', cost: 100 },
  { stage: 'advanced', item: 'TACE专家答疑1次', cost: 300 },
  { stage: 'authorization', item: '授权考核模拟卷', cost: 500 },
  { stage: 'mastery', item: '罕见病例库访问', cost: 800 },
]

export function Incentives() {
  const { user, checkIn, checkedInToday, showToast } = useApp()

  const redeem = (item: string, cost: number) => {
    if (user.points < cost) {
      showToast('积分不足')
      return
    }
    showToast(`已兑换：${item}`)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="section-title">学习激励</h1>
      <p className="section-subtitle">每日打卡 · 任务积分 · 阶段资源兑换 · 进度榜单</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4">
          <Calendar className="h-10 w-10 text-primary-600" />
          <div>
            <p className="text-sm text-slate-500">连续打卡</p>
            <p className="text-2xl font-bold">{user.streak} 天</p>
          </div>
          <button
            type="button"
            onClick={checkIn}
            disabled={checkedInToday}
            className="btn-primary ml-auto text-sm disabled:opacity-50"
          >
            {checkedInToday ? '已打卡' : '今日打卡'}
          </button>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">当前积分</p>
          <p className="text-2xl font-bold text-primary-700">{user.points}</p>
          <p className="text-xs text-slate-400 mt-1">连续7天额外+10积分</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">体系进度</p>
          <p className="text-2xl font-bold">{user.planProgress}%</p>
        </div>
      </div>

      <h2 className="mt-10 text-lg font-semibold flex items-center gap-2">
        <Gift className="h-5 w-5" /> 积分兑换（按培训阶段）
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {REWARDS.map((r) => (
          <div key={r.item} className="card flex justify-between items-center">
            <div>
              <p className="font-medium">{r.item}</p>
              <p className="text-xs text-slate-500">{STAGE_LABEL[r.stage as keyof typeof STAGE_LABEL]}</p>
            </div>
            <button type="button" onClick={() => redeem(r.item, r.cost)} className="btn-secondary text-sm">
              {r.cost} 积分
            </button>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold flex items-center gap-2">
        <Trophy className="h-5 w-5" /> 打卡榜 · 体系进度榜
      </h2>
      <table className="mt-4 w-full card overflow-hidden text-sm">
        <thead>
          <tr className="border-b text-left text-slate-500">
            <th className="pb-2">排名</th>
            <th className="pb-2">学员</th>
            <th className="pb-2">连续打卡</th>
            <th className="pb-2">体系进度</th>
          </tr>
        </thead>
        <tbody>
          {LEADERBOARD.map((row, i) => (
            <tr key={row.name} className="border-b border-slate-50">
              <td className="py-3">{i + 1}</td>
              <td>{row.name}</td>
              <td>{row.streak}天</td>
              <td>{row.progress}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
