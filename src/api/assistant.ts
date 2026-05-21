import { getToken } from './client'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export interface AssistantMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  streaming?: boolean
  /** 仅开启「深度思考」时可能有内容，默认不展示 */
  thinking?: string
}

export interface AssistantPosition {
  desktopX: number
  desktopY: number
  mobileX: number
  panelLeft: number | null
  panelTop: number | null
  panelWidth: number | null
  panelHeight: number | null
}

export class AssistantError extends Error {
  code: 'config' | 'network' | 'generic'
  constructor(message: string, code: 'config' | 'network' | 'generic' = 'generic') {
    super(message)
    this.code = code
  }
}

export type AssistantChatOptions = {
  stageId?: string
  deepThinking?: boolean
  webSearch?: boolean
}

type StreamHandlers = {
  onDelta: (text: string, full: string) => void
  onReasoning?: (text: string, full: string) => void
  onDone?: (payload: { messageId?: number; blocked?: boolean }) => void
}

function parseSseBuffer(
  buffer: string,
): { events: { event: string; data: Record<string, unknown> }[]; rest: string } {
  const events: { event: string; data: Record<string, unknown> }[] = []
  const parts = buffer.split('\n\n')
  const rest = parts.pop() ?? ''

  for (const part of parts) {
    let event = 'message'
    let dataStr = ''
    for (const line of part.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim()
      else if (line.startsWith('data:')) dataStr += line.slice(5).trim()
    }
    if (!dataStr) continue
    try {
      events.push({ event, data: JSON.parse(dataStr) as Record<string, unknown> })
    } catch {
      /* skip */
    }
  }
  return { events, rest }
}

export async function streamAssistantChat(
  message: string,
  options: AssistantChatOptions,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_BASE}/api/assistant/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      stageId: options.stageId,
      deepThinking: options.deepThinking ?? false,
      webSearch: options.webSearch ?? false,
    }),
    signal,
  })

  const contentType = res.headers.get('Content-Type') || ''

  if (!res.ok && !contentType.includes('text/event-stream')) {
    const text = await res.text()
    let data: Record<string, unknown> = {}
    try {
      data = JSON.parse(text) as Record<string, unknown>
    } catch {
      data = { error: text }
    }
    const err = String(data.error || '')
    const msg = String(data.message || data.error || `请求失败 (${res.status})`)
    if (err === 'config' || res.status === 503) {
      throw new AssistantError(
        msg || '智能助手暂时无法提供服务，请检查模型配置或联系管理员',
        'config',
      )
    }
    if (err === 'network' || res.status === 502) {
      throw new AssistantError(msg || '回复加载失败，请检查网络后重试', 'network')
    }
    throw new AssistantError(msg, 'generic')
  }

  if (!res.body) throw new AssistantError('回复加载失败，请检查网络后重试', 'network')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''
  let reasoningFull = ''
  let finished = false

  const handleEvent = (event: string, data: Record<string, unknown>) => {
    if (event === 'delta' && typeof data.text === 'string') {
      full += data.text
      handlers.onDelta(data.text, full)
    } else if (event === 'reasoning' && typeof data.text === 'string') {
      reasoningFull += data.text
      handlers.onReasoning?.(data.text, reasoningFull)
    } else if (event === 'error') {
      const code =
        data.code === 'config'
          ? 'config'
          : data.code === 'network'
            ? 'network'
            : 'generic'
      throw new AssistantError(String(data.message || '回复失败'), code)
    } else if (event === 'done') {
      finished = true
      handlers.onDone?.({
        messageId: typeof data.messageId === 'number' ? data.messageId : undefined,
        blocked: Boolean(data.blocked),
      })
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const { events, rest } = parseSseBuffer(buffer)
    buffer = rest
    for (const { event, data } of events) {
      handleEvent(event, data)
    }
  }

  if (buffer.trim()) {
    const { events } = parseSseBuffer(`${buffer}\n\n`)
    for (const { event, data } of events) {
      handleEvent(event, data)
    }
  }

  if (!full.trim()) {
    throw new AssistantError('未收到助手回复，请稍后重试', 'network')
  }
  if (!finished) {
    handlers.onDone?.({})
  }
}

export function fetchAssistantMessages() {
  return assistantFetch<{ items: AssistantMessage[] }>('/api/assistant/messages')
}

export function clearAssistantMessages() {
  return assistantFetch<{ ok: boolean }>('/api/assistant/messages', { method: 'DELETE' })
}

export function fetchAssistantPosition() {
  return assistantFetch<AssistantPosition>('/api/assistant/position')
}

export function saveAssistantPosition(pos: AssistantPosition) {
  return assistantFetch<AssistantPosition>('/api/assistant/position', {
    method: 'PUT',
    body: JSON.stringify(pos),
  })
}

async function assistantFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const text = await res.text()
  let data: Record<string, unknown> = {}
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>
    } catch {
      data = { error: text }
    }
  }

  if (!res.ok) {
    const err = String(data.error || '')
    const msg = String(data.message || data.error || `请求失败 (${res.status})`)
    if (err === 'config' || res.status === 503) {
      throw new AssistantError(
        msg || '智能助手暂时无法提供服务，请检查模型配置或联系管理员',
        'config',
      )
    }
    if (err === 'network' || res.status === 502) {
      throw new AssistantError(msg || '回复加载失败，请检查网络后重试', 'network')
    }
    throw new AssistantError(msg, 'generic')
  }
  return data as T
}
