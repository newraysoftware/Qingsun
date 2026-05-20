import { useCallback, useEffect, useState } from 'react'

/** 大体积 PDF/视频在弱网下常超过 2s，过短会误报「加载失败」 */
export const PREVIEW_LOAD_TIMEOUT_MS = 15_000

export function usePreviewLoad(resetDeps: unknown[] = [], timeoutMs = PREVIEW_LOAD_TIMEOUT_MS) {
  const [retry, setRetry] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    setStatus('loading')
    const timer = window.setTimeout(() => {
      setStatus((s) => (s === 'loading' ? 'error' : s))
    }, timeoutMs)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...resetDeps, retry, timeoutMs])

  const markReady = useCallback(() => setStatus('ready'), [])
  const markError = useCallback(() => setStatus('error'), [])
  const retryLoad = useCallback(() => setRetry((n) => n + 1), [])

  return { status, markReady, markError, retryLoad, retry }
}
