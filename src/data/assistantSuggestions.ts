export const ASSISTANT_SUGGESTIONS: { keywords: string[]; text: string }[] = [
  { keywords: ['dsa', 'DSA'], text: 'DSA基础操作' },
  { keywords: ['dsa', 'DSA'], text: 'DSA参数调节' },
  { keywords: ['dsa', 'DSA'], text: 'DSA故障排查' },
  { keywords: ['穿刺'], text: '穿刺失败的原因有哪些' },
  { keywords: ['tace', 'TACE'], text: 'TACE手术流程' },
  { keywords: ['造影'], text: '复杂造影技巧要点' },
  { keywords: ['并发症'], text: '介入并发症如何处理' },
  { keywords: ['辐射', '防护'], text: '介入室辐射防护规范' },
]

export function matchAssistantSuggestions(input: string, limit = 5): string[] {
  const q = input.trim().toLowerCase()
  if (!q) return []
  const out: string[] = []
  for (const s of ASSISTANT_SUGGESTIONS) {
    if (s.keywords.some((k) => k.toLowerCase().includes(q) || q.includes(k.toLowerCase()))) {
      if (!out.includes(s.text)) out.push(s.text)
    }
  }
  return out.slice(0, limit)
}
