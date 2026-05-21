import { apiRequest } from './client'

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

export interface AssistantProviderProfilePublic {
  provider: AssistantProvider
  baseUrl: string
  apiKeyMasked: string
  model: string
  configured: boolean
  updatedAt: string
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

export interface AssistantConfigInput {
  provider?: AssistantProvider
  baseUrl?: string
  apiKey?: string
  model?: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  search?: Partial<AssistantSearchConfig>
}

export const PROVIDER_LABEL: Record<AssistantProvider, string> = {
  deepseek: 'DeepSeek',
  qwen: '通义千问 (Qwen)',
  kimi: 'Kimi (Moonshot)',
  minimax: 'MiniMax',
}

export const PROVIDERS: AssistantProvider[] = ['deepseek', 'qwen', 'kimi', 'minimax']

export const DEFAULT_SEARCH_CONFIG: AssistantSearchConfig = {
  enabled: true,
  contentApiPath: '/api/training-contents',
  contentLinkBase: '/content?id=',
  matchTitle: true,
  matchTags: true,
  matchDescription: true,
  matchStage: true,
  matchCategory: true,
  searchSensitivity: 0.5,
  maxCourseLinks: 3,
}

export function fetchAssistantConfig() {
  return apiRequest<{ config: AssistantConfigPublic }>('/api/admin/assistant/config')
}

export function saveAssistantConfig(input: AssistantConfigInput) {
  return apiRequest<{ ok: boolean; config: AssistantConfigPublic }>(
    '/api/admin/assistant/config',
    { method: 'PUT', body: JSON.stringify(input) },
  )
}

export function setActiveAssistantProvider(provider: AssistantProvider) {
  return apiRequest<{ ok: boolean; config: AssistantConfigPublic }>(
    '/api/admin/assistant/active-provider',
    { method: 'PUT', body: JSON.stringify({ provider }) },
  )
}

export function testAssistantConfig() {
  return apiRequest<{ ok: boolean; message: string; preview?: string }>(
    '/api/admin/assistant/test',
    { method: 'POST' },
  )
}
