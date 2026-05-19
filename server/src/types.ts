export type TrainingStageId = 'foundation' | 'advanced' | 'authorization' | 'mastery'

export interface PublicUser {
  id: number
  email: string
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
