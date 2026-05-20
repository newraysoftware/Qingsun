import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Highlighter,
  Minimize2,
  Pause,
  Play,
  RefreshCw,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import type { TrainingContent, ContentLearningProgress } from '../../types'
import type { UpsertLearningProgressBody } from '../../api/learningProgress'
import { getPreviewKind } from '../../utils/previewKind'
import { estimatePdfPages, estimatePptSlides } from '../../utils/previewKind'
import { useLearningLoad, LEARNING_MAX_RETRIES } from '../../hooks/useLearningLoad'
import { parseLearningMeta } from '../../utils/learningMeta'
import { useLearningProgress } from '../../context/LearningProgressContext'
import { DocumentLearningPanel } from './DocumentLearningPanel'
import { VideoLearningPanel, type VideoQuality } from './VideoLearningPanel'
import { Model3DLearningPanel } from './Model3DLearningPanel'
import { VrLearningPanel } from './VrLearningPanel'

interface ContentLearningModalProps {
  content: TrainingContent
  progress?: ContentLearningProgress
  onClose: () => void
  onMinimize: () => void
  onProgress: (patch: UpsertLearningProgressBody) => void
}

export function ContentLearningModal({
  content,
  progress,
  onClose,
  onMinimize,
  onProgress,
}: ContentLearningModalProps) {
  const kind = getPreviewKind(content)
  const isDocument =
    content.mediaType === 'pdf' ||
    content.mediaType === 'ppt' ||
    content.mediaType === 'none'
  const isVideo = kind === 'video'
  const is3d = kind === 'animation3d'
  const isVr = content.mediaType === 'vr'

  const totalPages =
    content.mediaType === 'pdf'
      ? estimatePdfPages(content)
      : content.mediaType === 'ppt'
        ? estimatePptSlides(content)
        : 1

  const savedMeta = parseLearningMeta(progress?.lastPosition?.meta)
  const savedPage =
    progress?.lastPosition?.kind === 'pdf' || progress?.lastPosition?.kind === 'ppt'
      ? Math.max(1, progress.lastPosition.value)
      : 1

  const [page, setPage] = useState(savedPage)
  const [pageInput, setPageInput] = useState(String(savedPage))
  const [fontScale, setFontScale] = useState(savedMeta.fontScale ?? 1)
  const [paused, setPaused] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(savedMeta.playbackRate ?? 1)
  const [muted, setMuted] = useState(savedMeta.muted ?? false)
  const [quality, setQuality] = useState<VideoQuality>(savedMeta.quality ?? 'hd')
  const [videoTime, setVideoTime] = useState({ current: 0, duration: 0 })
  const videoRef = useRef<HTMLVideoElement>(null)
  const seekingRef = useRef(false)

  const load = useLearningLoad([content.id, content.contentFileUrl])
  const { flushProgress } = useLearningProgress()

  const pct = progress?.progressPercent ?? 0

  const handleClose = useCallback(() => {
    flushProgress(content.id)
    onClose()
  }, [content.id, flushProgress, onClose])

  const handleMinimize = useCallback(() => {
    flushProgress(content.id)
    onMinimize()
  }, [content.id, flushProgress, onMinimize])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const goPage = useCallback(
    (p: number) => {
      const next = Math.max(1, Math.min(totalPages, p))
      setPage(next)
      setPageInput(String(next))
    },
    [totalPages],
  )

  const seekVideo = (sec: number) => {
    const el = videoRef.current
    if (!el) return
    el.currentTime = Math.max(0, Math.min(el.duration || 0, sec))
  }

  const addHighlightFromSelection = () => {
    document.dispatchEvent(new CustomEvent('learning-highlight'))
  }

  const renderBody = () => {
    if (load.status === 'fatal') {
      return (
        <div className="flex flex-1 flex-col items-center justify-center text-sm text-slate-500">
          <p className="text-sm text-slate-700">课件加载异常，请联系客服</p>
          <p className="mt-1 text-xs text-slate-500">已重试 {LEARNING_MAX_RETRIES} 次仍无法加载</p>
          <button type="button" onClick={handleClose} className="btn-secondary mt-4 text-xs">
            退出学习
          </button>
        </div>
      )
    }
    if (load.status === 'error') {
      return (
        <div className="flex flex-1 flex-col items-center justify-center text-sm text-slate-500">
          <p className="text-sm text-slate-600">课件加载失败，请检查网络后重试</p>
          <p className="mt-1 text-xs text-slate-400">
            还可重试 {load.retriesLeft} 次（共 {LEARNING_MAX_RETRIES} 次）
          </p>
          <button type="button" onClick={load.retryLoad} className="btn-secondary mt-4 text-xs">
            <RefreshCw className="h-4 w-4" />
            重新加载
          </button>
        </div>
      )
    }
    const panel = (() => {
    if (isDocument) {
      return (
        <DocumentLearningPanel
          content={content}
          progress={progress}
          learningActive
          paused={paused}
          fontScale={fontScale}
          page={page}
          onProgress={onProgress}
          onReady={load.markReady}
          onError={load.markError}
        />
      )
    }
    if (isVideo) {
      return (
        <VideoLearningPanel
          content={content}
          progress={progress}
          learningActive
          paused={paused || load.status === 'loading'}
          playbackRate={playbackRate}
          muted={muted}
          quality={quality}
          videoRef={videoRef}
          onProgress={onProgress}
          onReady={load.markReady}
          onError={load.markError}
          onTimeUpdate={(current, duration) => {
            if (!seekingRef.current) setVideoTime({ current, duration })
          }}
        />
      )
    }
    if (is3d) {
      return (
        <Model3DLearningPanel
          content={content}
          progress={progress}
          learningActive
          paused={paused}
          mode="animation3d"
          onProgress={onProgress}
          onReady={load.markReady}
          onError={load.markError}
        />
      )
    }
    if (isVr) {
      return (
        <VrLearningPanel
          content={content}
          progress={progress}
          learningActive
          onProgress={onProgress}
          onReady={load.markReady}
          onError={load.markError}
        />
      )
    }
    return null
    })()

    return (
      <div className="relative flex min-h-0 flex-1 flex-col">
        {load.status === 'loading' && (
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 text-sm text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
            <p className="mt-3">学习内容加载中…</p>
          </div>
        )}
        <div className="relative min-h-0 flex-1">{panel}</div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch justify-center bg-black/50 md:items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="learning-modal-title"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 flex h-full w-full flex-col bg-white shadow-2xl md:h-[70vh] md:max-h-[90vh] md:w-[70vw] md:rounded-xl">
        <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 id="learning-modal-title" className="truncate text-base font-semibold text-slate-900">
              {content.title}
            </h2>
            <p className="text-xs text-primary-700">已学习 {pct}%</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={handleMinimize}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="最小化"
            >
              <Minimize2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="关闭"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main
          id="learning-modal-viewport"
          className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-3 md:p-4"
        >
          {renderBody()}
        </main>

        <footer className="shrink-0 border-t border-slate-200 bg-slate-50/90 px-3 py-3 md:px-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="btn-secondary text-xs"
            >
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {paused ? '继续' : '暂停'}
            </button>

            {isDocument && content.mediaType !== 'none' && (
              <>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => goPage(page - 1)}
                  className="btn-secondary px-2 text-xs"
                  aria-label="上一页"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-slate-600">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => goPage(page + 1)}
                  className="btn-secondary px-2 text-xs"
                  aria-label="下一页"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <label className="flex items-center gap-1 text-xs text-slate-600">
                  跳转
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') goPage(Number(pageInput) || 1)
                    }}
                    onBlur={() => goPage(Number(pageInput) || 1)}
                    className="w-12 rounded border border-slate-200 px-1 py-0.5 text-center"
                  />
                  页
                </label>
                <button
                  type="button"
                  onClick={() => setFontScale((f) => Math.min(1.5, Math.round((f + 0.1) * 10) / 10))}
                  className="btn-secondary text-xs"
                >
                  A+
                </button>
                <button
                  type="button"
                  onClick={() => setFontScale((f) => Math.max(0.85, Math.round((f - 0.1) * 10) / 10))}
                  className="btn-secondary text-xs"
                >
                  A-
                </button>
                {content.mediaType === 'pdf' && (
                  <button type="button" onClick={addHighlightFromSelection} className="btn-secondary text-xs">
                    <Highlighter className="h-4 w-4" />
                    高亮标注
                  </button>
                )}
              </>
            )}

            {isVideo && (
              <>
                <input
                  type="range"
                  min={0}
                  max={videoTime.duration || 100}
                  step={0.1}
                  value={videoTime.current}
                  onPointerDown={() => {
                    seekingRef.current = true
                  }}
                  onPointerUp={() => {
                    seekingRef.current = false
                  }}
                  onChange={(e) => {
                    const sec = Number(e.target.value)
                    setVideoTime((t) => ({ ...t, current: sec }))
                    seekVideo(sec)
                  }}
                  className="min-w-[80px] flex-1"
                  aria-label="播放进度"
                />
                <select
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(Number(e.target.value))}
                  className="rounded border border-slate-200 px-2 py-1 text-xs"
                  aria-label="播放倍速"
                >
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
                    <option key={r} value={r}>
                      {r}x
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  className="btn-secondary px-2 text-xs"
                  aria-label={muted ? '取消静音' : '静音'}
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as VideoQuality)}
                  className="rounded border border-slate-200 px-2 py-1 text-xs"
                  aria-label="画质"
                >
                  <option value="sd">标清</option>
                  <option value="hd">高清</option>
                </select>
              </>
            )}

            {(is3d || isVr) && (
              <button
                type="button"
                onClick={() => {
                  const el = document.querySelector(
                    isVr
                      ? '#learning-modal-viewport .vr-learning-canvas'
                      : '#learning-modal-viewport .model-scene-root',
                  ) as HTMLElement & { requestFullscreen?: () => void }
                  el?.requestFullscreen?.()
                }}
                className="btn-secondary text-xs"
              >
                全屏
              </button>
            )}

            <button type="button" onClick={handleClose} className="btn-secondary ml-auto text-xs">
              退出学习
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
