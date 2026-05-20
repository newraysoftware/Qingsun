import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Footer() {
  const { isAdmin } = useAuth()
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-semibold text-slate-900">青笋 · 介入培训平台</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              专注介入医生系统化自学培训，以四级培训体系为框架、个性化规划为路径、精准内容为支撑，
              助力从规培到独立手术的全周期成长。
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-700">核心链接</h4>
            <ul className="mt-2 space-y-1 text-sm text-slate-500">
              <li><Link to="/system" className="hover:text-primary-600">关于我们</Link></li>
              <li><a href="#terms" className="hover:text-primary-600">用户协议</a></li>
              <li><a href="#privacy" className="hover:text-primary-600">隐私政策</a></li>
              <li><a href="#contact" className="hover:text-primary-600">联系我们</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-700">更多服务</h4>
            <ul className="mt-2 space-y-1 text-sm text-slate-500">
              <li><Link to="/experts" className="hover:text-primary-600">专家资源</Link></li>
              <li><Link to="/tools" className="hover:text-primary-600">实用工具</Link></li>
              <li><Link to="/news" className="hover:text-primary-600">行业资讯</Link></li>
              {isAdmin && (
                <li><Link to="/admin" className="hover:text-primary-600">管理后台</Link></li>
              )}
            </ul>
          </div>
        </div>
        <p className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} 青笋介入培训平台 · 学习记录本地加密存储 · 符合医疗隐私规范
        </p>
      </div>
    </footer>
  )
}
