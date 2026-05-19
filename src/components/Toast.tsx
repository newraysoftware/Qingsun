import { useApp } from '../context/AppContext'

export function Toast() {
  const { toast } = useApp()
  if (!toast) return null
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm text-white shadow-lg"
    >
      {toast.message}
    </div>
  )
}
