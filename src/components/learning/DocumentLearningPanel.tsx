import { useCallback, useEffect, useRef, useState } from 'react'
import { getDocument } from 'pdfjs-dist'
import '../../utils/pdfWorker'
import type { TrainingContent, ContentLearningProgress } from '../../types'
import type { UpsertLearningProgressBody } from '../../api/learningProgress'
import { estimatePdfPages, estimatePptSlides } from '../../utils/previewKind'
import { LEARNING_COMPLETE_THRESHOLD } from '../../utils/learning'
import {
  parseLearningMeta,
  stringifyLearningMeta,
  type HighlightNote,
} from '../../utils/learningMeta'

interface DocumentLearningPanelProps {
  content: TrainingContent
  progress?: ContentLearningProgress
  learningActive: boolean
  paused: boolean
  fontScale: number
  page: number
  onProgress: (patch: UpsertLearningProgressBody) => void
  onReady: () => void
  onError: () => void
}

export function DocumentLearningPanel({
  content,
  progress,
  learningActive,
  paused,
  fontScale,
  page,
  onProgress,
  onReady,
  onError,
}: DocumentLearningPanelProps) {
  const url = content.contentFileUrl
  const isPdf = content.mediaType === 'pdf'
  const totalPages = isPdf ? estimatePdfPages(content) : estimatePptSlides(content)
  const meta = parseLearningMeta(progress?.lastPosition?.meta)

  const [pageText, setPageText] = useState('')
  const [highlights, setHighlights] = useState<HighlightNote[]>(meta.highlights ?? [])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHighlights(meta.highlights ?? [])
  }, [content.id, meta.highlights])

  const persist = useCallback(
    (nextPage: number, nextHighlights: HighlightNote[]) => {
      if (!learningActive) return
      const pct = Math.min(100, Math.round((nextPage / totalPages) * 100))
      const kind = isPdf ? ('pdf' as const) : ('ppt' as const)
      onProgress({
        progressPercent: pct,
        lastPosition: {
          kind,
          value: nextPage,
          meta: stringifyLearningMeta({ highlights: nextHighlights, fontScale }),
        },
        status: pct >= LEARNING_COMPLETE_THRESHOLD ? 'completed' : 'in_progress',
      })
    },
    [learningActive, totalPages, isPdf, fontScale, onProgress],
  )

  const addHighlight = useCallback(() => {
    const sel = window.getSelection()
    const text = sel?.toString().trim()
    if (!text || !textRef.current?.contains(sel?.anchorNode ?? null)) return
    const note: HighlightNote = {
      id: crypto.randomUUID(),
      page,
      text,
      createdAt: new Date().toISOString(),
    }
    const next = [...highlights, note]
    setHighlights(next)
    persist(page, next)
    sel?.removeAllRanges()
  }, [page, highlights, persist])

  useEffect(() => {
    const handler = () => addHighlight()
    document.addEventListener('learning-highlight', handler)
    return () => document.removeEventListener('learning-highlight', handler)
  }, [addHighlight])

  useEffect(() => {
    if (content.mediaType === 'none' || !url) {
      onReady()
      return
    }
    if (!isPdf || paused) return
    let cancelled = false

    const load = async () => {
      try {
        const pdf = await getDocument(url).promise
        const numPages = pdf.numPages
        const p = Math.min(page, numPages)
        const pdfPage = await pdf.getPage(p)
        const viewport = pdfPage.getViewport({ scale: 1.2 * fontScale })
        let canvas = canvasRef.current
        if (!canvas) {
          await new Promise((r) => requestAnimationFrame(r))
          canvas = canvasRef.current
        }
        if (!canvas || cancelled) return
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('canvas')
        await pdfPage.render({ canvasContext: ctx, viewport }).promise
        const textContent = await pdfPage.getTextContent()
        const text = textContent.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
        if (!cancelled) {
          setPageText(text)
          onReady()
          persist(p, highlights)
        }
      } catch {
        if (!cancelled) onError()
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [isPdf, url, page, fontScale, paused, content.id, content.mediaType, onReady, onError])

  useEffect(() => {
    if (isPdf || !url) return
    if (paused) return
    onReady()
  }, [isPdf, url, paused, onReady])

  useEffect(() => {
    if (!learningActive || isPdf) return
    persist(page, highlights)
  }, [page, learningActive, isPdf, persist, highlights])

  if (!url && content.mediaType !== 'none') {
    return <p className="text-sm text-slate-500">暂无课件文件</p>
  }

  if (content.mediaType === 'none' || !url) {
    return (
      <p
        className="whitespace-pre-wrap leading-relaxed text-slate-700"
        style={{ fontSize: `${fontScale}rem` }}
      >
        {content.description || '阅读完成后将记录学习进度。'}
      </p>
    )
  }

  if (isPdf) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
          <canvas ref={canvasRef} className="mx-auto max-w-full" />
        </div>
        <div
          ref={textRef}
          className="max-h-32 shrink-0 overflow-auto rounded-lg border border-amber-100 bg-amber-50/50 p-3 text-slate-800 select-text"
          style={{ fontSize: `${0.875 * fontScale}rem`, lineHeight: 1.6 }}
        >
          {pageText || '本页暂无可选中文本，请阅读上方页面内容。'}
        </div>
        {highlights.filter((h) => h.page === page).length > 0 && (
          <div className="shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-xs">
            <p className="font-medium text-slate-700">我的标注</p>
            <ul className="mt-1 max-h-16 space-y-1 overflow-auto">
              {highlights
                .filter((h) => h.page === page)
                .map((h) => (
                  <li key={h.id} className="rounded bg-yellow-100 px-2 py-0.5 text-slate-700">
                    {h.text}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  const absoluteUrl = new URL(url, window.location.origin).href
  const officeEmbed = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteUrl)}`

  return (
    <div className="flex h-full min-h-0 flex-col">
      <iframe
        title={content.title}
        src={officeEmbed}
        className="min-h-0 flex-1 w-full rounded-lg border border-slate-200"
        allowFullScreen
        onLoad={onReady}
        onError={onError}
      />
      <p className="mt-2 shrink-0 text-xs text-slate-500">
        PPT 在线预览 · 当前第 {page} / {totalPages} 页（估算）
      </p>
    </div>
  )
}
