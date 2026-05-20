import { useCallback, useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { TRAINING_CONTENTS, CONTENT_TYPE_LABEL } from '../data/content'
import { TRAINING_STAGES } from '../data/trainingSystem'
import type { TrainingStageId, ContentType, TrainingContent, LearningStatus } from '../types'
import { listTrainingContents, getTrainingContent } from '../api/trainingContent'
import { useLearningProgress } from '../context/LearningProgressContext'
import { useApp } from '../context/AppContext'
import { useFavorites } from '../hooks/useFavorites'
import { PROGRESS_FILTER_OPTIONS } from '../utils/contentDisplay'
import { ContentBrowseList } from '../components/content/ContentBrowseList'
import { ContentDetailPage } from '../components/content/ContentDetailPage'
import { ContentEntryRow } from '../components/content/ContentEntryRow'
import { ContentLearningModal } from '../components/learning/ContentLearningModal'
import { LearningMinimizedBar } from '../components/learning/LearningMinimizedBar'

const TYPES: ContentType[] = ['theory', 'dsa', 'virtual', 'case']

export function ContentHub() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const stageFilter = (params.get('stage') as TrainingStageId) || ''
  const idFilter = params.get('id')
  const typeFilter = (params.get('type') as ContentType | null) || null
  const progressFilter = (params.get('progress') as LearningStatus | '') || ''
  const learnMode = params.get('learn') === '1'

  const [items, setItems] = useState<TrainingContent[]>([])
  const [learningOpen, setLearningOpen] = useState(false)
  const [learningMinimized, setLearningMinimized] = useState(false)
  const [detail, setDetail] = useState<TrainingContent | null>(null)
  const [loading, setLoading] = useState(true)
  const { ready, getProgress, startLearning, reportProgress, flushProgress } = useLearningProgress()
  const { tasks, showToast } = useApp()
  const { isFavorite, toggleFavorite } = useFavorites()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listTrainingContents({
      stageId: stageFilter || undefined,
      category: typeFilter || undefined,
    })
      .then((list) => {
        if (!cancelled) setItems(list)
      })
      .catch(() => {
        if (!cancelled) {
          let fallback = TRAINING_CONTENTS
          if (stageFilter) fallback = fallback.filter((c) => c.stageId === stageFilter)
          if (typeFilter) fallback = fallback.filter((c) => c.category === typeFilter)
          setItems(fallback)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [stageFilter, typeFilter])

  useEffect(() => {
    if (!idFilter) {
      setDetail(null)
      return
    }
    getTrainingContent(idFilter)
      .then(setDetail)
      .catch(() => {
        setDetail(TRAINING_CONTENTS.find((c) => c.id === idFilter) ?? null)
      })
  }, [idFilter])

  useEffect(() => {
    if (learnMode && idFilter && detail) {
      startLearning(idFilter)
      setLearningOpen(true)
      setLearningMinimized(false)
    }
  }, [learnMode, idFilter, detail?.id, startLearning])

  const setFilter = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params)
      if (value) next.set(key, value)
      else next.delete(key)
      if (idFilter) next.set('id', idFilter)
      setParams(next)
    },
    [params, idFilter, setParams],
  )

  const contentLink = (contentId: string, learn = false) => {
    const q = new URLSearchParams()
    q.set('id', contentId)
    if (stageFilter) q.set('stage', stageFilter)
    if (typeFilter) q.set('type', typeFilter)
    if (progressFilter) q.set('progress', progressFilter)
    if (learn) q.set('learn', '1')
    return `/content?${q}`
  }

  const buildListQuery = (overrides?: {
    stage?: string
    type?: string
    progress?: string
  }) => {
    const q = new URLSearchParams()
    const stage = overrides && 'stage' in overrides ? overrides.stage : stageFilter
    const type = overrides && 'type' in overrides ? overrides.type : typeFilter
    const progress = overrides && 'progress' in overrides ? overrides.progress : progressFilter
    if (stage) q.set('stage', stage)
    if (type) q.set('type', type)
    if (progress) q.set('progress', progress)
    return q
  }

  const listUrl = () => {
    const s = buildListQuery().toString()
    return s ? `/content?${s}` : '/content'
  }

  const exitLearning = useCallback(() => {
    if (detail?.id) flushProgress(detail.id)
    setLearningOpen(false)
    setLearningMinimized(false)
    const q = new URLSearchParams(params)
    q.delete('learn')
    setParams(q)
  }, [params, setParams, detail?.id, flushProgress])

  const enterLearning = () => {
    if (!detail) return
    startLearning(detail.id)
    setLearningOpen(true)
    setLearningMinimized(false)
    const q = new URLSearchParams(params)
    q.set('learn', '1')
    setParams(q)
  }

  const handleShare = async () => {
    if (!detail) return
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({
          title: detail.title,
          text: detail.description,
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        showToast('链接已复制，可分享给同事')
      }
    } catch {
      /* 用户取消分享 */
    }
  }

  const continueItems = items
    .map((c) => ({ content: c, progress: getProgress(c.id) }))
    .filter((x) => x.progress.status === 'in_progress')
    .sort((a, b) => (b.progress.updatedAt > a.progress.updatedAt ? 1 : -1))

  const detailProgress = detail && ready ? getProgress(detail.id) : undefined
  const linkedTask = detail ? tasks.find((t) => t.contentId === detail.id) : undefined

  if (idFilter && detail) {
    return (
      <>
        <ContentDetailPage
          content={detail}
          progress={detailProgress}
          linkedTask={linkedTask}
          ready={ready}
          isFavorite={isFavorite(detail.id)}
          onToggleFavorite={() => {
            toggleFavorite(detail.id)
            showToast(isFavorite(detail.id) ? '已取消收藏' : '已加入收藏')
          }}
          onShare={() => void handleShare()}
          onStartLearning={enterLearning}
          onBack={() => navigate(listUrl())}
        />
        {learningOpen && !learningMinimized && (
          <ContentLearningModal
            content={detail}
            progress={detailProgress}
            onClose={exitLearning}
            onMinimize={() => setLearningMinimized(true)}
            onProgress={(patch) => reportProgress(detail.id, patch)}
          />
        )}
        {learningOpen && learningMinimized && (
          <LearningMinimizedBar
            content={detail}
            progress={detailProgress}
            onRestore={() => setLearningMinimized(false)}
            onClose={exitLearning}
          />
        )}
      </>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="section-title">分阶段培训内容</h1>
      <p className="section-subtitle">
        按培训体系阶段与规划任务层级浏览，支持类型与学习进度筛选
      </p>

      {!idFilter && continueItems.length > 0 && (
        <section className="mt-6 card border-primary-200 bg-primary-50/40">
          <h2 className="text-sm font-semibold text-primary-800">继续学习</h2>
          <ul className="mt-3 space-y-2">
            {continueItems.slice(0, 3).map(({ content, progress }) => (
              <li key={content.id}>
                <ContentEntryRow
                  content={content}
                  progress={progress}
                  to={contentLink(content.id, true)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-slate-500">培训体系阶段</p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <Link
            to={listUrl()}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${!stageFilter ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
            onClick={(e) => {
              if (stageFilter) return
              e.preventDefault()
              const q = buildListQuery({ stage: '' })
              navigate(q.toString() ? `/content?${q}` : '/content')
            }}
          >
            全部阶段
          </Link>
          {TRAINING_STAGES.map((s) => (
            <Link
              key={s.id}
              to={`/content?${buildListQuery({ stage: s.id }).toString()}`}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                stageFilter === s.id ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
              }`}
            >
              {s.name}
            </Link>
          ))}
        </div>
      </div>

      {/* 内容类型 */}
      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-slate-500">内容类型</p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <button
            type="button"
            onClick={() => setFilter('type', '')}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs ${
              !typeFilter ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'bg-white ring-1 ring-slate-200'
            }`}
          >
            全部类型
          </button>
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter('type', t)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs ${
                typeFilter === t
                  ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-200'
                  : 'bg-white ring-1 ring-slate-200'
              }`}
            >
              {CONTENT_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {/* 学习进度 */}
      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-slate-500">学习进度</p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {PROGRESS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value || 'all'}
              type="button"
              onClick={() => setFilter('progress', opt.value)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs ${
                progressFilter === opt.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-200'
                  : 'bg-white ring-1 ring-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="mt-6 text-sm text-slate-400">加载中…</p>}

      {!loading && (
        <ContentBrowseList
          items={items}
          tasks={tasks}
          stageFilter={stageFilter}
          typeFilter={typeFilter}
          progressFilter={progressFilter}
          ready={ready}
          getProgress={getProgress}
          contentLink={(id) => contentLink(id)}
        />
      )}
    </div>
  )
}
