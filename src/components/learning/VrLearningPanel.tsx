import { useCallback, useMemo, useRef } from 'react'
import type { TrainingContent, ContentLearningProgress } from '../../types'
import type { UpsertLearningProgressBody } from '../../api/learningProgress'
import { parseLearningMeta, stringifyLearningMeta } from '../../utils/learningMeta'
import { LEARNING_COMPLETE_THRESHOLD } from '../../utils/learning'
import type { FbxCameraState } from '../../utils/fbxScene'
import { VrLearningCanvas } from './VrLearningCanvas'

interface VrLearningPanelProps {
  content: TrainingContent
  progress?: ContentLearningProgress
  learningActive: boolean
  onProgress: (patch: UpsertLearningProgressBody) => void
  onReady: () => void
  onError: () => void
}

export function VrLearningPanel({
  content,
  progress,
  learningActive,
  onProgress,
  onReady,
  onError,
}: VrLearningPanelProps) {
  const url = content.contentFileUrl
  const initialCamera = useMemo(
    () => parseLearningMeta(progress?.lastPosition?.meta).fbxCamera,
    [content.id],
  )
  const cameraRef = useRef<FbxCameraState | undefined>(initialCamera)

  const reportCamera = useCallback(
    (cam: FbxCameraState) => {
      if (!learningActive) return
      cameraRef.current = cam
      onProgress({
        progressPercent: Math.max(progress?.progressPercent ?? 0, 45),
        lastPosition: {
          kind: 'vr',
          value: Math.max(progress?.progressPercent ?? 0, 45),
          meta: stringifyLearningMeta({ fbxCamera: cam }),
        },
        status:
          (progress?.progressPercent ?? 0) >= LEARNING_COMPLETE_THRESHOLD
            ? 'completed'
            : 'in_progress',
      })
    },
    [learningActive, onProgress, progress?.progressPercent],
  )

  if (!url) {
    return <p className="text-sm text-slate-500">暂无 VR 课件</p>
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="relative w-full flex-1 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
        style={{ height: 'min(50vh, 420px)', minHeight: 320 }}
      >
        <VrLearningCanvas
          url={url}
          cameraState={initialCamera}
          onReady={onReady}
          onError={onError}
          onCameraChange={reportCamera}
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <p className="mt-2 shrink-0 text-xs text-slate-500">
        左键拖动旋转 · 滚轮或中键拖动缩放 · 右键拖动平移
      </p>
    </div>
  )
}
