import { randomUUID } from 'crypto'
import { db } from '../db.js'
import type { CreateContentInput, UpdateContentInput } from '../schemas/content.js'
import type {
  ContentCategory,
  MediaType,
  TrainingContentRecord,
  TrainingStageId,
  VrFormat,
} from '../types/content.js'

export interface DbContentRow {
  id: string
  title: string
  description: string
  stage_id: string
  category: string
  media_type: string
  duration: string
  tags: string
  preview_image: string | null
  content_file: string | null
  content_file_name: string | null
  content_file_size: number | null
  vr_format: string | null
  status: string
  sort_order: number
  created_at: string
  updated_at: string
}

function parseTags(raw: string): string[] {
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.map(String) : []
  } catch {
    return []
  }
}

export function mapRow(row: DbContentRow): TrainingContentRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    stageId: row.stage_id as TrainingStageId,
    category: row.category as ContentCategory,
    mediaType: row.media_type as MediaType,
    duration: row.duration,
    tags: parseTags(row.tags),
    previewImageUrl: row.preview_image,
    contentFileUrl: row.content_file,
    contentFileName: row.content_file_name,
    contentFileSize: row.content_file_size,
    vrFormat: (row.vr_format as VrFormat) || null,
    status: row.status as 'draft' | 'published',
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function normalizeTags(tags: string[] | string | undefined): string {
  if (!tags) return '[]'
  if (Array.isArray(tags)) return JSON.stringify(tags)
  return JSON.stringify(
    tags
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean),
  )
}

export function listContents(filters?: {
  stageId?: string
  category?: string
  status?: string
}): TrainingContentRecord[] {
  let sql = 'SELECT * FROM training_contents WHERE 1=1'
  const params: string[] = []
  if (filters?.stageId) {
    sql += ' AND stage_id = ?'
    params.push(filters.stageId)
  }
  if (filters?.category) {
    sql += ' AND category = ?'
    params.push(filters.category)
  }
  if (filters?.status) {
    sql += ' AND status = ?'
    params.push(filters.status)
  }
  sql += ' ORDER BY sort_order ASC, updated_at DESC'
  const rows = db.prepare(sql).all(...params) as unknown as DbContentRow[]
  return rows.map(mapRow)
}

export function getContentById(id: string): TrainingContentRecord | undefined {
  const row = db.prepare('SELECT * FROM training_contents WHERE id = ?').get(id) as
    | DbContentRow
    | undefined
  return row ? mapRow(row) : undefined
}

export function createContent(input: CreateContentInput): TrainingContentRecord {
  const id = randomUUID()
  const tags = normalizeTags(input.tags)
  db.prepare(
    `INSERT INTO training_contents (
      id, title, description, stage_id, category, media_type, duration, tags,
      vr_format, status, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.title,
    input.description ?? '',
    input.stageId,
    input.category,
    input.mediaType ?? 'none',
    input.duration ?? '',
    tags,
    input.vrFormat ?? null,
    input.status ?? 'published',
    input.sortOrder ?? 0,
  )
  return getContentById(id)!
}

export function updateContent(id: string, input: UpdateContentInput): TrainingContentRecord | undefined {
  const existing = getContentById(id)
  if (!existing) return undefined

  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (input.title !== undefined) {
    fields.push('title = ?')
    values.push(input.title)
  }
  if (input.description !== undefined) {
    fields.push('description = ?')
    values.push(input.description)
  }
  if (input.stageId !== undefined) {
    fields.push('stage_id = ?')
    values.push(input.stageId)
  }
  if (input.category !== undefined) {
    fields.push('category = ?')
    values.push(input.category)
  }
  if (input.mediaType !== undefined) {
    fields.push('media_type = ?')
    values.push(input.mediaType)
  }
  if (input.duration !== undefined) {
    fields.push('duration = ?')
    values.push(input.duration)
  }
  if (input.tags !== undefined) {
    fields.push('tags = ?')
    values.push(normalizeTags(input.tags))
  }
  if (input.vrFormat !== undefined) {
    fields.push('vr_format = ?')
    values.push(input.vrFormat)
  }
  if (input.status !== undefined) {
    fields.push('status = ?')
    values.push(input.status)
  }
  if (input.sortOrder !== undefined) {
    fields.push('sort_order = ?')
    values.push(input.sortOrder)
  }

  if (fields.length === 0) return existing

  fields.push("updated_at = datetime('now')")
  values.push(id)
  db.prepare(`UPDATE training_contents SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return getContentById(id)
}

export function updateContentFiles(
  id: string,
  patch: {
    previewImage?: string | null
    contentFile?: string | null
    contentFileName?: string | null
    contentFileSize?: number | null
    mediaType?: MediaType
    vrFormat?: VrFormat | null
  },
): TrainingContentRecord | undefined {
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (patch.previewImage !== undefined) {
    fields.push('preview_image = ?')
    values.push(patch.previewImage)
  }
  if (patch.contentFile !== undefined) {
    fields.push('content_file = ?')
    values.push(patch.contentFile)
  }
  if (patch.contentFileName !== undefined) {
    fields.push('content_file_name = ?')
    values.push(patch.contentFileName)
  }
  if (patch.contentFileSize !== undefined) {
    fields.push('content_file_size = ?')
    values.push(patch.contentFileSize)
  }
  if (patch.mediaType !== undefined) {
    fields.push('media_type = ?')
    values.push(patch.mediaType)
  }
  if (patch.vrFormat !== undefined) {
    fields.push('vr_format = ?')
    values.push(patch.vrFormat)
  }

  if (fields.length === 0) return getContentById(id)

  fields.push("updated_at = datetime('now')")
  values.push(id)
  db.prepare(`UPDATE training_contents SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return getContentById(id)
}

export function deleteContent(id: string): boolean {
  const result = db.prepare('DELETE FROM training_contents WHERE id = ?').run(id)
  return result.changes > 0
}

export function countContents(): number {
  const row = db.prepare('SELECT COUNT(*) as c FROM training_contents').get() as { c: number }
  return row.c
}

export function seedContentsIfEmpty(items: CreateContentInput[]) {
  if (countContents() > 0) return
  for (const item of items) {
    createContent(item)
  }
}
