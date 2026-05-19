import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('请输入有效邮箱'),
  password: z.string().min(8, '密码至少 8 位'),
  name: z.string().min(2, '姓名至少 2 个字符').max(50),
  yearsOfPractice: z.number().int().min(0).max(50).optional().default(0),
})

export const loginSchema = z.object({
  email: z.string().email('请输入有效邮箱'),
  password: z.string().min(1, '请输入密码'),
})

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  stageId: z.enum(['foundation', 'advanced', 'authorization', 'mastery']).optional(),
  yearsOfPractice: z.number().int().min(0).max(50).optional(),
  planProgress: z.number().int().min(0).max(100).optional(),
  contentMastery: z.number().int().min(0).max(100).optional(),
  points: z.number().int().min(0).optional(),
  streak: z.number().int().min(0).optional(),
  weakAreas: z.array(z.string()).optional(),
  assessmentDone: z.boolean().optional(),
})
