import { Router } from 'express'
import { requireAdmin, type AuthRequest } from '../middleware/auth.js'
import {
  getAssistantConfig,
  getAssistantConfigPublic,
  updateAssistantConfig,
} from '../repositories/assistantRepository.js'
import { assistantConfigSchema } from '../schemas/assistant.js'
import { buildChatMessages, callChatCompletion } from '../services/llmChat.js'
import type { AssistantProvider } from '../types/assistant.js'

export const adminAssistantRouter = Router()

adminAssistantRouter.use(requireAdmin)

adminAssistantRouter.get('/config', (_req, res) => {
  res.json({ config: getAssistantConfigPublic() })
})

adminAssistantRouter.put('/config', (req: AuthRequest, res) => {
  const parsed = assistantConfigSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: '配置参数无效' })
    return
  }
  const patch = parsed.data
  const current = getAssistantConfig()
  const provider = patch.provider ?? current.provider
  const updated = updateAssistantConfig({
    provider,
    baseUrl: patch.baseUrl,
    apiKey: patch.apiKey,
    model: patch.model,
    systemPrompt: patch.systemPrompt,
    maxTokens: patch.maxTokens,
    temperature: patch.temperature,
    search: patch.search,
  })
  res.json({ ok: true, config: updated })
})

adminAssistantRouter.post('/test', async (req: AuthRequest, res) => {
  const config = getAssistantConfig()
  if (!config.apiKey?.trim()) {
    res.status(400).json({
      ok: false,
      error: '配置失败，请检查 Base URL 和 API key 正确性',
    })
    return
  }
  try {
    const msgs = buildChatMessages(config.systemPrompt, [], '请用一句话确认你已就绪，仅回答培训助手相关表述。')
    const reply = await callChatCompletion(config, msgs, { maxTokens: 80 })
    res.json({ ok: true, message: '配置成功', preview: reply.slice(0, 120) })
  } catch {
    res.status(400).json({
      ok: false,
      error: '配置失败，请检查 Base URL 和 API key 正确性',
    })
  }
})

/** 仅切换当前启用的厂商（不覆盖其它厂商已保存配置） */
adminAssistantRouter.put('/active-provider', (req: AuthRequest, res) => {
  const provider = req.body?.provider as AssistantProvider | undefined
  if (!provider || !['deepseek', 'qwen', 'kimi', 'minimax'].includes(provider)) {
    res.status(400).json({ error: '无效的模型厂商' })
    return
  }
  const updated = updateAssistantConfig({ provider })
  res.json({ ok: true, config: updated })
})
