import type { ContentSearchHit } from '../types/assistant.js'
import { formatCourseLinksLine } from '../services/contentSearch.js'

/** 移除模型思考过程与正文中的课程 ID / 裸链接 */
export function stripThinkingAndIds(text: string): string {
  return text
    .replace(/[\s\S]*?<\/think>/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/【思考过程】[\s\S]*?【\/思考过程】/g, '')
    .replace(/```thinking[\s\S]*?```/gi, '')
    .replace(/\/content\?id=[a-f0-9-]{8,}/gi, '')
    .replace(/\[([^\]]+)\]\(\/content\?id=[^)]+\)/gi, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** 文末仅保留课程名称超链接（由服务端生成，不暴露 ID 文本） */
export function finalizeCourseLinks(
  reply: string,
  hits: ContentSearchHit[],
  maxLinks: number,
): string {
  let body = stripThinkingAndIds(reply)
  body = body.replace(/\n*相关培训课程\s*[:：][\s\S]*$/i, '').trim()
  if (hits.length > 0) {
    body += formatCourseLinksLine(hits.slice(0, maxLinks))
  }
  return body
}
