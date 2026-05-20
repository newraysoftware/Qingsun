export type TrainingStageId = 'foundation' | 'advanced' | 'authorization' | 'mastery'

export interface TrainingStage {
  id: TrainingStageId
  name: string
  period: string
  targetAudience: string
  coreGoal: string
  keyContent: string[]
  color: string
}

export type ContentType = 'theory' | 'dsa' | 'virtual' | 'case'
export type MediaType = 'none' | 'pdf' | 'ppt' | 'video' | 'vr'
export type VrFormat = 'glb' | 'gltf' | 'fbx'
export type ContentStatus = 'draft' | 'published'
export type LearningStatus = 'not_started' | 'in_progress' | 'completed'
export type LearningPositionKind = 'video' | 'pdf' | 'ppt' | 'vr' | 'document'

export interface LearningPosition {
  kind: LearningPositionKind
  value: number
  meta?: string
}

export interface ContentLearningProgress {
  contentId: string
  status: LearningStatus
  progressPercent: number
  lastPosition: LearningPosition | null
  startedAt: string | null
  completedAt: string | null
  updatedAt: string
}

export interface TrainingContent {
  id: string
  stageId: TrainingStageId
  /** @deprecated 使用 category，与 type 同义 */
  type: ContentType
  category: ContentType
  title: string
  description: string
  duration: string
  tags: string[]
  mediaType: MediaType
  previewImageUrl: string | null
  contentFileUrl: string | null
  contentFileName: string | null
  contentFileSize: number | null
  vrFormat: VrFormat | null
  status: ContentStatus
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

/** 将 API 记录映射为统一结构（兼容旧字段 type） */
export function normalizeContent(c: TrainingContent): TrainingContent {
  return { ...c, type: c.category ?? c.type }
}

export interface PlanTask {
  id: string
  stageId: TrainingStageId
  week: number
  title: string
  type: ContentType
  contentId: string
  completed: boolean
  dueDate: string
}

export interface Assessment {
  id: string
  stageId: TrainingStageId
  title: string
  period: 'month' | 'quarter' | 'year'
  theoryScore?: number
  practiceScore?: number
  passed?: boolean
}

export interface CaseStudy {
  id: string
  stageId: TrainingStageId
  direction: string
  title: string
  focus: string
  preOp: string
  intraOp: string
  postOp: string
  dsaPoints: string
}

export interface Expert {
  id: string
  name: string
  title: string
  hospital: string
  stages: TrainingStageId[]
  specialties: string[]
  bio: string
}

export interface CommunityGroup {
  id: string
  name: string
  stageId?: TrainingStageId
  category: string
  members: number
  posts: number
}

export interface UserProfile {
  name: string
  stageId: TrainingStageId
  yearsOfPractice: number
  planProgress: number
  contentMastery: number
  points: number
  streak: number
  weakAreas: string[]
  assessmentDone: boolean
}

export type UserRole = 'admin' | 'user'

/** 后端返回的用户（含账号信息） */
export interface ApiUser extends UserProfile {
  id: number
  email: string
  role: UserRole
}

export function apiUserToProfile(user: ApiUser): UserProfile {
  return {
    name: user.name,
    stageId: user.stageId,
    yearsOfPractice: user.yearsOfPractice,
    planProgress: user.planProgress,
    contentMastery: user.contentMastery,
    points: user.points,
    streak: user.streak,
    weakAreas: user.weakAreas,
    assessmentDone: user.assessmentDone,
  }
}
