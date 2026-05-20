import { useCallback, useEffect, useRef, useState } from 'react'

/** 大体积 PDF 渲染可能较慢 */
const LOAD_TIMEOUT_MS = 60_000
export const LEARNING_MAX_RETRIES = 3

export function useLearningLoad(resetDeps: unknown[] = []) {
  const [retryKey, setRetryKey] = useState(0)
  const [failCount, setFailCount] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'fatal'>('loading')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    setStatus('loading')
    clearTimer()
    timerRef.current = setTimeout(() => {
      setFailCount((n) => {
        const next = n + 1
        setStatus(next >= LEARNING_MAX_RETRIES ? 'fatal' : 'error')
        return next
      })
    }, LOAD_TIMEOUT_MS)
    return clearTimer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...resetDeps, retryKey])

  const markReady = useCallback(() => {
    clearTimer()
    setFailCount(0)
    setStatus('ready')
  }, [])

  const markError = useCallback(() => {
    setFailCount((n) => {
      const next = n + 1
      setStatus(next >= LEARNING_MAX_RETRIES ? 'fatal' : 'error')
      return next
    })
  }, [])

  const retryLoad = useCallback(() => {
    if (failCount >= LEARNING_MAX_RETRIES) return
    setRetryKey((k) => k + 1)
    setStatus('loading')
  }, [failCount])

  const retriesLeft = Math.max(0, LEARNING_MAX_RETRIES - failCount)

  return { status, markReady, markError, retryLoad, failCount, retriesLeft, retryKey }
}
