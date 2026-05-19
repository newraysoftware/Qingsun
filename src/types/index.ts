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

export interface TrainingContent {
  id: string
  stageId: TrainingStageId
  type: ContentType
  title: string
  description: string
  duration: string
  tags: string[]
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

/** 后端返回的用户（含账号信息） */
export interface ApiUser extends UserProfile {
  id: number
  email: string
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
