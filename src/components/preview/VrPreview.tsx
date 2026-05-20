import { useEffect, useState } from 'react'
import type { TrainingContent } from '../../types'
import { useMediaReachable } from '../../hooks/useMediaReachable'
import { usePreviewLoad } from '../../hooks/usePreviewLoad'
import { PreviewFrame } from './PreviewFrame'
import { vrInteractionHint } from '../../utils/previewKind'
import { ModelSceneViewer } from '../viewer/ModelSceneViewer'

const TRIAL_SECONDS = 10

interface VrPreviewProps {
  content: TrainingContent
}

export function VrPreview({ content }: VrPreviewProps) {
  const url = content.contentFileUrl
  const format = content.vrFormat?.toLowerCase()
  const canTrial = format === 'glb' || format === 'gltf' || format === 'fbx'
  const [trialing, setTrialing] = useState(false)
  const [trialDone, setTrialDone] = useState(false)
  const { status, markReady, markError, retryLoad } = usePreviewLoad([
    content.id,
    url,
    trialing,
  ])

  useMediaReachable(url, Boolean(url), markReady, markError, retryLoad)

  useEffect(() => {
    if (!trialing) return
    const t = window.setTimeout(() => {
      setTrialing(false)
      setTrialDone(true)
    }, TRIAL_SECONDS * 1000)
    return () => clearTimeout(t)
  }, [trialing])

  useEffect(() => {
    if (!content.previewImageUrl && !trialing) markReady()
  }, [content.previewImageUrl, trialing, markReady])

  const hint = vrInteractionHint(content)

  if (!url) {
    return (
      <PreviewFrame status="ready" onRetry={retryLoad}>
        <p className="text-center text-sm text-slate-500">暂无 VR 课件</p>
      </PreviewFrame>
    )
  }

  if (trialing && canTrial) {
    return (
      <PreviewFrame status={status} onRetry={retryLoad}>
        <p className="mb-2 text-center text-xs text-primary-700">
          3D 交互预览（{TRIAL_SECONDS} 秒）· {hint}
        </p>
        <ModelSceneViewer
          url={url}
          autoRotate
          onReady={markReady}
          onError={markError}
          style={{ height: 'min(42vh, 360px)' }}
        />
      </PreviewFrame>
    )
  }

  return (
    <PreviewFrame status={status} onRetry={retryLoad}>
      <button
        type="button"
        className="w-full text-left"
        onClick={() => {
          if (!canTrial || trialDone) return
          setTrialing(true)
        }}
        disabled={!canTrial || trialDone}
      >
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {content.previewImageUrl ? (
            <img
              src={content.previewImageUrl}
              alt=""
              className="h-[min(36vh,280px)] w-full object-cover"
              loading="lazy"
              onLoad={markReady}
              onError={markError}
            />
          ) : (
            <div className="flex h-[min(36vh,280px)] items-center justify-center bg-primary-50 text-sm text-primary-700">
              VR 场景预览
            </div>
          )}
          {!trialDone && canTrial && (
            <p className="border-t border-slate-100 bg-white px-3 py-2 text-center text-xs text-primary-600">
              点击预览区 · 体验 {TRIAL_SECONDS} 秒 3D 交互（{hint}）
            </p>
          )}
        </div>
      </button>
      <p className="mt-3 text-sm text-slate-600">{hint}</p>
      <p className="mt-2 text-xs font-medium text-primary-700">点击开始学习，在课件中自由查看模型</p>
    </PreviewFrame>
  )
}
