import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { STAGE_LABEL, TRAINING_STAGES } from '../data/trainingSystem'

export function Profile() {
  const { user, updateStage } = useApp()
  const { user: authUser, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="section-title">个人中心</h1>
      <p className="section-subtitle">同步显示体系进度、规划完成度与内容掌握情况</p>

      <div className="mt-6 card">
        <p className="text-lg font-semibold">{user.name}</p>
        {authUser && <p className="text-sm text-slate-500">{authUser.email}</p>}
        <p className="mt-1 text-sm text-slate-500">
          从业 {user.yearsOfPractice} 年 · {STAGE_LABEL[user.stageId]}
        </p>

        <div className="mt-6 space-y-4">
          <ProgressBar label="培训规划完成度" value={user.planProgress} />
          <ProgressBar label="内容掌握情况" value={user.contentMastery} />
          <ProgressBar
            label="四级体系整体进度"
            value={Math.round((user.planProgress + user.contentMastery) / 2)}
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-center">
          <div className="rounded-lg bg-primary-50 p-3">
            <p className="text-2xl font-bold text-primary-700">{user.points}</p>
            <p className="text-xs text-slate-500">积分</p>
          </div>
          <div className="rounded-lg bg-primary-50 p-3">
            <p className="text-2xl font-bold text-primary-700">{user.streak}</p>
            <p className="text-xs text-slate-500">连续打卡</p>
          </div>
        </div>
      </div>

      <div className="mt-6 card">
        <h2 className="font-semibold">切换培训阶段</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {TRAINING_STAGES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => updateStage(s.id)}
              className={`rounded-full px-3 py-1 text-xs ${user.stageId === s.id ? 'bg-primary-600 text-white' : 'bg-slate-100'}`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/plan" className="btn-primary">
          我的培训规划
        </Link>
        <Link to="/incentives" className="btn-secondary">
          学习激励
        </Link>
        <Link to="/assessment" className="btn-secondary">
          考核记录
        </Link>
        <button
          type="button"
          onClick={() => {
            logout()
            navigate('/')
          }}
          className="btn-secondary"
        >
          退出登录
        </button>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        账号与学习进度已同步至服务器，密码经加密存储，符合医疗隐私保护要求。
      </p>
    </div>
  )
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-primary-500 transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
