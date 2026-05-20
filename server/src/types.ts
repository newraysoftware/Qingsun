export type TrainingStageId = 'foundation' | 'advanced' | 'authorization' | 'mastery'
export type UserRole = 'admin' | 'user'

export interface PublicUser {
  id: number
  email: string
  name: string
  role: UserRole
  stageId: TrainingStageId
  yearsOfPractice: number
  planProgress: number
  contentMastery: number
  points: number
  streak: number
  weakAreas: string[]
  assessmentDone: boolean
}
