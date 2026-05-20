import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TrainingContent, ContentLearningProgress } from '../../types'
import type { UpsertLearningProgressBody } from '../../api/learningProgress'
import { vrInteractionHint } from '../../utils/previewKind'
import { ModelSceneViewer } from '../viewer/ModelSceneViewer'
import type { FbxCameraState } from '../../utils/fbxScene'
import { parseLearningMeta, stringifyLearningMeta } from '../../utils/learningMeta'
import { LEARNING_COMPLETE_THRESHOLD } from '../../utils/learning'
import { throttle } from '../../utils/throttle'

interface Model3DLearningPanelProps {
  content: TrainingContent
  progress?: ContentLearningProgress
  learningActive: boolean
  paused: boolean
  mode: 'animation3d' | 'vr'
  onProgress: (patch: UpsertLearningProgressBody) => void
  onReady: () => void
  onError: () => void
}

export function Model3DLearningPanel({
  content,
  progress,
  learningActive,
  paused,
  mode,
  onProgress,
  onReady,
  onError,
}: Model3DLearningPanelProps) {
  const url = content.contentFileUrl
  const animVideoRef = useRef<HTMLVideoElement>(null)
  const savedMeta = parseLearningMeta(progress?.lastPosition?.meta)
  const initialCamera = useMemo(() => savedMeta.fbxCamera, [content.id])
  const sceneCameraRef = useRef<FbxCameraState | undefined>(initialCamera)

  const [autoRotate, setAutoRotate] = useState(false)

  useEffect(() => {
    sceneCameraRef.current = initialCamera
  }, [initialCamera])

  const report = useCallback(
    (patch: UpsertLearningProgressBody) => {
      if (learningActive) onProgress(patch)
    },
    [learningActive, onProgress],
  )

  const reportScene = useCallback(
    (pct: number, camera?: FbxCameraState) => {
      if (camera) sceneCameraRef.current = camera
      report({
        progressPercent: Math.max(progress?.progressPercent ?? 0, pct),
        lastPosition: {
          kind: 'vr',
          value: pct,
          meta: stringifyLearningMeta({ fbxCamera: sceneCameraRef.current }),
        },
        status: pct >= LEARNING_COMPLETE_THRESHOLD ? 'completed' : 'in_progress',
      })
    },
    [progress?.progressPercent, report],
  )

  const format = content.vrFormat?.toLowerCase()
  const isFbx = format === 'fbx' || Boolean(url?.match(/\.fbx(\?|$)/i))
  const isModelFile = Boolean(url?.match(/\.(glb|gltf|fbx)(\?|$)/i))
  const isVideoAnim = mode === 'animation3d' && Boolean(url) && !isModelFile && !isFbx
  const canRenderModel = isFbx || format === 'glb' || format === 'gltf' || isModelFile

  useEffect(() => {
    if (!isVideoAnim) return
    const el = animVideoRef.current
    if (!el) return
    if (paused) el.pause()
    else void el.play().catch(() => onError())
  }, [isVideoAnim, paused, onError])

  useEffect(() => {
    if (!isVideoAnim) return
    const el = animVideoRef.current
    if (!el) return

    const onMeta = () => {
      const t = savedMeta.animationElapsed ?? progress?.lastPosition?.value ?? 0
      if (t > 0 && t < (el.duration || Infinity)) {
        el.currentTime = t
      }
      onReady()
    }

    const onTime = throttle(() => {
      const pct =
        el.duration > 0
          ? Math.min(100, Math.round((el.currentTime / el.duration) * 100))
          : Math.max(progress?.progressPercent ?? 0, 10)
      report({
        progressPercent: pct,
        lastPosition: {
          kind: 'vr',
          value: el.currentTime,
          meta: stringifyLearningMeta({ animationElapsed: el.currentTime }),
        },
        status: pct >= LEARNING_COMPLETE_THRESHOLD ? 'completed' : 'in_progress',
      })
    }, 4000)

    el.addEventListener('loadedmetadata', onMeta, { once: true })
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('error', onError, { once: true })
    return () => {
      el.removeEventListener('timeupdate', onTime)
    }
  }, [
    isVideoAnim,
    content.id,
    onReady,
    onError,
    report,
    progress?.lastPosition?.value,
    progress?.progressPercent,
    savedMeta.animationElapsed,
  ])

  if (!url) {
    return <p className="text-sm text-slate-500">暂无 3D / VR 课件</p>
  }

  if (isVideoAnim) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
          <video
            ref={animVideoRef}
            src={url}
            poster={content.previewImageUrl ?? undefined}
            playsInline
            muted
            loop
            preload="metadata"
            controls={false}
            className="h-full w-full object-contain"
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          3D 动画 · 将从上次播放位置继续 · 底部可暂停/继续
        </p>
      </div>
    )
  }

  if (!canRenderModel) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
        <p>暂不支持在线预览该 3D 格式，请上传 GLB/GLTF/FBX 或联系管理员。</p>
        <a href={url} download className="mt-2 inline-block text-primary-600 hover:underline">
          下载课件
        </a>
      </div>
    )
  }

  const hint = mode === 'vr' ? vrInteractionHint(content) : '左键旋转 · 中键缩放 · 右键平移'

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 min-h-[min(50vh,420px)]">
        <ModelSceneViewer
          key={content.id}
          url={url}
          paused={paused}
          autoRotate={autoRotate && !paused}
          cameraState={initialCamera}
          onReady={onReady}
          onError={onError}
          onUserInteract={() => setAutoRotate(false)}
          onCameraChange={(cam) => {
            reportScene(Math.max(progress?.progressPercent ?? 0, 45), cam)
          }}
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </div>
  )
}
