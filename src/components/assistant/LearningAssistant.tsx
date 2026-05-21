import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Bot, Brain, Globe, GripHorizontal, Send, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  AssistantError,
  clearAssistantMessages,
  fetchAssistantMessages,
  fetchAssistantPosition,
  saveAssistantPosition,
  streamAssistantChat,
  type AssistantMessage,
  type AssistantPosition,
} from '../../api/assistant'
import { matchAssistantSuggestions } from '../../data/assistantSuggestions'
import {
  clampPanelRect,
  defaultPanelRect,
  type AssistantPanelRect,
} from '../../utils/assistantPanelLayout'
import { AssistantMessageView } from './AssistantMessageView'

const POS_STORAGE = 'qingsun-assistant-position'
const PANEL_STORAGE = 'qingsun-assistant-panel'
const STREAMING_MSG_ID = -2

const DEFAULT_POS: AssistantPosition = {
  desktopX: 24,
  desktopY: 120,
  mobileX: 24,
  panelLeft: null,
  panelTop: null,
  panelWidth: null,
  panelHeight: null,
}

function loadLocalPosition(): AssistantPosition {
  try {
    const raw = localStorage.getItem(POS_STORAGE)
    if (raw) return { ...DEFAULT_POS, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return DEFAULT_POS
}

function loadLocalPanel(mobile: boolean): AssistantPanelRect | null {
  try {
    const raw = localStorage.getItem(PANEL_STORAGE)
    if (raw) return clampPanelRect(JSON.parse(raw) as AssistantPanelRect, mobile)
  } catch {
    /* ignore */
  }
  return null
}

function panelFromPosition(pos: AssistantPosition, mobile: boolean): AssistantPanelRect | null {
  if (
    pos.panelLeft == null ||
    pos.panelTop == null ||
    pos.panelWidth == null ||
    pos.panelHeight == null
  ) {
    return null
  }
  return clampPanelRect(
    {
      left: pos.panelLeft,
      top: pos.panelTop,
      width: pos.panelWidth,
      height: pos.panelHeight,
    },
    mobile,
  )
}

export function LearningAssistant() {
  const { isAuthenticated, user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pos, setPos] = useState<AssistantPosition>(loadLocalPosition)
  const [panelRect, setPanelRect] = useState<AssistantPanelRect>(() =>
    defaultPanelRect(false),
  )
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [sendingPulse, setSendingPulse] = useState(false)
  const [deepThinking, setDeepThinking] = useState(false)
  const [webSearch, setWebSearch] = useState(false)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
  )

  const fabDragRef = useRef<{
    active: boolean
    moved: boolean
    startX: number
    startY: number
    origin: AssistantPosition
  } | null>(null)
  const panelDragRef = useRef<{
    startX: number
    startY: number
    origin: AssistantPanelRect
  } | null>(null)
  const panelResizeRef = useRef<{
    startX: number
    startY: number
    origin: AssistantPanelRect
  } | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const composingRef = useRef(false)
  const [isComposing, setIsComposing] = useState(false)
  const panelRectRef = useRef(panelRect)
  const posRef = useRef(pos)
  const lastQuestionRef = useRef('')
  const abortRef = useRef<AbortController | null>(null)

  panelRectRef.current = panelRect
  posRef.current = pos

  const persistUi = useCallback(
    (nextPos: AssistantPosition, nextPanel: AssistantPanelRect) => {
      const merged: AssistantPosition = {
        ...nextPos,
        panelLeft: nextPanel.left,
        panelTop: nextPanel.top,
        panelWidth: nextPanel.width,
        panelHeight: nextPanel.height,
      }
      setPos(merged)
      localStorage.setItem(POS_STORAGE, JSON.stringify(merged))
      localStorage.setItem(PANEL_STORAGE, JSON.stringify(nextPanel))
      if (isAuthenticated) void saveAssistantPosition(merged).catch(() => {})
    },
    [isAuthenticated],
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const fn = () => {
      const mobile = mq.matches
      setIsMobile(mobile)
      setPanelRect((r) => clampPanelRect(r, mobile))
    }
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    void fetchAssistantMessages()
      .then(({ items }) => setMessages(items))
      .catch(() => {})
    void fetchAssistantPosition().then((p) => {
      const mobile = window.matchMedia('(max-width: 767px)').matches
      const fromServer = panelFromPosition(p, mobile)
      const fromLocal = loadLocalPanel(mobile)
      const panel = fromServer ?? fromLocal ?? defaultPanelRect(mobile)
      setPos(p)
      setPanelRect(panel)
      localStorage.setItem(POS_STORAGE, JSON.stringify(p))
      localStorage.setItem(PANEL_STORAGE, JSON.stringify(panel))
    })
  }, [isAuthenticated])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isMobile) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, isMobile])

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'auto' })
    })
  }, [])

  useEffect(() => {
    if (open) scrollToBottom()
  }, [messages, loading, open, scrollToBottom])

  useEffect(() => {
    setSuggestions(matchAssistantSuggestions(input))
  }, [input])

  const openPanel = useCallback(() => {
    setPanelRect((r) => clampPanelRect(r, isMobile))
    setOpen(true)
    setError(null)
  }, [isMobile])

  const onFabPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    fabDragRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...pos },
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onFabPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = fabDragRef.current
    if (!d?.active) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true
    if (!d.moved) return

    if (isMobile) {
      setPos({ ...d.origin, mobileX: Math.max(8, d.origin.mobileX + dx) })
    } else {
      setPos({
        ...d.origin,
        desktopX: Math.max(8, d.origin.desktopX - dx),
        desktopY: Math.max(56, d.origin.desktopY + dy),
      })
    }
  }

  const onFabPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = fabDragRef.current
    fabDragRef.current = null
    if (d?.moved) {
      persistUi(posRef.current, panelRectRef.current)
      return
    }
    if (!d?.active) return
    openPanel()
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const onPanelHeaderPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0) return
    panelDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...panelRect },
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPanelHeaderPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = panelDragRef.current
    if (!d) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    setPanelRect(
      clampPanelRect(
        {
          ...d.origin,
          left: d.origin.left + dx,
          top: d.origin.top + dy,
        },
        isMobile,
      ),
    )
  }

  const endPanelDrag = (e: ReactPointerEvent<HTMLElement>) => {
    if (!panelDragRef.current) return
    panelDragRef.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
    persistUi(posRef.current, panelRectRef.current)
  }

  const onResizePointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    e.stopPropagation()
    if (e.button !== 0) return
    panelResizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...panelRect },
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onResizePointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = panelResizeRef.current
    if (!d) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    setPanelRect(
      clampPanelRect(
        {
          ...d.origin,
          width: d.origin.width + dx,
          height: d.origin.height + dy,
        },
        isMobile,
      ),
    )
  }

  const endPanelResize = (e: ReactPointerEvent<HTMLElement>) => {
    if (!panelResizeRef.current) return
    panelResizeRef.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
    persistUi(posRef.current, panelRectRef.current)
  }

  const handleSend = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim()
      if (!msg || loading || composingRef.current) return
      abortRef.current?.abort()
      abortRef.current = new AbortController()

      setInput('')
      setSuggestions([])
      setError(null)
      lastQuestionRef.current = msg
      setSendingPulse(true)
      setTimeout(() => setSendingPulse(false), 200)

      const optimistic: AssistantMessage = {
        id: -Date.now(),
        role: 'user',
        content: msg,
        createdAt: new Date().toISOString(),
      }
      const streaming: AssistantMessage = {
        id: STREAMING_MSG_ID,
        role: 'assistant',
        content: '',
        thinking: deepThinking ? '' : undefined,
        streaming: true,
        createdAt: new Date().toISOString(),
      }

      setMessages((m) => [...m, optimistic, streaming])
      setLoading(true)

      try {
        await streamAssistantChat(
          msg,
          { stageId: user?.stageId, deepThinking, webSearch },
          {
            onDelta: (_chunk, full) => {
              setMessages((m) =>
                m.map((x) =>
                  x.id === STREAMING_MSG_ID ? { ...x, content: full } : x,
                ),
              )
              scrollToBottom()
            },
            onReasoning: deepThinking
              ? (_chunk, full) => {
                  setMessages((m) =>
                    m.map((x) =>
                      x.id === STREAMING_MSG_ID ? { ...x, thinking: full } : x,
                    ),
                  )
                  scrollToBottom()
                }
              : undefined,
            onDone: () => {
              setMessages((m) =>
                m.map((x) =>
                  x.id === STREAMING_MSG_ID
                    ? { ...x, streaming: false, thinking: deepThinking ? x.thinking : undefined }
                    : x,
                ),
              )
            },
          },
          abortRef.current.signal,
        )
        void fetchAssistantMessages()
          .then(({ items }) => setMessages(items))
          .catch(() => {})
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setMessages((m) =>
          m.filter((x) => x.id !== optimistic.id && x.id !== STREAMING_MSG_ID),
        )
        if (e instanceof AssistantError) {
          setError(e.message)
          if (e.code === 'network' || e.code === 'generic') setInput(msg)
        } else {
          setError('回复加载失败，请检查网络后重试')
          setInput(msg)
        }
      } finally {
        setLoading(false)
      }
    },
    [input, loading, user?.stageId, deepThinking, webSearch, scrollToBottom],
  )

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (composingRef.current) return
    void handleSend()
  }

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return
    if (e.nativeEvent.isComposing || composingRef.current) return
    e.preventDefault()
    void handleSend()
  }

  const handleClear = async () => {
    if (!window.confirm('清空后对话记录不可恢复，确定继续？')) return
    abortRef.current?.abort()
    try {
      await clearAssistantMessages()
      setMessages([])
      setError(null)
      setLoading(false)
    } catch {
      setError('清空失败，请稍后重试')
    }
  }

  if (!isAuthenticated) return null

  const fabSize = isMobile ? 40 : 44
  const isStreaming = messages.some((m) => m.streaming)

  return (
    <>
      {open && isMobile && (
        <button
          type="button"
          aria-label="关闭对话"
          className="fixed inset-0 z-[68] bg-black/20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {open && (
        <div
          className="fixed z-[70] flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
          style={{
            left: panelRect.left,
            top: panelRect.top,
            width: panelRect.width,
            height: panelRect.height,
          }}
          role="dialog"
          aria-label="智能学习助手"
        >
          <header
            className="flex shrink-0 cursor-move items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3 py-2.5 touch-none select-none"
            onPointerDown={onPanelHeaderPointerDown}
            onPointerMove={onPanelHeaderPointerMove}
            onPointerUp={endPanelDrag}
            onPointerCancel={endPanelDrag}
          >
            <div className="flex items-center gap-1.5 text-slate-500">
              <GripHorizontal className="h-4 w-4 shrink-0" aria-hidden />
              <h2 className="text-sm font-semibold text-slate-800">智能学习助手</h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              aria-label="关闭"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div
            ref={listRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-[8px] py-[6px] md:px-[10px] md:py-[8px]"
          >
            {messages.length === 0 && !loading && (
              <p className="text-center text-xs text-slate-400">
                可提问 DSA 操作、穿刺技巧、介入手术流程等培训相关问题
              </p>
            )}
            {messages.map((m) => (
              <AssistantMessageView key={m.id} message={m} />
            ))}
            {loading && !isStreaming && (
              <p className="animate-pulse text-xs text-slate-500">正在生成回复…</p>
            )}
            {error && (
              <div className="rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {error}
                {error.includes('网络') && lastQuestionRef.current && (
                  <button
                    type="button"
                    className="ml-2 underline"
                    onClick={() => void handleSend(lastQuestionRef.current)}
                  >
                    重试
                  </button>
                )}
              </div>
            )}
          </div>

          {suggestions.length > 0 && !loading && (
            <ul className="shrink-0 border-t border-slate-100 px-3 py-2">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    className="w-full rounded px-2 py-1.5 text-left text-xs text-primary-700 hover:bg-primary-50"
                    onClick={() => {
                      setInput(s)
                      void handleSend(s)
                    }}
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={onSubmit} className="shrink-0 border-t border-slate-100 p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                title="开启后可选查看模型推理过程，默认仍只展示最终答复"
                onClick={() => setDeepThinking((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition ${
                  deepThinking
                    ? 'border-primary-300 bg-primary-50 text-primary-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Brain className="h-3.5 w-3.5" />
                深度思考
              </button>
              <button
                type="button"
                title="结合互联网公开摘要补充专业解答"
                onClick={() => setWebSearch((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition ${
                  webSearch
                    ? 'border-cyan-300 bg-cyan-50 text-cyan-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                互联网检索
              </button>
            </div>
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="请输入你的自学疑问，如DSA设备操作、病例解析等"
                className="min-h-[2.5rem] flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
                onCompositionStart={() => {
                  composingRef.current = true
                  setIsComposing(true)
                }}
                onCompositionEnd={() => {
                  composingRef.current = false
                  setIsComposing(false)
                }}
                onKeyDown={onInputKeyDown}
              />
              <button
                type="button"
                disabled={loading || !input.trim() || isComposing}
                onClick={() => {
                  if (composingRef.current) return
                  void handleSend()
                }}
                className={`flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-lg bg-primary-600 text-white transition active:scale-95 disabled:opacity-50 ${sendingPulse ? 'ring-2 ring-primary-300' : ''}`}
                aria-label="发送"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => void handleClear()}
              disabled={loading}
              className="mt-2 text-xs text-slate-400 hover:text-slate-600 disabled:opacity-50"
            >
              清空对话
            </button>
          </form>

          <div
            role="presentation"
            aria-hidden
            className="absolute bottom-0 right-0 z-10 h-4 w-4 cursor-se-resize touch-none"
            style={{
              background:
                'linear-gradient(135deg, transparent 50%, rgb(148 163 184 / 0.55) 50%)',
            }}
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={endPanelResize}
            onPointerCancel={endPanelResize}
          />
        </div>
      )}

      <button
        type="button"
        aria-label="打开智能学习助手"
        className="fixed z-[69] touch-none select-none rounded-full bg-gradient-to-br from-primary-500 to-teal-600 text-white shadow-lg ring-2 ring-white/80 transition hover:scale-105 active:scale-95"
        style={
          isMobile
            ? {
                width: fabSize,
                height: fabSize,
                left: pos.mobileX,
                bottom: 20,
              }
            : {
                width: fabSize,
                height: fabSize,
                right: pos.desktopX,
                top: pos.desktopY,
              }
        }
        onPointerDown={onFabPointerDown}
        onPointerMove={onFabPointerMove}
        onPointerUp={onFabPointerUp}
        onPointerCancel={onFabPointerUp}
      >
        <Bot className="mx-auto h-[55%] w-[55%]" strokeWidth={1.75} />
      </button>
    </>
  )
}
