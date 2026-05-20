import { db } from '../db.js'
import type { UpsertLearningProgressInput } from '../schemas/learningProgress.js'

export type LearningStatus = 'not_started' | 'in_progress' | 'completed'

export interface LearningPosition {
  kind: 'video' | 'pdf' | 'ppt' | 'vr' | 'document'
  value: number
  meta?: string
}

export interface ContentLearningProgressRecord {
  contentId: string
  status: LearningStatus
  progressPercent: number
  lastPosition: LearningPosition | null
  startedAt: string | null
  completedAt: string | null
  updatedAt: string
}

interface DbRow {
  content_id: string
  status: string
  progress_percent: number
  last_position: string | null
  started_at: string | null
  completed_at: string | null
  updated_at: string
}

function parsePosition(raw: string | null): LearningPosition | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as LearningPosition
    if (v && typeof v.kind === 'string' && typeof v.value === 'number') return v
  } catch {
    /* ignore */
  }
  return null
}

function mapRow(row: DbRow): ContentLearningProgressRecord {
  return {
    contentId: row.content_id,
    status: row.status as LearningStatus,
    progressPercent: row.progress_percent,
    lastPosition: parsePosition(row.last_position),
    startedAt: row.started_at,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  }
}

export function listLearningProgress(userId: number): ContentLearningProgressRecord[] {
  const rows = db
    .prepare(
      `SELECT content_id, status, progress_percent, last_position, started_at, completed_at, updated_at
       FROM content_learning_progress WHERE user_id = ? ORDER BY updated_at DESC`,
    )
    .all(userId) as unknown as DbRow[]
  return rows.map(mapRow)
}

export function getLearningProgress(
  userId: number,
  contentId: string,
): ContentLearningProgressRecord | null {
  const row = db
    .prepare(
      `SELECT content_id, status, progress_percent, last_position, started_at, completed_at, updated_at
       FROM content_learning_progress WHERE user_id = ? AND content_id = ?`,
    )
    .get(userId, contentId) as unknown as DbRow | undefined
  return row ? mapRow(row) : null
}

export function upsertLearningProgress(
  userId: number,
  contentId: string,
  input: UpsertLearningProgressInput,
): ContentLearningProgressRecord {
  const existing = getLearningProgress(userId, contentId)
  const nowStatus = input.status ?? existing?.status ?? 'in_progress'
  const nowPercent = Math.max(
    existing?.progressPercent ?? 0,
    input.progressPercent ?? existing?.progressPercent ?? 0,
  )
  const nowPosition =
    input.lastPosition !== undefined ? input.lastPosition : (existing?.lastPosition ?? null)

  const startedAt =
    nowStatus !== 'not_started'
      ? (existing?.startedAt ?? new Date().toISOString())
      : (existing?.startedAt ?? null)
  let completedAt = existing?.completedAt ?? null
  if (nowStatus === 'completed' && !completedAt) {
    completedAt = new Date().toISOString()
  }

  const positionJson = nowPosition ? JSON.stringify(nowPosition) : null

  if (!existing) {
    db.prepare(
      `INSERT INTO content_learning_progress (
        user_id, content_id, status, progress_percent, last_position, started_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      userId,
      contentId,
      nowStatus,
      nowPercent,
      positionJson,
      startedAt,
      completedAt,
    )
  } else {
    db.prepare(
      `UPDATE content_learning_progress SET
        status = ?,
        progress_percent = ?,
        last_position = ?,
        started_at = COALESCE(started_at, ?),
        completed_at = ?,
        updated_at = datetime('now')
       WHERE user_id = ? AND content_id = ?`,
    ).run(
      nowStatus,
      nowPercent,
      positionJson,
      startedAt,
      completedAt,
      userId,
      contentId,
    )
  }

  return getLearningProgress(userId, contentId)!
}

export function deleteLearningProgress(userId: number, contentId: string): boolean {
  const result = db
    .prepare('DELETE FROM content_learning_progress WHERE user_id = ? AND content_id = ?')
    .run(userId, contentId)
  return result.changes > 0
}
