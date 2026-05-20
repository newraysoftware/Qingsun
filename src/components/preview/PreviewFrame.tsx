import { RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'

interface PreviewFrameProps {
  status: 'loading' | 'ready' | 'error'
  onRetry: () => void
  children: ReactNode
  minHeightClass?: string
}

export function PreviewFrame({
  status,
  onRetry,
  children,
  minHeightClass = 'min-h-[220px]',
}: PreviewFrameProps) {
  if (status === 'loading') {
    return (
      <div
        className={`flex ${minHeightClass} flex-col items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500`}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
        <p className="mt-3">课件预览加载中…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div
        className={`flex ${minHeightClass} flex-col items-center justify-center rounded-lg bg-slate-50 px-4 text-center text-sm text-slate-600`}
      >
        <p>加载失败，请检查网络后重试</p>
        <button type="button" onClick={onRetry} className="btn-secondary mt-4 text-xs">
          <RefreshCw className="h-4 w-4" />
          重新加载
        </button>
      </div>
    )
  }

  return <>{children}</>
}
