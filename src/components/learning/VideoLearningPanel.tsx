import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { TrainingContent, ContentLearningProgress } from '../../types'
import type { UpsertLearningProgressBody } from '../../api/learningProgress'
import { LEARNING_COMPLETE_THRESHOLD } from '../../utils/learning'
import { stringifyLearningMeta } from '../../utils/learningMeta'
import { throttle } from '../../utils/throttle'

export type VideoQuality = 'sd' | 'hd'

const UI_TIMEUPDATE_MS = 250
const PROGRESS_REPORT_MS = 4000

interface VideoLearningPanelProps {
  content: TrainingContent
  progress?: ContentLearningProgress
  learningActive: boolean
  paused: boolean
  playbackRate: number
  muted: boolean
  quality: VideoQuality
  onProgress: (patch: UpsertLearningProgressBody) => void
  onReady: () => void
  onError: () => void
  onTimeUpdate?: (current: number, duration: number) => void
  videoRef?: React.RefObject<HTMLVideoElement | null>
}

export function VideoLearningPanel({
  content,
  progress,
  learningActive,
  paused,
  playbackRate,
  muted,
  quality,
  onProgress,
  onReady,
  onError,
  onTimeUpdate,
  videoRef: externalRef,
}: VideoLearningPanelProps) {
  const url = content.contentFileUrl
  const internalRef = useRef<HTMLVideoElement>(null)
  const videoRef = externalRef ?? internalRef
  const durationRef = useRef(0)
  const resumedRef = useRef(false)

  const reportProgress = useCallback(
    (el: HTMLVideoElement) => {
      if (!learningActive || !el.duration || Number.isNaN(el.duration)) return
      const pct = Math.round((el.currentTime / el.duration) * 100)
      onProgress({
        progressPercent: pct,
        lastPosition: {
          kind: 'video',
          value: el.currentTime,
          meta: stringifyLearningMeta({ playbackRate, muted, quality }),
        },
        status: pct >= LEARNING_COMPLETE_THRESHOLD ? 'completed' : 'in_progress',
      })
    },
    [learningActive, onProgress, playbackRate, muted, quality],
  )

  const throttledReport = useMemo(
    () => throttle((el: HTMLVideoElement) => reportProgress(el), PROGRESS_REPORT_MS),
    [reportProgress],
  )

  const throttledUiUpdate = useMemo(
    () =>
      throttle((current: number, duration: number) => {
        onTimeUpdate?.(current, duration)
      }, UI_TIMEUPDATE_MS),
    [onTimeUpdate],
  )

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.playbackRate = playbackRate
  }, [playbackRate, videoRef])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.muted = muted
  }, [muted, videoRef])

  useEffect(() => {
    const el = videoRef.current
    if (!el || !url) return
    if (paused) {
      el.pause()
      return
    }
    const tryPlay = () => {
      void el.play().catch(() => {})
    }
    if (el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) tryPlay()
    else el.addEventListener('canplay', tryPlay, { once: true })
    return () => el.removeEventListener('canplay', tryPlay)
  }, [paused, url, videoRef])

  useEffect(() => {
    resumedRef.current = false
  }, [url, content.id])

  useEffect(() => {
    const el = videoRef.current
    if (!el || !url || !learningActive || resumedRef.current) return
    const resume = progress?.lastPosition
    if (resume?.kind !== 'video' || resume.value <= 0) return

    const apply = () => {
      if (el.duration && resume.value < el.duration - 2) {
        el.currentTime = resume.value
      }
      resumedRef.current = true
    }
    if (el.readyState >= HTMLMediaElement.HAVE_METADATA) apply()
    else el.addEventListener('loadedmetadata', apply, { once: true })
  }, [url, content.id, learningActive, progress?.lastPosition?.value, videoRef])

  if (!url) {
    return <p className="text-center text-sm text-slate-500">暂无视频课件</p>
  }

  const durationLabel =
    durationRef.current > 0
      ? `${Math.floor(durationRef.current / 60)}:${String(Math.floor(durationRef.current % 60)).padStart(2, '0')}`
      : null

  return (
    <div className="relative flex h-full min-h-0 flex-col items-center justify-center bg-black">
      <video
        ref={videoRef}
        src={url}
        poster={content.previewImageUrl ?? undefined}
        playsInline
        preload="metadata"
        disablePictureInPicture
        className={`max-h-full object-contain ${quality === 'sd' ? 'w-full max-w-3xl' : 'w-full'}`}
        onLoadedMetadata={(e) => {
          const el = e.currentTarget
          durationRef.current = el.duration
          onReady()
        }}
        onError={onError}
        onTimeUpdate={(e) => {
          const el = e.currentTarget
          throttledUiUpdate(el.currentTime, el.duration)
          throttledReport(el)
        }}
        onPause={() => {
          const el = videoRef.current
          if (el) reportProgress(el)
        }}
        onEnded={() => {
          onProgress({
            progressPercent: 100,
            status: 'completed',
            lastPosition: {
              kind: 'video',
              value: 0,
              meta: stringifyLearningMeta({ playbackRate, muted, quality }),
            },
          })
        }}
      />
      {quality === 'sd' && (
        <span className="pointer-events-none absolute left-3 top-3 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
          标清
        </span>
      )}
      {durationLabel && (
        <p className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/50 px-2 py-0.5 text-[10px] text-white">
          {durationLabel}
        </p>
      )}
    </div>
  )
}
