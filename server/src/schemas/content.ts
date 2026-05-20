import { z } from 'zod'

const stageId = z.enum(['foundation', 'advanced', 'authorization', 'mastery'])
const category = z.enum(['theory', 'dsa', 'virtual', 'case'])
const mediaType = z.enum(['none', 'pdf', 'ppt', 'video', 'vr'])
const vrFormat = z.enum(['glb', 'gltf', 'fbx'])
const status = z.enum(['draft', 'published'])

export const createContentSchema = z.object({
  title: z.string().min(2, '标题至少 2 个字符').max(120),
  description: z.string().max(2000).optional().default(''),
  stageId,
  category,
  mediaType: mediaType.optional().default('none'),
  duration: z.string().max(50).optional().default(''),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  vrFormat: vrFormat.nullable().optional(),
  status: status.optional().default('published'),
  sortOrder: z.coerce.number().int().optional().default(0),
})

export const updateContentSchema = createContentSchema.partial()

export type CreateContentInput = z.input<typeof createContentSchema>
export type UpdateContentInput = z.infer<typeof updateContentSchema>
