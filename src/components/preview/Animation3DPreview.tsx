import { useEffect, useRef, useState } from 'react'
import type { TrainingContent } from '../../types'
import { useMediaReachable } from '../../hooks/useMediaReachable'
import { usePreviewLoad } from '../../hooks/usePreviewLoad'
import { PreviewFrame } from './PreviewFrame'
import { ensureModelViewerLoaded } from '../../utils/loadModelViewer'

const PREVIEW_SECONDS = 20

interface Animation3DPreviewProps {
  content: TrainingContent
}

export function Animation3DPreview({ content }: Animation3DPreviewProps) {
  const url = content.contentFileUrl
  const videoRef = useRef<HTMLVideoElement>(null)
  const { status, markReady, markError, retryLoad, retry } = usePreviewLoad([content.id, url])
  const [elapsed, setElapsed] = useState(0)
  const isModel = Boolean(url?.match(/\.(glb|gltf)(\?|$)/i))

  useMediaReachable(url, Boolean(url) && !isModel, markReady, markError, retry)

  useEffect(() => {
    if (isModel) {
      void ensureModelViewerLoaded().then(() => markReady()).catch(() => markError())
      return
    }
    const el = videoRef.current
    if (!el || !url) return
    el.muted = true
    const play = () => void el.play().catch(() => markError())
    if (el.readyState >= 2) play()
    else el.addEventListener('loadeddata', play, { once: true })
    const tick = window.setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(tick)
  }, [url, retry, isModel, markError, markReady])

  if (!url) {
    return (
      <PreviewFrame status="ready" onRetry={retryLoad}>
        <p className="text-center text-sm text-slate-500">暂无 3D 动画课件</p>
      </PreviewFrame>
    )
  }

  if (isModel) {
    return (
      <PreviewFrame status={status} onRetry={retryLoad}>
        <p className="mb-2 text-xs text-slate-500">3D 动画 · 可拖动旋转查看（预览模式）</p>
        <model-viewer
          key={retry}
          src={url}
          alt={content.title}
          camera-controls
          auto-rotate
          shadow-intensity="1"
          style={{ width: '100%', height: 'min(42vh,360px)', background: '#f1f5f9' }}
          onLoad={markReady}
        />
        <p className="mt-2 text-center text-xs text-slate-500">电脑端鼠标拖动 · 移动端手指滑动旋转</p>
      </PreviewFrame>
    )
  }

  return (
    <PreviewFrame status={status} onRetry={retryLoad}>
      <p className="mb-2 text-xs text-slate-500">3D 动画 · 预览前 {PREVIEW_SECONDS} 秒（自动循环）</p>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
        <video
          ref={videoRef}
          key={retry}
          src={url}
          poster={content.previewImageUrl ?? undefined}
          muted
          playsInline
          loop
          preload="auto"
          className="aspect-video w-full touch-pan-y"
          onLoadedData={markReady}
          onError={markError}
          onTimeUpdate={(e) => {
            const el = e.currentTarget
            if (el.currentTime >= PREVIEW_SECONDS) el.currentTime = 0
          }}
        />
      </div>
      <p className="mt-2 text-center text-xs text-slate-500">
        电脑端可全屏查看 · 移动端支持滑动画面
        {elapsed >= PREVIEW_SECONDS ? ' · 预览结束，可开始学习完整内容' : ''}
      </p>
    </PreviewFrame>
  )
}
