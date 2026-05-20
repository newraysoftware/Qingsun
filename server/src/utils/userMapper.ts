import type { DbUser } from '../db.js'
import type { PublicUser, TrainingStageId } from '../types.js'

export function mapUser(row: DbUser): PublicUser {
  let weakAreas: string[] = []
  try {
    weakAreas = JSON.parse(row.weak_areas) as string[]
  } catch {
    weakAreas = []
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role === 'admin' ? 'admin' : 'user',
    stageId: row.stage_id as TrainingStageId,
    yearsOfPractice: row.years_of_practice,
    planProgress: row.plan_progress,
    contentMastery: row.content_mastery,
    points: row.points,
    streak: row.streak,
    weakAreas,
    assessmentDone: row.assessment_done === 1,
  }
}
