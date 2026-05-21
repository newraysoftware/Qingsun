/** 轻量公开检索，供「互联网检索」开关注入上下文（无需额外 API Key） */
export async function searchWebSnippets(query: string, limit = 3): Promise<string> {
  const q = query.trim().slice(0, 120)
  if (!q) return ''

  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_redirect=1&skip_disambig=1`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return ''
    const data = (await res.json()) as {
      AbstractText?: string
      AbstractURL?: string
      Heading?: string
      RelatedTopics?: { Text?: string; FirstURL?: string; Topics?: { Text?: string }[] }[]
    }

    const lines: string[] = []
    if (data.AbstractText) {
      lines.push(
        `摘要：${data.AbstractText}${data.AbstractURL ? `（来源：${data.AbstractURL}）` : ''}`,
      )
    }

    const topics: string[] = []
    for (const t of data.RelatedTopics ?? []) {
      if (t.Text) topics.push(t.Text.replace(/\s+-\s+.*$/, '').trim())
      if (topics.length >= limit) break
      for (const sub of t.Topics ?? []) {
        if (sub.Text) topics.push(sub.Text.replace(/\s+-\s+.*$/, '').trim())
        if (topics.length >= limit) break
      }
    }
    if (topics.length) {
      lines.push(`相关要点：${topics.slice(0, limit).join('；')}`)
    }

    if (!lines.length) return ''
    return `【互联网检索参考】\n${lines.join('\n')}`
  } catch {
    return ''
  }
}
