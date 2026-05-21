import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { AssistantMessage } from '../../api/assistant'
import { formatAssistantReply } from '../../utils/formatAssistantReply'

const chatFont =
  'font-sans leading-[1.5] text-[13px] md:text-[14px] md:[font-family:"Microsoft_YaHei","PingFang_SC",system-ui,sans-serif]'

type Props = {
  message: AssistantMessage
}

export function AssistantMessageView({ message }: Props) {
  const isUser = message.role === 'user'
  const [thinkOpen, setThinkOpen] = useState(false)
  const showThinking = !isUser && message.thinking?.trim()

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] rounded-[8px] px-3 py-2 ${chatFont} ${
          isUser
            ? 'bg-[#f0f0f0] text-black'
            : 'bg-[#e8f4fc] text-[#333333]'
        }`}
      >
        {showThinking && (
          <div className="mb-2 border-b border-slate-200/60 pb-2">
            <button
              type="button"
              className="flex w-full items-center gap-1 text-left text-xs text-slate-500"
              onClick={() => setThinkOpen((o) => !o)}
            >
              {thinkOpen ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              )}
              深度思考过程（可选查看）
            </button>
            {thinkOpen && (
              <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-500">
                {message.thinking}
              </p>
            )}
          </div>
        )}
        {isUser ? (
          <p className="m-0 whitespace-pre-wrap">{message.content}</p>
        ) : message.streaming ? (
          <p className="m-0 whitespace-pre-wrap">{message.content}</p>
        ) : (
          formatAssistantReply(message.content)
        )}
      </div>
    </div>
  )
}
