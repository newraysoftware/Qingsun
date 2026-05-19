import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { PlanTask, TrainingStageId, UserProfile } from '../types'
import { apiUserToProfile } from '../types'
import { TRAINING_CONTENTS } from '../data/content'
import { STAGE_LABEL } from '../data/trainingSystem'
import { updateProfile } from '../api/auth'
import { useAuth } from './AuthContext'

const GUEST_STORAGE_KEY = 'qingsun-guest-profile'

interface Toast {
  id: number
  message: string
}

interface AppContextValue {
  user: UserProfile
  tasks: PlanTask[]
  checkedInToday: boolean
  toast: Toast | null
  isGuest: boolean
  completeTask: (taskId: string) => void
  checkIn: () => void
  runAssessment: (stageId: TrainingStageId) => void
  updateStage: (stageId: TrainingStageId) => void
  generatePlanFromAssessment: (years: number, weakAreas: string[]) => void
  showToast: (message: string) => void
}

const defaultUser: UserProfile = {
  name: '访客',
  stageId: 'foundation',
  yearsOfPractice: 0,
  planProgress: 0,
  contentMastery: 0,
  points: 0,
  streak: 0,
  weakAreas: [],
  assessmentDone: false,
}

function buildDefaultTasks(stageId: TrainingStageId): PlanTask[] {
  const contents = TRAINING_CONTENTS.filter((c) => c.stageId === stageId).slice(0, 4)
  const now = new Date()
  return contents.map((c, i) => {
    const due = new Date(now)
    due.setDate(due.getDate() + (i + 1) * 7)
    return {
      id: `task-${c.id}`,
      stageId,
      week: i + 1,
      title: c.title,
      type: c.type,
      contentId: c.id,
      completed: i === 0,
      dueDate: due.toISOString().slice(0, 10),
    }
  })
}

function loadGuestProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY)
    if (raw) return { ...defaultUser, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return defaultUser
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isAuthenticated, setUser: setAuthUser } = useAuth()
  const [guestUser, setGuestUser] = useState<UserProfile>(loadGuestProfile)
  const [tasks, setTasks] = useState<PlanTask[]>(() => buildDefaultTasks('foundation'))
  const [checkedInToday, setCheckedInToday] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  const user = isAuthenticated && authUser ? apiUserToProfile(authUser) : guestUser
  const isGuest = !isAuthenticated

  useEffect(() => {
    if (authUser) {
      setTasks(buildDefaultTasks(authUser.stageId))
    }
  }, [authUser?.id, authUser?.stageId])

  useEffect(() => {
    if (isGuest) {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestUser))
    }
  }, [guestUser, isGuest])

  const persistUser = useCallback(
    async (next: UserProfile) => {
      if (isAuthenticated && authUser) {
        try {
          const { user: updated } = await updateProfile(next)
          setAuthUser(updated)
        } catch {
          /* 静默失败，避免打断操作 */
        }
      } else {
        setGuestUser(next)
      }
    },
    [isAuthenticated, authUser, setAuthUser],
  )

  const showToast = useCallback((message: string) => {
    const id = Date.now()
    setToast({ id, message })
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2800)
  }, [])

  const applyUserUpdate = useCallback(
    (updater: (u: UserProfile) => UserProfile) => {
      const base = isAuthenticated && authUser ? apiUserToProfile(authUser) : guestUser
      const next = updater(base)
      void persistUser(next)
    },
    [authUser, guestUser, isAuthenticated, persistUser],
  )

  const completeTask = useCallback(
    (taskId: string) => {
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
        const done = next.filter((t) => t.completed).length
        const progress = Math.round((done / next.length) * 100)
        applyUserUpdate((u) => ({
          ...u,
          planProgress: progress,
          contentMastery: Math.min(100, u.contentMastery + 8),
          points: u.points + 15,
        }))
        return next
      })
      showToast('任务已完成，+15积分')
    },
    [applyUserUpdate, showToast],
  )

  const checkIn = useCallback(() => {
    if (checkedInToday) {
      showToast('今日已打卡')
      return
    }
    setCheckedInToday(true)
    applyUserUpdate((u) => ({
      ...u,
      streak: u.streak + 1,
      points: u.points + (u.streak >= 6 ? 20 : 10),
    }))
    showToast(`打卡成功！连续${user.streak + 1}天`)
  }, [checkedInToday, applyUserUpdate, showToast, user.streak])

  const runAssessment = useCallback(
    (_stageId: TrainingStageId) => {
      const passed = Math.random() > 0.35
      applyUserUpdate((u) => ({
        ...u,
        points: u.points + (passed ? 50 : 20),
        planProgress: passed ? Math.min(100, u.planProgress + 15) : u.planProgress,
        weakAreas: passed ? u.weakAreas.slice(0, 1) : [...u.weakAreas, '阶段考核未达标项'],
      }))
      showToast(passed ? '考核通过，体系达标！' : '未达标，已自动补充学习内容至规划')
    },
    [applyUserUpdate, showToast],
  )

  const updateStage = useCallback(
    (stageId: TrainingStageId) => {
      setTasks(buildDefaultTasks(stageId))
      applyUserUpdate((u) => ({ ...u, stageId }))
      showToast(`已切换至${STAGE_LABEL[stageId]}`)
    },
    [applyUserUpdate, showToast],
  )

  const generatePlanFromAssessment = useCallback(
    (years: number, weakAreas: string[]) => {
      let stageId: TrainingStageId = 'foundation'
      if (years >= 7) stageId = 'mastery'
      else if (years >= 6) stageId = 'authorization'
      else if (years >= 3) stageId = 'advanced'
      setTasks(buildDefaultTasks(stageId))
      applyUserUpdate((u) => ({
        ...u,
        yearsOfPractice: years,
        stageId,
        weakAreas,
        assessmentDone: true,
        planProgress: 0,
        contentMastery: 10,
      }))
      showToast('专属自学计划已生成')
    },
    [applyUserUpdate, showToast],
  )

  const value = useMemo(
    () => ({
      user,
      tasks,
      checkedInToday,
      toast,
      isGuest,
      completeTask,
      checkIn,
      runAssessment,
      updateStage,
      generatePlanFromAssessment,
      showToast,
    }),
    [
      user,
      tasks,
      checkedInToday,
      toast,
      isGuest,
      completeTask,
      checkIn,
      runAssessment,
      updateStage,
      generatePlanFromAssessment,
      showToast,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
