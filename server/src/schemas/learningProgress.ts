import { z } from 'zod'

const positionKind = z.enum(['video', 'pdf', 'ppt', 'vr', 'document'])
const status = z.enum(['not_started', 'in_progress', 'completed'])

export const upsertLearningProgressSchema = z.object({
  status: status.optional(),
  progressPercent: z.coerce.number().int().min(0).max(100).optional(),
  lastPosition: z
    .object({
      kind: positionKind,
      value: z.number(),
      meta: z.string().optional(),
    })
    .nullable()
    .optional(),
})

export type UpsertLearningProgressInput = z.infer<typeof upsertLearningProgressSchema>
