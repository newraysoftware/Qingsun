export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      <p className="mt-3 text-sm text-slate-500">页面加载中…</p>
    </div>
  )
}
