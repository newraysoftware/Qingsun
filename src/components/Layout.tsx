import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { Toast } from './Toast'
import { LearningAssistant } from './assistant/LearningAssistant'
import { useApp } from '../context/AppContext'

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast } = useApp()

  useEffect(() => {
    const state = location.state as { adminDenied?: boolean } | null
    if (state?.adminDenied) {
      showToast('无管理权限，仅系统管理员可访问管理后台')
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate, showToast])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toast />
      <LearningAssistant />
    </div>
  )
}
