import { useEffect } from 'react'

/** 用 HEAD 确认课件 URL 可访问，避免 iframe/video 的 onLoad 迟迟不触发导致误判失败 */
export function useMediaReachable(
  url: string | null | undefined,
  enabled: boolean,
  onReady: () => void,
  onError: () => void,
  resetKey: unknown,
) {
  useEffect(() => {
    if (!enabled || !url) return

    const controller = new AbortController()
    fetch(url, { method: 'HEAD', signal: controller.signal })
      .then((res) => {
        if (res.ok) onReady()
        else onError()
      })
      .catch(() => {
        if (!controller.signal.aborted) onError()
      })

    return () => controller.abort()
  }, [url, enabled, onReady, onError, resetKey])
}
