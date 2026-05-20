import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { ContentLearningProgress } from '../types'
import { emptyProgress, LEARNING_COMPLETE_THRESHOLD } from '../utils/learning'
import * as learningApi from '../api/learningProgress'
import type { UpsertLearningProgressBody } from '../api/learningProgress'
import { useAuth } from './AuthContext'
import { useApp } from './AppContext'

const GUEST_PROGRESS_KEY = 'qingsun-learning-progress'
const SAVE_DEBOUNCE_MS = 800

interface LearningProgressContextValue {
  ready: boolean
  getProgress: (contentId: string) => ContentLearningProgress
  listProgressRecords: () => ContentLearningProgress[]
  startLearning: (contentId: string) => void
  reportProgress: (contentId: string, patch: UpsertLearningProgressBody) => void
  flushProgress: (contentId: string) => void
  flushAllProgress: () => void
  clearProgress: (contentId: string) => void
  completeLearning: (contentId: string) => void
}

const LearningProgressContext = createContext<LearningProgressContextValue | null>(null)

function loadGuestMap(): Record<string, ContentLearningProgress> {
  try {
    const raw = localStorage.getItem(GUEST_PROGRESS_KEY)
    if (raw) return JSON.parse(raw) as Record<string, ContentLearningProgress>
  } catch {
    /* ignore */
  }
  return {}
}

function saveGuestMap(map: Record<string, ContentLearningProgress>) {
  localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(map))
}

function mergeProgress(
  current: ContentLearningProgress,
  patch: UpsertLearningProgressBody,
): ContentLearningProgress {
  const progressPercent = Math.max(
    current.progressPercent,
    patch.progressPercent ?? current.progressPercent,
  )
  let status = patch.status ?? current.status
  if (progressPercent >= LEARNING_COMPLETE_THRESHOLD && status === 'in_progress') {
    status = 'completed'
  }
  const lastPosition =
    patch.lastPosition !== undefined ? patch.lastPosition : current.lastPosition
  const now = new Date().toISOString()
  return {
    ...current,
    status,
    progressPercent: status === 'completed' ? Math.max(progressPercent, 100) : progressPercent,
    lastPosition,
    startedAt: status !== 'not_started' ? (current.startedAt ?? now) : current.startedAt,
    completedAt: status === 'completed' ? (current.completedAt ?? now) : current.completedAt,
    updatedAt: now,
  }
}

function shouldSkipVideoPatch(
  current: ContentLearningProgress,
  patch: UpsertLearningProgressBody,
): boolean {
  if (patch.lastPosition?.kind !== 'video' || current.lastPosition?.kind !== 'video') {
    return false
  }
  if (patch.progressPercent !== undefined && patch.progressPercent !== current.progressPercent) {
    return false
  }
  if (patch.lastPosition.meta !== current.lastPosition.meta) return false
  return Math.abs((patch.lastPosition.value ?? 0) - (current.lastPosition?.value ?? 0)) < 4
}

export function LearningProgressProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const { syncContentCompleted } = useApp()
  const [map, setMap] = useState<Record<string, ContentLearningProgress>>({})
  const [ready, setReady] = useState(false)
  const mapRef = useRef(map)
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const isAuthenticatedRef = useRef(isAuthenticated)

  mapRef.current = map
  isAuthenticatedRef.current = isAuthenticated

  useEffect(() => {
    let cancelled = false
    setReady(false)
    if (isAuthenticated) {
      learningApi
        .fetchAllLearningProgress()
        .then((items) => {
          if (cancelled) return
          const next: Record<string, ContentLearningProgress> = {}
          for (const item of items) next[item.contentId] = item
          setMap(next)
        })
        .catch(() => {
          if (!cancelled) setMap({})
        })
        .finally(() => {
          if (!cancelled) setReady(true)
        })
    } else {
      setMap(loadGuestMap())
      setReady(true)
    }
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user?.id])

  const persistRemote = useCallback((contentId: string, patch: UpsertLearningProgressBody) => {
    if (!isAuthenticatedRef.current) return
    void learningApi.upsertLearningProgress(contentId, patch).catch(() => {})
  }, [])

  const flushProgress = useCallback(
    (contentId: string) => {
      const pending = saveTimers.current.get(contentId)
      if (pending) {
        clearTimeout(pending)
        saveTimers.current.delete(contentId)
      }
      const merged = mapRef.current[contentId]
      if (!merged || merged.status === 'not_started') return
      if (isAuthenticatedRef.current) {
        persistRemote(contentId, {
          status: merged.status,
          progressPercent: merged.progressPercent,
          lastPosition: merged.lastPosition,
        })
      } else {
        saveGuestMap(mapRef.current)
      }
    },
    [persistRemote],
  )

  const flushAllProgress = useCallback(() => {
    for (const contentId of [...saveTimers.current.keys()]) {
      flushProgress(contentId)
    }
    if (!isAuthenticatedRef.current) {
      saveGuestMap(mapRef.current)
    }
  }, [flushProgress])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushAllProgress()
    }
    const onPageHide = () => flushAllProgress()
    const onBeforeUnload = () => {
      if (!isAuthenticatedRef.current) saveGuestMap(mapRef.current)
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [flushAllProgress])

  const scheduleSave = useCallback(
    (contentId: string, merged: ContentLearningProgress) => {
      if (!isAuthenticatedRef.current) {
        saveGuestMap({ ...mapRef.current, [contentId]: merged })
        return
      }
      const existing = saveTimers.current.get(contentId)
      if (existing) clearTimeout(existing)
      saveTimers.current.set(
        contentId,
        setTimeout(() => {
          saveTimers.current.delete(contentId)
          persistRemote(contentId, {
            status: merged.status,
            progressPercent: merged.progressPercent,
            lastPosition: merged.lastPosition,
          })
        }, SAVE_DEBOUNCE_MS),
      )
    },
    [persistRemote],
  )

  const applyPatch = useCallback(
    (contentId: string, patch: UpsertLearningProgressBody, options?: { forceComplete?: boolean }) => {
      setMap((prev) => {
        const current = prev[contentId] ?? emptyProgress(contentId)
        if (!options?.forceComplete && shouldSkipVideoPatch(current, patch)) {
          return prev
        }
        let merged = mergeProgress(current, patch)
        if (options?.forceComplete) {
          merged = {
            ...merged,
            status: 'completed',
            progressPercent: 100,
            completedAt: merged.completedAt ?? new Date().toISOString(),
          }
        }
        const wasCompleted = current.status === 'completed'
        const next = { ...prev, [contentId]: merged }
        mapRef.current = next
        scheduleSave(contentId, merged)
        if (!wasCompleted && merged.status === 'completed') {
          syncContentCompleted(contentId)
        }
        return next
      })
    },
    [scheduleSave, syncContentCompleted],
  )

  const getProgress = useCallback(
    (contentId: string) => map[contentId] ?? emptyProgress(contentId),
    [map],
  )

  const listProgressRecords = useCallback(
    () =>
      Object.values(mapRef.current)
        .filter((p) => p.status !== 'not_started')
        .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1)),
    [map],
  )

  const startLearning = useCallback(
    (contentId: string) => {
      const current = mapRef.current[contentId] ?? emptyProgress(contentId)
      if (current.status === 'completed') return
      applyPatch(contentId, {
        status: 'in_progress',
        progressPercent: Math.max(current.progressPercent, 1),
      })
    },
    [applyPatch],
  )

  const reportProgress = useCallback(
    (contentId: string, patch: UpsertLearningProgressBody) => {
      const current = mapRef.current[contentId] ?? emptyProgress(contentId)
      if (current.status === 'completed' && patch.status !== 'in_progress') {
        if (patch.lastPosition || patch.progressPercent !== undefined) {
          applyPatch(contentId, {
            lastPosition: patch.lastPosition,
            progressPercent: patch.progressPercent,
          })
        }
        return
      }
      applyPatch(contentId, {
        status: 'in_progress',
        ...patch,
      })
    },
    [applyPatch],
  )

  const clearProgress = useCallback(
    (contentId: string) => {
      const pending = saveTimers.current.get(contentId)
      if (pending) {
        clearTimeout(pending)
        saveTimers.current.delete(contentId)
      }
      setMap((prev) => {
        const next = { ...prev }
        delete next[contentId]
        mapRef.current = next
        if (!isAuthenticatedRef.current) saveGuestMap(next)
        return next
      })
      if (isAuthenticatedRef.current) {
        void learningApi.deleteLearningProgress(contentId).catch(() => {})
      }
    },
    [],
  )

  const completeLearning = useCallback(
    (contentId: string) => {
      applyPatch(contentId, { status: 'completed', progressPercent: 100 }, { forceComplete: true })
      flushProgress(contentId)
    },
    [applyPatch, flushProgress],
  )

  const value = useMemo(
    () => ({
      ready,
      getProgress,
      listProgressRecords,
      startLearning,
      reportProgress,
      flushProgress,
      flushAllProgress,
      clearProgress,
      completeLearning,
    }),
    [
      ready,
      getProgress,
      listProgressRecords,
      startLearning,
      reportProgress,
      flushProgress,
      flushAllProgress,
      clearProgress,
      completeLearning,
    ],
  )

  return (
    <LearningProgressContext.Provider value={value}>{children}</LearningProgressContext.Provider>
  )
}

export function useLearningProgress() {
  const ctx = useContext(LearningProgressContext)
  if (!ctx) throw new Error('useLearningProgress must be used within LearningProgressProvider')
  return ctx
}
