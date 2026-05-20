import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { TRAINING_CONTENTS } from '../../data/content'
import { listTrainingContents } from '../../api/trainingContent'
import { useLearningProgress } from '../../context/LearningProgressContext'
import { useApp } from '../../context/AppContext'
import type { TrainingContent } from '../../types'
import { learningStatusLabel } from '../../utils/learning'
import { learningPositionSummary } from '../../utils/learningPositionLabel'

export function LearningRecordsSection() {
  const { ready, listProgressRecords, clearProgress } = useLearningProgress()
  const { showToast } = useApp()
  const [contents, setContents] = useState<Record<string, TrainingContent>>({})

  useEffect(() => {
    let cancelled = false
    listTrainingContents()
      .then((list) => {
        if (cancelled) return
        const map: Record<string, TrainingContent> = {}
        for (const c of list) map[c.id] = c
        for (const c of TRAINING_CONTENTS) {
          if (!map[c.id]) map[c.id] = c
        }
        setContents(map)
      })
      .catch(() => {
        if (!cancelled) {
          const map: Record<string, TrainingContent> = {}
          for (const c of TRAINING_CONTENTS) map[c.id] = c
          setContents(map)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const records = listProgressRecords()

  const handleClear = (contentId: string, title: string) => {
    if (!window.confirm(`确定清除「${title}」的学习进度？清除后需从头开始学习。`)) return
    clearProgress(contentId)
    showToast('已清除该内容的学习进度')
  }

  return (
    <section className="mt-6 card">
      <h2 className="font-semibold text-slate-900">学习记录</h2>
      <p className="mt-1 text-sm text-slate-500">
        查看各培训内容的学习进度，可继续学习或手动清除进度（数据长期保存，直至完成或清除）
      </p>

      {!ready && <p className="mt-4 text-sm text-slate-400">加载学习记录…</p>}

      {ready && records.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">暂无学习记录，前往培训内容开始学习。</p>
      )}

      {ready && records.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100">
          {records.map((progress) => {
            const content = contents[progress.contentId]
            const title = content?.title ?? progress.contentId
            const summary = content
              ? learningPositionSummary(content, progress)
              : learningStatusLabel(progress.status, progress.progressPercent)

            return (
              <li key={progress.contentId} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {learningStatusLabel(progress.status, progress.progressPercent)}
                    {summary !== '—' && (
                      <span className="text-slate-600"> · {summary}</span>
                    )}
                  </p>
                  {progress.updatedAt && (
                    <p className="mt-0.5 text-xs text-slate-400">
                      最近学习：{new Date(progress.updatedAt).toLocaleString('zh-CN')}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    to={`/content?id=${progress.contentId}&learn=1`}
                    className="btn-primary text-xs"
                  >
                    {progress.status === 'completed' ? '复习' : '继续学习'}
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleClear(progress.contentId, title)}
                    className="btn-secondary px-2 text-xs text-slate-600"
                    aria-label={`清除 ${title} 的学习进度`}
                  >
                    <Trash2 className="h-4 w-4" />
                    清除
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {ready && records.length > 0 && (
        <Link to="/content" className="mt-3 inline-block text-sm text-primary-600 hover:underline">
          浏览全部培训内容
        </Link>
      )}
    </section>
  )
}
