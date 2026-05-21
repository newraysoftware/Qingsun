import type { ContentCategory, TrainingStageId } from '../types/content.js'

export const STAGE_LABEL: Record<TrainingStageId, string> = {
  foundation: '规培基础期',
  advanced: '专培进阶期',
  authorization: '授权提升期',
  mastery: '持续精进期',
}

export const CATEGORY_LABEL: Record<ContentCategory, string> = {
  theory: '理论课程',
  dsa: 'DSA操作',
  virtual: '虚拟实操',
  case: '临床案例',
}
