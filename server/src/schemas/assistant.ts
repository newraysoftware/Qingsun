import { z } from 'zod'

const provider = z.enum(['deepseek', 'qwen', 'kimi', 'minimax'])

export const assistantSearchConfigSchema = z.object({
  enabled: z.boolean().optional(),
  contentApiPath: z.string().min(1).optional(),
  contentLinkBase: z.string().min(1).optional(),
  matchTitle: z.boolean().optional(),
  matchTags: z.boolean().optional(),
  matchDescription: z.boolean().optional(),
  matchStage: z.boolean().optional(),
  matchCategory: z.boolean().optional(),
  searchSensitivity: z.number().min(0).max(1).optional(),
  maxCourseLinks: z.number().int().min(1).max(5).optional(),
})

export const assistantConfigSchema = z.object({
  provider: provider.optional(),
  baseUrl: z.string().min(1).optional(),
  apiKey: z.string().optional(),
  model: z.string().min(1).optional(),
  systemPrompt: z.string().min(10).optional(),
  maxTokens: z.number().int().min(256).max(4096).optional(),
  temperature: z.number().min(0).max(1).optional(),
  search: assistantSearchConfigSchema.optional(),
})

export const assistantChatSchema = z.object({
  message: z.string().min(1).max(2000),
  stageId: z.string().optional(),
  deepThinking: z.boolean().optional(),
  webSearch: z.boolean().optional(),
})

export const assistantPositionSchema = z.object({
  desktopX: z.number().min(0).max(2000),
  desktopY: z.number().min(0).max(2000),
  mobileX: z.number().min(0).max(2000),
  panelLeft: z.number().min(0).max(4000).nullable().optional(),
  panelTop: z.number().min(0).max(4000).nullable().optional(),
  panelWidth: z.number().min(200).max(1200).nullable().optional(),
  panelHeight: z.number().min(200).max(2000).nullable().optional(),
})
