import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const MAX_CHARS_PER_PARAGRAPH = 126

const KEYWORD_PATTERNS = [
  /(\*\*[^*]+\*\*)/g,
  /(DSA[\u4e00-\u9fa5A-Za-z0-9、，：:（）()\-]{0,20})/g,
  /(TACE[\u4e00-\u9fa5A-Za-z0-9、，：:（）()\-]{0,16})/g,
  /(操作步骤[\u4e00-\u9fa5\d、，：:（）()\-]{0,24})/g,
  /(病例解析[\u4e00-\u9fa5\d、，：:（）()\-]{0,24})/g,
  /(穿刺[\u4e00-\u9fa5\d、，：:（）()\-]{0,20})/g,
  /(并发症[\u4e00-\u9fa5\d、，：:（）()\-]{0,20})/g,
]

const MD_LINK = /\[([^\]]+)\]\(([^)]+)\)/g

function splitIntoParagraphs(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []

  const raw = normalized.split(/\n{2,}/).flatMap((block) => {
    const t = block.trim()
    if (!t) return []
    if (t.length <= MAX_CHARS_PER_PARAGRAPH) return [t]
    const sentences = t.split(/(?<=[。！？；;])\s*/)
    const out: string[] = []
    let buf = ''
    for (const s of sentences) {
      const next = buf ? `${buf}${s}` : s
      if (next.length > MAX_CHARS_PER_PARAGRAPH && buf) {
        out.push(buf.trim())
        buf = s
      } else {
        buf = next
      }
    }
    if (buf.trim()) out.push(buf.trim())
    return out
  })

  return raw.length ? raw : [normalized]
}

function renderCourseLink(href: string, label: string, key: string): ReactNode {
  const internal = href.startsWith('/') || href.startsWith('#')
  const cls = 'text-primary-700 underline decoration-primary-300 hover:text-primary-800'
  if (internal) {
    return (
      <Link key={key} to={href} className={cls}>
        {label}
      </Link>
    )
  }
  return (
    <a key={key} href={href} className={cls} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  )
}

function renderInline(segment: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let rest = segment
  let i = 0

  while (rest.length > 0) {
    MD_LINK.lastIndex = 0
    const linkMatch = MD_LINK.exec(rest)

    let earliest = linkMatch?.index ?? -1
    let matchText = linkMatch?.[0] ?? ''
    let matchType: 'link' | 'bold' | 'text' = 'text'

    for (const pat of KEYWORD_PATTERNS) {
      pat.lastIndex = 0
      const m = pat.exec(rest)
      if (m && (earliest < 0 || m.index < earliest)) {
        earliest = m.index
        matchText = m[1]
        matchType = 'bold'
      }
    }

    if (linkMatch && linkMatch.index === earliest) {
      matchType = 'link'
      matchText = linkMatch[0]
    }

    if (earliest < 0) {
      nodes.push(rest)
      break
    }

    if (earliest > 0) nodes.push(rest.slice(0, earliest))

    if (matchType === 'link' && linkMatch) {
      nodes.push(renderCourseLink(linkMatch[2], linkMatch[1], `${keyPrefix}-l-${i++}`))
    } else if (matchType === 'bold') {
      const boldText = matchText.startsWith('**') ? matchText.slice(2, -2) : matchText
      nodes.push(
        <strong key={`${keyPrefix}-b-${i++}`} className="font-semibold text-slate-800">
          {boldText}
        </strong>,
      )
    }

    rest = rest.slice(earliest + matchText.length)
  }

  return nodes
}

export function formatAssistantReply(content: string): ReactNode {
  const paragraphs = splitIntoParagraphs(content)
  return (
    <div className="space-y-2">
      {paragraphs.map((p, idx) => (
        <p
          key={idx}
          className={`m-0 ${p.includes('相关培训课程') ? 'mt-2 border-t border-slate-200/80 pt-2 text-[12px] md:text-[13px]' : ''}`}
        >
          {renderInline(p, `p${idx}`)}
        </p>
      ))}
    </div>
  )
}
