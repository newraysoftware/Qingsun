import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import type { TrainingContent } from '../../types'
import { useMediaReachable } from '../../hooks/useMediaReachable'
import { usePreviewLoad } from '../../hooks/usePreviewLoad'
import { PreviewFrame } from './PreviewFrame'

const PREVIEW_SECONDS = 30

interface VideoPreviewProps {
  content: TrainingContent
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function VideoPreview({ content }: VideoPreviewProps) {
  const url = content.contentFileUrl
  const videoRef = useRef<HTMLVideoElement>(null)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(true)
  const [duration, setDuration] = useState(0)
  const { status, markReady, markError, retryLoad, retry } = usePreviewLoad([content.id, url])

  useMediaReachable(url, Boolean(url), markReady, markError, retry)

  useEffect(() => {
    const el = videoRef.current
    if (!el || !url) return
    el.muted = true
    setMuted(true)
    const play = () => {
      void el.play().catch(() => markError())
    }
    if (el.readyState >= 2) play()
    else el.addEventListener('loadeddata', play, { once: true })
  }, [url, retry, markError])

  if (!url) {
    return (
      <PreviewFrame status="ready" onRetry={retryLoad}>
        <p className="text-center text-sm text-slate-500">暂无视频课件</p>
      </PreviewFrame>
    )
  }

  return (
    <PreviewFrame status={status} onRetry={retryLoad} minHeightClass="min-h-[200px]">
      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-black">
        <video
          ref={videoRef}
          key={retry}
          src={url}
          poster={content.previewImageUrl ?? undefined}
          muted={muted}
          playsInline
          preload="auto"
          className="aspect-video w-full"
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration)
            markReady()
          }}
          onError={markError}
          onTimeUpdate={(e) => {
            const el = e.currentTarget
            if (el.currentTime >= PREVIEW_SECONDS) {
              el.currentTime = 0
              if (!paused) void el.play().catch(() => {})
            }
          }}
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
        />
        <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
          预览 {PREVIEW_SECONDS} 秒
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <span>
          总时长 {duration > 0 ? formatTime(duration) : content.duration || '—'}
          {duration > PREVIEW_SECONDS ? ` · 预览前 ${PREVIEW_SECONDS} 秒` : ''}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
            onClick={() => {
              const el = videoRef.current
              if (!el) return
              if (el.paused) void el.play()
              else el.pause()
            }}
          >
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {paused ? '播放' : '暂停'}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
            onClick={() => {
              const el = videoRef.current
              if (!el) return
              el.muted = !el.muted
              setMuted(el.muted)
            }}
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            声音
          </button>
        </div>
      </div>
    </PreviewFrame>
  )
}
