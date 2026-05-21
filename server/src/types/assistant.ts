export type AssistantProvider = 'deepseek' | 'qwen' | 'kimi' | 'minimax'

export interface AssistantSearchConfig {
  enabled: boolean
  contentApiPath: string
  contentLinkBase: string
  matchTitle: boolean
  matchTags: boolean
  matchDescription: boolean
  matchStage: boolean
  matchCategory: boolean
  searchSensitivity: number
  maxCourseLinks: number
}

export interface AssistantProviderProfile {
  provider: AssistantProvider
  baseUrl: string
  apiKey: string
  model: string
  updatedAt: string
}

export interface AssistantProviderProfilePublic {
  provider: AssistantProvider
  baseUrl: string
  apiKeyMasked: string
  model: string
  configured: boolean
  updatedAt: string
}

export interface AssistantConfig {
  provider: AssistantProvider
  baseUrl: string
  apiKey: string
  model: string
  systemPrompt: string
  maxTokens: number
  temperature: number
  updatedAt: string
  search: AssistantSearchConfig
}

export interface AssistantConfigPublic {
  provider: AssistantProvider
  baseUrl: string
  apiKeyMasked: string
  model: string
  systemPrompt: string
  maxTokens: number
  temperature: number
  updatedAt: string
  configured: boolean
  profiles: Record<AssistantProvider, AssistantProviderProfilePublic>
  search: AssistantSearchConfig
}

export interface ContentSearchHit {
  id: string
  title: string
  stageId: string
  stageLabel: string
  category: string
  categoryLabel: string
  description: string
  tags: string[]
  link: string
  score: number
}

export interface AssistantMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface AssistantFloatPosition {
  desktopX: number
  desktopY: number
  mobileX: number
  panelLeft: number | null
  panelTop: number | null
  panelWidth: number | null
  panelHeight: number | null
}
