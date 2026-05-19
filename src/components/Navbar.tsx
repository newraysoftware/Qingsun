import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, Search, User, X, Sprout } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { STAGE_LABEL } from '../data/trainingSystem'
import { TRAINING_CONTENTS } from '../data/content'
import { CONTENT_TYPE_LABEL } from '../data/content'

const NAV = [
  { to: '/', label: '首页' },
  { to: '/system', label: '培训体系' },
  { to: '/plan', label: '我的培训规划' },
  { to: '/content', label: '培训内容' },
  { to: '/virtual', label: '虚拟实操' },
  { to: '/cases', label: '典型案例' },
]

export function Navbar() {
  const { user } = useApp()
  const { isAuthenticated, user: authUser, logout, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [filterStage, setFilterStage] = useState('')

  const suggestions = query.trim()
    ? TRAINING_CONTENTS.filter((c) => {
        const q = query.toLowerCase()
        const match =
          c.title.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
        const stageOk = !filterStage || c.stageId === filterStage
        return match && stageOk
      }).slice(0, 8)
    : []

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition hover:text-primary-600 ${
      isActive ? 'text-primary-600' : 'text-slate-600'
    }`

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
            <Sprout className="h-5 w-5" />
          </span>
          <div className="hidden sm:block">
            <span className="text-lg font-bold text-primary-700">青笋</span>
            <p className="text-[10px] leading-tight text-slate-500">介入医生自学培训平台</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass} end={item.to === '/'}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-500 transition hover:border-primary-300"
            aria-label="搜索"
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">搜索培训内容</span>
          </button>
          {!authLoading && (isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-1.5 text-sm transition hover:bg-primary-100 active:scale-[0.98]"
              >
                <User className="h-4 w-4 text-primary-600" />
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-medium text-slate-800">{authUser?.name ?? user.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {STAGE_LABEL[user.stageId]} · {user.points}积分
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => { logout(); navigate('/') }}
                className="hidden rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 sm:block"
              >
                退出
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary py-1.5 text-sm">登录</Link>
              <Link to="/register" className="btn-primary hidden py-1.5 text-sm sm:inline-flex">注册</Link>
            </>
          ))}
          <button
            type="button"
            className="rounded-lg p-2 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="菜单"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入关键词，如 TACE、国产DSA、穿刺"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
              autoFocus
            />
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">全部阶段</option>
              {Object.entries(STAGE_LABEL).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {suggestions.length > 0 && (
            <ul className="mx-auto mt-2 max-w-3xl rounded-lg border border-slate-100 bg-slate-50">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-white"
                    onClick={() => {
                      navigate(`/content?id=${s.id}`)
                      setSearchOpen(false)
                      setQuery('')
                    }}
                  >
                    <span>{s.title}</span>
                    <span className="text-xs text-slate-400">
                      {STAGE_LABEL[s.stageId]} · {CONTENT_TYPE_LABEL[s.type]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {mobileOpen && (
        <nav className="border-t border-slate-100 px-4 py-3 lg:hidden">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={navClass}
              onClick={() => setMobileOpen(false)}
              end={item.to === '/'}
            >
              <span className="block py-2">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
