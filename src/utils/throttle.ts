/** 节流：在 waitMs 内最多执行一次 */
export function throttle<T extends (...args: never[]) => void>(fn: T, waitMs: number): T {
  let last = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let latestArgs: Parameters<T> | null = null

  const run = () => {
    if (!latestArgs) return
    last = Date.now()
    fn(...latestArgs)
    latestArgs = null
    timer = null
  }

  return ((...args: Parameters<T>) => {
    latestArgs = args
    const now = Date.now()
    const remaining = waitMs - (now - last)
    if (remaining <= 0) {
      if (timer) clearTimeout(timer)
      run()
    } else if (!timer) {
      timer = setTimeout(run, remaining)
    }
  }) as T
}
