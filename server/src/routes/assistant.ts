import { Router } from 'express'
import { getUserById } from '../db.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import {
  addMessage,
  clearMessages,
  getAssistantConfig,
  getFloatPosition,
  listMessages,
  saveFloatPosition,
} from '../repositories/assistantRepository.js'
import { assistantChatSchema, assistantPositionSchema } from '../schemas/assistant.js'
import {
  buildChatMessages,
  classifyLlmError,
  streamChatCompletionParts,
  userFacingLlmError,
} from '../services/llmChat.js'
import { formatSearchContext, searchTrainingContents } from '../services/contentSearch.js'
import { searchWebSnippets } from '../services/webSearch.js'
import { finalizeCourseLinks, stripThinkingAndIds } from '../utils/replySanitizer.js'
import { isOffTopicOrBlocked } from '../utils/contentModeration.js'
import { STAGE_LABEL } from '../data/stageLabels.js'
import type { TrainingStageId } from '../types.js'

export const assistantRouter = Router()

assistantRouter.use(requireAuth)

function writeSse(res: import('express').Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

assistantRouter.get('/messages', (req: AuthRequest, res) => {
  const userId = req.userId!
  res.json({ items: listMessages(userId) })
})

assistantRouter.delete('/messages', (req: AuthRequest, res) => {
  clearMessages(req.userId!)
  res.json({ ok: true })
})

assistantRouter.get('/position', (req: AuthRequest, res) => {
  res.json(getFloatPosition(req.userId!))
})

assistantRouter.put('/position', (req: AuthRequest, res) => {
  const parsed = assistantPositionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: '位置参数无效' })
    return
  }
  const p = parsed.data
  res.json(
    saveFloatPosition(req.userId!, {
      desktopX: p.desktopX,
      desktopY: p.desktopY,
      mobileX: p.mobileX,
      panelLeft: p.panelLeft ?? null,
      panelTop: p.panelTop ?? null,
      panelWidth: p.panelWidth ?? null,
      panelHeight: p.panelHeight ?? null,
    }),
  )
})

assistantRouter.post('/chat', async (req: AuthRequest, res) => {
  const parsed = assistantChatSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: '请输入有效问题' })
    return
  }

  const { message, stageId, deepThinking = false, webSearch = false } = parsed.data
  const blockedReply =
    '抱歉，无法解答该类问题，请提问与介入医生培训相关的内容（如 DSA 操作、穿刺技巧、介入手术流程等）。'

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  if (typeof res.flushHeaders === 'function') res.flushHeaders()

  if (isOffTopicOrBlocked(message)) {
    writeSse(res, 'delta', { text: blockedReply })
    writeSse(res, 'done', { blocked: true })
    res.end()
    return
  }

  const config = getAssistantConfig()
  if (!config.apiKey?.trim()) {
    writeSse(res, 'error', {
      code: 'config',
      message: '智能助手暂时无法提供服务，请检查模型配置或联系管理员',
    })
    res.end()
    return
  }

  const userId = req.userId!
  const user = getUserById(userId)
  const stage = stageId || user?.stage_id
  const stageHint = stage
    ? STAGE_LABEL[stage as TrainingStageId] || stage
    : undefined

  try {
    const history = listMessages(userId)
    const searchHits = config.search.enabled
      ? searchTrainingContents(message, config.search, {
          userStageId: stage as TrainingStageId | undefined,
          limit: config.search.maxCourseLinks + 2,
        })
      : []
    const searchContext = config.search.enabled ? formatSearchContext(searchHits) : undefined

    const webContext = webSearch ? await searchWebSnippets(message) : undefined

    const msgs = buildChatMessages(config.systemPrompt, history, message, {
      stageHint,
      searchContext,
      webContext: webContext || undefined,
    })

    let full = ''
    for await (const part of streamChatCompletionParts(config, msgs)) {
      if (part.type === 'reasoning') {
        if (deepThinking) {
          writeSse(res, 'reasoning', { text: part.text })
        }
        continue
      }
      full += part.text
      writeSse(res, 'delta', { text: part.text })
    }

    let reply = stripThinkingAndIds(full.trim())
    if (!reply) throw new Error('模型未返回有效内容')

    if (config.search.enabled && searchHits.length > 0) {
      const beforeLen = reply.length
      reply = finalizeCourseLinks(reply, searchHits, config.search.maxCourseLinks)
      if (reply.length > beforeLen) {
        writeSse(res, 'delta', { text: reply.slice(beforeLen) })
      }
    }

    addMessage(userId, 'user', message)
    const saved = addMessage(userId, 'assistant', reply)
    writeSse(res, 'done', { messageId: saved.id })
    res.end()
  } catch (e) {
    const err = e instanceof Error ? e.message : '回复失败'
    console.error('[assistant/chat]', err)
    const code = classifyLlmError(err)
    writeSse(res, 'error', {
      code,
      message: userFacingLlmError(err, code),
      detail: process.env.NODE_ENV !== 'production' ? err : undefined,
    })
    res.end()
  }
})
