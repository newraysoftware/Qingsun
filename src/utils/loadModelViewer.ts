let loadPromise: Promise<void> | null = null

/** 按需加载 model-viewer，避免在 index.html 阻塞首页 */
export function ensureModelViewerLoaded(): Promise<void> {
  if (typeof customElements !== 'undefined' && customElements.get('model-viewer')) {
    return Promise.resolve()
  }
  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.type = 'module'
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js'
      script.onload = () => resolve()
      script.onerror = () => {
        loadPromise = null
        reject(new Error('model-viewer 脚本加载失败'))
      }
      document.head.appendChild(script)
    })
  }
  return loadPromise
}
