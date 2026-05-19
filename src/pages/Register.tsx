import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sprout } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/client'
import { useApp } from '../context/AppContext'

export function Register() {
  const { register } = useAuth()
  const { showToast } = useApp()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [yearsOfPractice, setYearsOfPractice] = useState(0)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register({ email, password, name, yearsOfPractice })
      showToast('注册成功，欢迎加入青笋')
      navigate('/plan', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '注册失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Sprout className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">注册账号</h1>
          <p className="mt-1 text-sm text-slate-500">创建账号后即可制定专属培训规划</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <label className="block text-sm">
            姓名
            <input
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-primary-400"
              placeholder="您的姓名"
            />
          </label>
          <label className="block text-sm">
            邮箱
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-primary-400"
            />
          </label>
          <label className="block text-sm">
            密码
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-primary-400"
              placeholder="至少 8 位"
            />
          </label>
          <label className="block text-sm">
            从业年限（年）
            <input
              type="number"
              min={0}
              max={50}
              value={yearsOfPractice}
              onChange={(e) => setYearsOfPractice(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-primary-400"
            />
            <span className="mt-1 block text-xs text-slate-400">系统将根据年限推荐培训阶段</span>
          </label>
          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
            {submitting ? '注册中…' : '注册'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          已有账号？
          <Link to="/login" className="ml-1 font-medium text-primary-600 hover:underline">
            去登录
          </Link>
        </p>
      </div>
    </div>
  )
}
