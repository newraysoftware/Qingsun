import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TrainingContent } from '../types'
import type { ContentLearningProgress, LearningPosition } from '../types'
import type { UpsertLearningProgressBody } from '../api/learningProgress'
import { LEARNING_COMPLETE_THRESHOLD, parseDurationMinutes } from '../utils/learning'
import { throttle } from '../utils/throttle'
import { ModelSceneViewer } from './viewer/ModelSceneViewer'
import { parseLearningMeta } from '../utils/learningMeta'
import { stringifyLearningMeta } from '../utils/learningMeta'

interface ContentMediaViewerProps {
  content: TrainingContent
  progress?: ContentLearningProgress
  learningActive: boolean
  onProgress: (patch: UpsertLearningProgressBody) => void
}

function positionKindForMedia(mediaType: TrainingContent['mediaType']): LearningPosition['kind'] {
  if (mediaType === 'video') return 'video'
  if (mediaType === 'pdf') return 'pdf'
  if (mediaType === 'ppt') return 'ppt'
  if (mediaType === 'vr') return 'vr'
  return 'document'
}

export function ContentMediaViewer({
  content,
  progress,
  learningActive,
  onProgress,
}: ContentMediaViewerProps) {
  const url = content.contentFileUrl
  const videoRef = useRef<HTMLVideoElement>(null)
  const dwellRef = useRef(0)
  const lastTickRef = useRef(Date.now())
  const [vrInteracted, setVrInteracted] = useState(false)

  const report = useCallback(
    (patch: UpsertLearningProgressBody) => {
      if (!learningActive) return
      onProgress(patch)
    },
    [learningActive, onProgress],
  )

  const reportVideoProgress = useCallback(() => {
    const el = videoRef.current
    if (!el || !el.duration || Number.isNaN(el.duration)) return
    const pct = Math.round((el.currentTime / el.duration) * 100)
    report({
      progressPercent: pct,
      lastPosition: { kind: 'video', value: el.currentTime },
      status: pct >= LEARNING_COMPLETE_THRESHOLD ? 'completed' : 'in_progress',
    })
  }, [report])

  const throttledVideoProgress = useMemo(
    () => throttle(() => reportVideoProgress(), 4000),
    [reportVideoProgress],
  )

  useEffect(() => {
    if (!learningActive || content.mediaType !== 'video') return
    const el = videoRef.current
    if (!el) return
    const resume = progress?.lastPosition
    if (resume?.kind === 'video' && resume.value > 0) {
      const apply = () => {
        if (el.duration && resume.value < el.duration - 2) {
          el.currentTime = resume.value
        }
      }
      if (el.readyState >= 1) apply()
      else el.addEventListener('loadedmetadata', apply, { once: true })
    }
  }, [learningActive, content.mediaType, content.id, progress?.lastPosition?.value])

  useEffect(() => {
    if (!learningActive) return
    const kind = positionKindForMedia(content.mediaType)
    if (kind !== 'pdf' && kind !== 'ppt' && kind !== 'document') return

    const tick = window.setInterval(() => {
      const now = Date.now()
      const delta = (now - lastTickRef.current) / 1000
      lastTickRef.current = now
      if (document.hidden) return
      dwellRef.current += delta
      const targetSec = parseDurationMinutes(content.duration) * 60
      const pct = Math.min(95, Math.round((dwellRef.current / targetSec) * 100))
      const current = progress?.progressPercent ?? 0
      if (pct > current) {
        const position =
          kind === 'pdf'
            ? { kind: 'pdf' as const, value: Math.max(1, Math.ceil((pct / 100) * 24)), meta: String(pct) }
            : { kind, value: pct }
        report({
          progressPercent: pct,
          lastPosition: position,
          status: pct >= LEARNING_COMPLETE_THRESHOLD ? 'completed' : 'in_progress',
        })
      }
    }, 5000)

    return () => clearInterval(tick)
  }, [
    learningActive,
    content.mediaType,
    content.duration,
    content.id,
    progress?.progressPercent,
    report,
  ])

  useEffect(() => {
    if (!learningActive || !vrInteracted || content.mediaType !== 'vr') return
    const t = window.setTimeout(() => {
      report({
        progressPercent: Math.max(progress?.progressPercent ?? 0, 85),
        status: 'in_progress',
      })
    }, 120000)
    return () => clearTimeout(t)
  }, [vrInteracted, learningActive, content.mediaType, progress?.progressPercent, report])

  useEffect(() => {
    if (!learningActive || content.mediaType !== 'none') return
    if ((progress?.progressPercent ?? 0) >= 100) return
    const t = window.setTimeout(() => {
      report({
        progressPercent: 100,
        lastPosition: { kind: 'document', value: 100 },
        status: 'completed',
      })
    }, 8000)
    return () => clearTimeout(t)
  }, [learningActive, content.mediaType, content.id, progress?.progressPercent, report])

  if (!url || content.mediaType === 'none') {
    return (
      <div className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
        <p>{content.description || '本内容为文字简介，阅读完成后将自动记录进度。'}</p>
        {!content.description && (
          <p className="mt-2 text-slate-500">暂无上传课件，可结合简介完成理论学习。</p>
        )}
      </div>
    )
  }

  if (content.mediaType === 'pdf') {
    const page = progress?.lastPosition?.kind === 'pdf' ? Math.max(1, progress.lastPosition.value) : 1
    const src = `${url}#page=${page}`
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <iframe title={content.title} src={src} className="h-[min(70vh,640px)] w-full" />
        <p className="border-t bg-slate-50 px-3 py-2 text-xs text-slate-500">
          {learningActive && page > 1 ? `已从第 ${page} 页继续 · ` : ''}
          <a href={url} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
            在新窗口打开 PDF
          </a>
        </p>
      </div>
    )
  }

  if (content.mediaType === 'ppt') {
    const absoluteUrl = new URL(url, window.location.origin).href
    const officeEmbed = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteUrl)}`
    return (
      <div>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <iframe
            title={content.title}
            src={officeEmbed}
            className="h-[min(70vh,640px)] w-full"
            allowFullScreen
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {learningActive && (progress?.progressPercent ?? 0) > 0
            ? `学习进度 ${progress?.progressPercent}% · `
            : ''}
          若无法在线预览，请{' '}
          <a
            href={url}
            download={content.contentFileName ?? true}
            className="text-primary-600 hover:underline"
          >
            下载课件
          </a>
        </p>
      </div>
    )
  }

  if (content.mediaType === 'video') {
    return (
      <video
        ref={videoRef}
        controls
        className="w-full rounded-lg border border-slate-200 bg-black"
        src={url}
        preload="metadata"
        onTimeUpdate={throttledVideoProgress}
        onEnded={() =>
          report({ progressPercent: 100, status: 'completed', lastPosition: { kind: 'video', value: 0 } })
        }
      >
        您的浏览器不支持视频播放
      </video>
    )
  }

  if (content.mediaType === 'vr' && url) {
    const sceneCamera = parseLearningMeta(progress?.lastPosition?.meta).fbxCamera
    return (
      <div className="relative min-h-[min(70vh,520px)] w-full">
        <ModelSceneViewer
          key={content.id}
          url={url}
          autoRotate={!vrInteracted}
          cameraState={sceneCamera}
          onUserInteract={() => setVrInteracted(true)}
          onCameraChange={(cam) => {
            setVrInteracted(true)
            report({
              progressPercent: Math.max(progress?.progressPercent ?? 0, 40),
              lastPosition: {
                kind: 'vr',
                value: 1,
                meta: stringifyLearningMeta({ fbxCamera: cam }),
              },
              status: 'in_progress',
            })
          }}
          className="absolute inset-0 h-full w-full"
        />
        <p className="mt-2 text-xs text-slate-500">
          VR 课件 · 左键旋转 · 中键或滚轮缩放 · 右键平移 · 系统将记住您的视角
        </p>
      </div>
    )
  }

  return null
}
