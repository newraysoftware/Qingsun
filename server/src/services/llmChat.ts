import type { AssistantConfig, AssistantMessage, AssistantProvider } from '../types/assistant.js'

export const PROVIDER_DEFAULTS: Record<
  AssistantProvider,
  { baseUrl: string; model: string; path: string }
> = {
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    path: '/v1/chat/completions',
  },
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-turbo',
    path: '/chat/completions',
  },
  kimi: {
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
    path: '/chat/completions',
  },
  minimax: {
    baseUrl: 'https://api.minimax.chat/v1',
    model: 'MiniMax-Text-01',
    path: '/chat/completions',
  },
}

const STREAM_TIMEOUT_MS = 60000

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

/** 避免 baseUrl 已含 path 时重复拼接 */
export function resolveChatEndpoint(config: AssistantConfig): string {
  const defaults = PROVIDER_DEFAULTS[config.provider]
  const base = normalizeBaseUrl(config.baseUrl || defaults.baseUrl)
  const path = defaults.path

  if (/\/chat\/completions$/i.test(base) || /chatcompletion_v2$/i.test(base)) {
    return base
  }
  if (base.endsWith('/v1') || base.endsWith('/v1/')) {
    return `${normalizeBaseUrl(base)}${path.startsWith('/v1') ? path.slice(3) : path}`
  }
  return `${base}${path}`
}

export type ChatStreamPart = { type: 'content' | 'reasoning'; text: string }

function extractStreamParts(payload: unknown): ChatStreamPart[] {
  if (!payload || typeof payload !== 'object') return []
  const json = payload as Record<string, unknown>
  const parts: ChatStreamPart[] = []

  const choices = json.choices as Record<string, unknown>[] | undefined
  if (choices?.[0]) {
    const c = choices[0]
    const delta = c.delta as Record<string, unknown> | undefined
    if (delta) {
      if (typeof delta.reasoning_content === 'string' && delta.reasoning_content) {
        parts.push({ type: 'reasoning', text: delta.reasoning_content })
      } else if (typeof delta.reasoning === 'string' && delta.reasoning) {
        parts.push({ type: 'reasoning', text: delta.reasoning })
      }
      if (typeof delta.content === 'string' && delta.content) {
        parts.push({ type: 'content', text: delta.content })
      } else if (typeof delta.text === 'string' && delta.text) {
        parts.push({ type: 'content', text: delta.text })
      }
    }
    const message = c.message as Record<string, unknown> | undefined
    if (typeof message?.content === 'string' && message.content) {
      parts.push({ type: 'content', text: message.content })
    }
  }

  if (parts.length) return parts

  const legacy = extractStreamDeltaLegacy(json)
  if (legacy) parts.push({ type: 'content', text: legacy })
  return parts
}

function extractStreamDeltaLegacy(json: Record<string, unknown>): string {
  const choices = json.choices as Record<string, unknown>[] | undefined
  if (choices?.[0]) {
    const c = choices[0]
    const delta = c.delta as Record<string, unknown> | undefined
    if (typeof delta?.content === 'string') return delta.content
    if (typeof delta?.text === 'string') return delta.text
    const message = c.message as Record<string, unknown> | undefined
    if (typeof message?.content === 'string') return message.content
  }

  const output = json.output as Record<string, unknown> | undefined
  if (output) {
    const outChoices = output.choices as Record<string, unknown>[] | undefined
    const msg = outChoices?.[0]?.message as Record<string, unknown> | undefined
    if (typeof msg?.content === 'string') return msg.content
    if (typeof output.text === 'string') return output.text
  }

  if (typeof json.reply === 'string') return json.reply
  if (typeof json.text === 'string') return json.text

  const baseResp = json.base_resp as Record<string, unknown> | undefined
  if (baseResp && typeof baseResp.status_msg === 'string' && baseResp.status_code !== 0) {
    throw new Error(baseResp.status_msg)
  }

  return ''
}

function extractFullContent(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const json = payload as Record<string, unknown>

  if (json.error) {
    const err = json.error as Record<string, unknown>
    throw new Error(String(err.message || err.msg || '模型请求失败'))
  }

  const choices = json.choices as Record<string, unknown>[] | undefined
  if (choices?.[0]) {
    const msg = choices[0].message as Record<string, unknown> | undefined
    if (typeof msg?.content === 'string') return msg.content
  }

  const output = json.output as Record<string, unknown> | undefined
  if (output) {
    const outChoices = output.choices as Record<string, unknown>[] | undefined
    const msg = outChoices?.[0]?.message as Record<string, unknown> | undefined
    if (typeof msg?.content === 'string') return msg.content
    if (typeof output.text === 'string') return output.text
  }

  if (typeof json.reply === 'string') return json.reply

  const baseResp = json.base_resp as Record<string, unknown> | undefined
  const choices2 = json.choices as Record<string, unknown>[] | undefined
  if (choices2?.[0]) {
    const t = choices2[0].text as string | undefined
    if (t) return t
    const messages = choices2[0].messages as { text?: string }[] | undefined
    if (messages?.[0]?.text) return messages[0].text
  }

  return ''
}

function extractStreamDelta(payload: unknown): string {
  return extractStreamParts(payload)
    .filter((p) => p.type === 'content')
    .map((p) => p.text)
    .join('')
}

function parseUpstreamSseChunk(buffer: string): { parts: ChatStreamPart[]; rest: string } {
  const parts: ChatStreamPart[] = []
  const blocks = buffer.split(/\r?\n\r?\n/)
  const rest = blocks.pop() ?? ''

  for (const block of blocks) {
    const dataLines: string[] = []
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
      else if (line.startsWith('{')) dataLines.push(line.trim())
    }
    const payload = dataLines.join('\n').trim()
    if (!payload || payload === '[DONE]') continue
    try {
      parts.push(...extractStreamParts(JSON.parse(payload)))
    } catch (e) {
      if (e instanceof Error && e.message && !e.message.includes('JSON')) throw e
    }
  }
  return { parts, rest }
}

async function postChat(
  config: AssistantConfig,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  stream: boolean,
  signal: AbortSignal,
): Promise<Response> {
  const defaults = PROVIDER_DEFAULTS[config.provider]
  const url = resolveChatEndpoint(config)

  const body: Record<string, unknown> = {
    model: config.model || defaults.model,
    messages,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    stream,
  }

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  })
}

export async function fetchNonStreamCompletion(
  config: AssistantConfig,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS)
  try {
    const res = await postChat(config, messages, false, controller.signal)
    const text = await res.text()
    let json: unknown
    try {
      json = JSON.parse(text)
    } catch {
      throw new Error(text.slice(0, 200) || `模型请求失败 (${res.status})`)
    }
    if (!res.ok) {
      throw new Error(extractFullContent(json) || `模型请求失败 (${res.status})`)
    }
    const content = extractFullContent(json).trim()
    if (!content) throw new Error('模型未返回有效内容')
    return content
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('模型响应超时，请稍后重试')
    }
    throw e
  } finally {
    clearTimeout(timer)
  }
}

export async function* streamChatCompletionParts(
  config: AssistantConfig,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: { maxTokens?: number; temperature?: number },
): AsyncGenerator<ChatStreamPart, string, undefined> {
  const cfg = {
    ...config,
    maxTokens: options?.maxTokens ?? config.maxTokens,
    temperature: options?.temperature ?? config.temperature,
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS)

  let fullContent = ''
  try {
    const res = await postChat(cfg, messages, true, controller.signal)

    if (!res.ok) {
      const text = await res.text()
      let msg = `模型请求失败 (${res.status})`
      try {
        const json = JSON.parse(text) as Record<string, unknown>
        msg = extractFullContent(json) || msg
      } catch {
        if (text) msg = text.slice(0, 300)
      }
      throw new Error(msg)
    }

    if (!res.body) throw new Error('模型未返回流式数据')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const { parts, rest } = parseUpstreamSseChunk(buffer)
      buffer = rest
      for (const p of parts) {
        if (p.type === 'content') fullContent += p.text
        yield p
      }
    }

    if (buffer.trim()) {
      const { parts } = parseUpstreamSseChunk(`${buffer}\n\n`)
      for (const p of parts) {
        if (p.type === 'content') fullContent += p.text
        yield p
      }
    }

    if (!fullContent.trim()) {
      const fallback = await fetchNonStreamCompletion(cfg, messages)
      yield { type: 'content', text: fallback }
      return fallback
    }

    return fullContent.trim()
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('模型响应超时，请稍后重试')
    }
    if (!fullContent.trim()) {
      try {
        const fallback = await fetchNonStreamCompletion(cfg, messages)
        yield { type: 'content', text: fallback }
        return fallback
      } catch (inner) {
        throw inner instanceof Error ? inner : e
      }
    }
    throw e
  } finally {
    clearTimeout(timer)
  }
}

export async function* streamChatCompletion(
  config: AssistantConfig,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: { maxTokens?: number; temperature?: number },
): AsyncGenerator<string, string, undefined> {
  for await (const part of streamChatCompletionParts(config, messages, options)) {
    if (part.type === 'content') yield part.text
  }
  return ''
}

export async function callChatCompletion(
  config: AssistantConfig,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: { maxTokens?: number; temperature?: number },
): Promise<string> {
  const cfg = {
    ...config,
    maxTokens: options?.maxTokens ?? config.maxTokens,
    temperature: options?.temperature ?? config.temperature,
  }
  try {
    let result = ''
    for await (const chunk of streamChatCompletion(cfg, messages)) {
      result += chunk
    }
    if (result.trim()) return result.trim()
  } catch {
    /* fallback below */
  }
  return fetchNonStreamCompletion(cfg, messages)
}

export function buildChatMessages(
  systemPrompt: string,
  history: AssistantMessage[],
  userMessage: string,
  options?: { stageHint?: string; searchContext?: string; webContext?: string },
): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  const stageHint = options?.stageHint
  let system = stageHint
    ? `${systemPrompt}\n\n当前学员培训阶段：${stageHint}。请优先结合该阶段解答。`
    : systemPrompt

  if (options?.webContext) {
    system += `\n\n${options.webContext}\n可结合以上互联网检索摘要补充专业解答（请甄别可靠性）。`
  }

  if (options?.searchContext) {
    system += `\n\n${options.searchContext}\n请结合以上站内课程名称作答；正文勿写出课程ID或URL，系统将在文末自动附上课程名称超链接（最多3个）。`
  }

  system +=
    '\n\n默认直接输出最终答复正文，不要输出思考过程、推理草稿或「正在思考」类语句。'

  const msgs: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: system },
  ]
  for (const m of history.slice(-12)) {
    msgs.push({ role: m.role, content: m.content })
  }
  msgs.push({ role: 'user', content: userMessage })
  return msgs
}

export function classifyLlmError(message: string): 'config' | 'network' | 'unknown' {
  if (/401|403|api[_\s-]?key|authentication|unauthorized|invalid.*key|权限|密钥/i.test(message)) {
    return 'config'
  }
  if (/timeout|超时|abort|ECONNREFUSED|ENOTFOUND|fetch failed|network/i.test(message)) {
    return 'network'
  }
  return 'unknown'
}

export function userFacingLlmError(message: string, code: 'config' | 'network' | 'unknown'): string {
  if (code === 'config') {
    return '智能助手暂时无法提供服务，请检查模型配置或联系管理员'
  }
  if (code === 'network') {
    return '回复加载失败，请检查网络后重试'
  }
  return message.length > 120 ? `${message.slice(0, 120)}…` : message
}
