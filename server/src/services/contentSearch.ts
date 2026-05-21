import { listContents } from '../repositories/contentRepository.js'
import { CATEGORY_LABEL, STAGE_LABEL } from '../data/contentLabels.js'
import type { AssistantSearchConfig, ContentSearchHit } from '../types/assistant.js'
import type { ContentCategory, TrainingStageId } from '../types/content.js'

const CATEGORY_KEYWORDS: Record<ContentCategory, string[]> = {
  theory: ['理论', '课程', '解剖', '读片', '影像'],
  dsa: ['dsa', '造影', '设备', '参数', 'c臂'],
  virtual: ['虚拟', '实操', '模拟', '穿刺'],
  case: ['案例', '病例', '临床'],
}

function tokenize(text: string): string[] {
  const lower = text.toLowerCase()
  const words = lower.match(/[a-z0-9]{2,}|[\u4e00-\u9fa5]{2,}/g) ?? []
  const singles = lower.match(/[\u4e00-\u9fa5]/g) ?? []
  return [...new Set([...words, ...singles.filter((c) => text.includes(c))])]
}

function containsToken(haystack: string, token: string): boolean {
  return haystack.toLowerCase().includes(token.toLowerCase())
}

export function courseLink(contentLinkBase: string, contentId: string): string {
  const id = encodeURIComponent(contentId)
  if (contentLinkBase.includes('{id}')) {
    return contentLinkBase.replace('{id}', id)
  }
  if (contentLinkBase.includes('id=')) {
    return `${contentLinkBase}${id}`
  }
  if (contentLinkBase.includes('?')) {
    const sep = contentLinkBase.endsWith('?') || contentLinkBase.endsWith('&') ? '' : '&'
    return `${contentLinkBase}${sep}id=${id}`
  }
  return `/content?id=${id}`
}

export function searchTrainingContents(
  query: string,
  search: AssistantSearchConfig,
  options?: { userStageId?: TrainingStageId; limit?: number },
): ContentSearchHit[] {
  if (!search.enabled) return []

  const limit = options?.limit ?? search.maxCourseLinks + 2
  const items = listContents({ status: 'published' })
  const tokens = tokenize(query)
  if (tokens.length === 0) return []

  const minScore = Math.max(2, Math.round((1 - search.searchSensitivity) * 12))

  const scored: ContentSearchHit[] = []

  for (const item of items) {
    let score = 0
    const title = item.title
    const desc = item.description
    const tagStr = item.tags.join(' ')
    const stageLabel = STAGE_LABEL[item.stageId as TrainingStageId] || item.stageId
    const categoryLabel = CATEGORY_LABEL[item.category as ContentCategory] || item.category

    const blob = `${title} ${desc} ${tagStr} ${stageLabel} ${categoryLabel}`.toLowerCase()

    if (search.matchTitle) {
      for (const t of tokens) {
        if (containsToken(title, t)) score += 6
      }
      if (containsToken(title, query)) score += 8
    }

    if (search.matchTags) {
      for (const t of tokens) {
        if (containsToken(tagStr, t)) score += 4
      }
    }

    if (search.matchDescription) {
      for (const t of tokens) {
        if (containsToken(desc, t)) score += 2
      }
    }

    if (search.matchStage) {
      if (options?.userStageId === item.stageId) score += 3
      for (const t of tokens) {
        if (containsToken(stageLabel, t)) score += 5
      }
    }

    if (search.matchCategory) {
      const keys = CATEGORY_KEYWORDS[item.category as ContentCategory] || []
      for (const t of tokens) {
        if (keys.some((k) => k.includes(t) || t.includes(k))) score += 4
        if (containsToken(categoryLabel, t)) score += 3
      }
    }

    if (score < minScore) continue

    scored.push({
      id: item.id,
      title: item.title,
      stageId: item.stageId,
      stageLabel,
      category: item.category,
      categoryLabel,
      description: item.description,
      tags: item.tags,
      link: courseLink(search.contentLinkBase, item.id),
      score,
    })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit)
}

export function formatSearchContext(hits: ContentSearchHit[]): string {
  if (!hits.length) return '【站内培训课程检索】未匹配到高度相关课程。'
  const lines = hits.map(
    (h, i) =>
      `${i + 1}. 课程名称：《${h.title}》| 阶段：${h.stageLabel} | 类型：${h.categoryLabel} | 简介：${h.description.slice(0, 80)}`,
  )
  return `【站内培训课程检索结果】（仅名称供参考，勿在正文写出课程ID或URL）\n${lines.join('\n')}`
}

export function formatCourseLinksLine(hits: ContentSearchHit[]): string {
  if (!hits.length) return ''
  const parts = hits.map((h) => {
    const href = h.link.includes('?') ? `${h.link}&learn=1` : `${h.link}?learn=1`
    return `[${h.title}](${href})`
  })
  return `\n\n相关培训课程：${parts.join('、')}`
}

