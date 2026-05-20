import { useEffect } from 'react'
import type { TrainingContent } from '../../types'
import { useMediaReachable } from '../../hooks/useMediaReachable'
import { usePreviewLoad } from '../../hooks/usePreviewLoad'
import { PreviewFrame } from './PreviewFrame'
import { estimatePdfPages, estimatePptSlides } from '../../utils/previewKind'

const TEXT_PREVIEW_CHARS = 500

interface DocumentPreviewProps {
  content: TrainingContent
}

export function DocumentPreview({ content }: DocumentPreviewProps) {
  const url = content.contentFileUrl
  const isPdf = content.mediaType === 'pdf'
  const totalPages = isPdf ? estimatePdfPages(content) : estimatePptSlides(content)
  const { status, markReady, markError, retryLoad, retry } = usePreviewLoad([content.id, url])
  const hasFile = Boolean(url) && content.mediaType !== 'none'

  useMediaReachable(url, hasFile, markReady, markError, retry)

  const fullText = content.description || ''
  const textPreview = fullText.slice(0, TEXT_PREVIEW_CHARS)
  const totalChars = fullText.length

  useEffect(() => {
    if (content.mediaType === 'none' || (!url && content.mediaType !== 'pdf' && content.mediaType !== 'ppt')) {
      markReady()
    }
    if (content.mediaType === 'ppt' && url && !content.previewImageUrl) {
      markReady()
    }
  }, [content.mediaType, url, content.previewImageUrl, markReady])

  if (content.mediaType === 'none' || !url) {
    return (
      <PreviewFrame status={status} onRetry={retryLoad}>
        <div>
          <p className="text-xs text-slate-500">
            共 {totalChars} 字 · 预览前 {Math.min(TEXT_PREVIEW_CHARS, totalChars)} 字
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{textPreview}</p>
          {totalChars > TEXT_PREVIEW_CHARS && (
            <p className="mt-2 text-xs text-slate-400">… 点击「开始学习」阅读全文</p>
          )}
        </div>
      </PreviewFrame>
    )
  }

  if (isPdf) {
    const iframeSrc = `${url}#page=1&toolbar=0&navpanes=0`
    return (
      <PreviewFrame status={status} onRetry={retryLoad}>
        <p className="mb-2 text-xs text-slate-500">
          共 {totalPages} 页 · 预览首页 · 完整内容请进入「开始学习」
        </p>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          <iframe
            key={retry}
            title={`${content.title} 预览`}
            src={iframeSrc}
            className="h-[min(52vh,420px)] w-full bg-white"
            onLoad={markReady}
            onError={markError}
          />
        </div>
      </PreviewFrame>
    )
  }

  const slideText =
    fullText.slice(0, Math.floor(TEXT_PREVIEW_CHARS / 3)) || '第 1 页核心要点（预览）'

  return (
    <PreviewFrame status={status} onRetry={retryLoad}>
      <p className="mb-2 text-xs text-slate-500">
        共 {totalPages} 页 · 预览首页 · 完整内容请进入「开始学习」
      </p>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        {content.previewImageUrl ? (
          <img
            src={content.previewImageUrl}
            alt=""
            className="mx-auto max-h-48 w-full rounded object-contain"
            loading="lazy"
            onLoad={markReady}
            onError={markError}
          />
        ) : (
          <p className="text-sm leading-relaxed text-slate-700">{slideText}</p>
        )}
      </div>
    </PreviewFrame>
  )
}
