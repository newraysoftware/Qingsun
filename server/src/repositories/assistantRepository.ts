import { db } from '../db.js'
import type {
  AssistantConfig,
  AssistantConfigPublic,
  AssistantFloatPosition,
  AssistantMessage,
  AssistantProvider,
  AssistantProviderProfile,
  AssistantProviderProfilePublic,
  AssistantSearchConfig,
} from '../types/assistant.js'
import { PROVIDER_DEFAULTS } from '../services/llmChat.js'

const PROVIDERS: AssistantProvider[] = ['deepseek', 'qwen', 'kimi', 'minimax']

export const DEFAULT_ASSISTANT_PROMPT =
  '你是介入医生自学培训智能助手，仅解答介入医疗、DSA操作、介入手术、培训相关疑问，语言专业、简洁，贴合临床实际，不解答无关问题。默认直接给出最终答复，不要输出思考过程。回复注意语义分段，关键知识点适当突出；可运用自身专业知识，并在开启互联网检索时结合检索摘要补充。站内课程仅在文末以「相关培训课程」列出课程名称超链接，正文勿写课程ID或URL。'

function maskApiKey(key: string): string {
  if (!key) return ''
  if (key.length <= 8) return '****'
  return `${key.slice(0, 4)}****${key.slice(-4)}`
}

function profileToPublic(p: AssistantProviderProfile): AssistantProviderProfilePublic {
  return {
    provider: p.provider,
    baseUrl: p.baseUrl,
    apiKeyMasked: maskApiKey(p.apiKey),
    model: p.model,
    configured: Boolean(p.apiKey?.trim()),
    updatedAt: p.updatedAt,
  }
}

function migrateLegacyConfigRow(legacy: Record<string, unknown>): void {
  const provider = String(legacy.provider || legacy.active_provider || 'deepseek') as AssistantProvider
  const d = PROVIDER_DEFAULTS[provider] ?? PROVIDER_DEFAULTS.deepseek
  const baseUrl = String(legacy.base_url || d.baseUrl)
  const apiKey = String(legacy.api_key || '')
  const model = String(legacy.model || d.model)
  if (!apiKey && !model && !legacy.base_url) return

  db.prepare(
    `INSERT INTO assistant_provider_profiles (provider, base_url, api_key, model, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(provider) DO UPDATE SET
       base_url = CASE WHEN excluded.base_url != '' THEN excluded.base_url ELSE assistant_provider_profiles.base_url END,
       api_key = CASE WHEN excluded.api_key != '' THEN excluded.api_key ELSE assistant_provider_profiles.api_key END,
       model = CASE WHEN excluded.model != '' THEN excluded.model ELSE assistant_provider_profiles.model END,
       updated_at = datetime('now')`,
  ).run(provider, baseUrl, apiKey, model)
}

function migrateAssistantConfigSchema(): void {
  const cols = db.prepare('PRAGMA table_info(assistant_config)').all() as { name: string }[]
  const names = cols.map((c) => c.name)
  if (!names.includes('base_url') && !names.includes('provider')) return

  const legacy = db.prepare('SELECT * FROM assistant_config WHERE id = 1').get() as
    | Record<string, unknown>
    | undefined

  if (legacy) migrateLegacyConfigRow(legacy)

  const prompt = String(
    legacy?.system_prompt || DEFAULT_ASSISTANT_PROMPT,
  )
  const activeProvider = String(legacy?.provider || legacy?.active_provider || 'deepseek')
  const maxTokens = Number(legacy?.max_tokens ?? 1024)
  const temperature = Number(legacy?.temperature ?? 0.7)

  db.exec(`
    CREATE TABLE IF NOT EXISTS assistant_config_v2 (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      active_provider TEXT NOT NULL DEFAULT 'deepseek',
      system_prompt TEXT NOT NULL,
      max_tokens INTEGER NOT NULL DEFAULT 1024,
      temperature REAL NOT NULL DEFAULT 0.7,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
  db.prepare(
    `INSERT OR REPLACE INTO assistant_config_v2 (id, active_provider, system_prompt, max_tokens, temperature)
     VALUES (1, ?, ?, ?, ?)`,
  ).run(activeProvider, prompt, maxTokens, temperature)
  db.exec(`DROP TABLE assistant_config;`)
  db.exec(`ALTER TABLE assistant_config_v2 RENAME TO assistant_config;`)
}

export function ensureAssistantTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS assistant_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      active_provider TEXT NOT NULL DEFAULT 'deepseek',
      system_prompt TEXT NOT NULL,
      max_tokens INTEGER NOT NULL DEFAULT 1024,
      temperature REAL NOT NULL DEFAULT 0.7,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS assistant_provider_profiles (
      provider TEXT PRIMARY KEY,
      base_url TEXT NOT NULL DEFAULT '',
      api_key TEXT NOT NULL DEFAULT '',
      model TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS assistant_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_assistant_messages_user ON assistant_messages(user_id);

    CREATE TABLE IF NOT EXISTS assistant_ui_state (
      user_id INTEGER PRIMARY KEY,
      desktop_x REAL NOT NULL DEFAULT 24,
      desktop_y REAL NOT NULL DEFAULT 120,
      mobile_x REAL NOT NULL DEFAULT 24,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `)

  const settings = db.prepare('SELECT id FROM assistant_config WHERE id = 1').get()
  if (!settings) {
    db.prepare(
      `INSERT INTO assistant_config (id, active_provider, system_prompt, max_tokens, temperature)
       VALUES (1, 'deepseek', ?, 1024, 0.7)`,
    ).run(DEFAULT_ASSISTANT_PROMPT)
  }

  for (const p of PROVIDERS) {
    const row = db
      .prepare('SELECT provider FROM assistant_provider_profiles WHERE provider = ?')
      .get(p)
    if (!row) {
      const d = PROVIDER_DEFAULTS[p]
      db.prepare(
        `INSERT INTO assistant_provider_profiles (provider, base_url, api_key, model)
         VALUES (?, ?, '', ?)`,
      ).run(p, d.baseUrl, d.model)
    }
  }

  migrateAssistantConfigSchema()
  migrateAssistantUiPanelColumns()
  migrateAssistantSearchColumns()
}

const DEFAULT_SEARCH: AssistantSearchConfig = {
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

function migrateAssistantSearchColumns(): void {
  const cols = db.prepare('PRAGMA table_info(assistant_config)').all() as { name: string }[]
  const names = new Set(cols.map((c) => c.name))
  const ensure = (col: string, ddl: string) => {
    if (!names.has(col)) db.exec(ddl)
  }
  ensure('search_enabled', `ALTER TABLE assistant_config ADD COLUMN search_enabled INTEGER NOT NULL DEFAULT 1`)
  ensure('content_api_path', `ALTER TABLE assistant_config ADD COLUMN content_api_path TEXT NOT NULL DEFAULT '/api/training-contents'`)
  ensure('content_link_base', `ALTER TABLE assistant_config ADD COLUMN content_link_base TEXT NOT NULL DEFAULT '/content?id='`)
  ensure('match_title', `ALTER TABLE assistant_config ADD COLUMN match_title INTEGER NOT NULL DEFAULT 1`)
  ensure('match_tags', `ALTER TABLE assistant_config ADD COLUMN match_tags INTEGER NOT NULL DEFAULT 1`)
  ensure('match_description', `ALTER TABLE assistant_config ADD COLUMN match_description INTEGER NOT NULL DEFAULT 1`)
  ensure('match_stage', `ALTER TABLE assistant_config ADD COLUMN match_stage INTEGER NOT NULL DEFAULT 1`)
  ensure('match_category', `ALTER TABLE assistant_config ADD COLUMN match_category INTEGER NOT NULL DEFAULT 1`)
  ensure('search_sensitivity', `ALTER TABLE assistant_config ADD COLUMN search_sensitivity REAL NOT NULL DEFAULT 0.5`)
  ensure('max_course_links', `ALTER TABLE assistant_config ADD COLUMN max_course_links INTEGER NOT NULL DEFAULT 3`)
}

function rowToSearch(row: Record<string, unknown>): AssistantSearchConfig {
  return {
    enabled: Number(row.search_enabled ?? 1) === 1,
    contentApiPath: String(row.content_api_path || DEFAULT_SEARCH.contentApiPath),
    contentLinkBase: String(row.content_link_base || DEFAULT_SEARCH.contentLinkBase),
    matchTitle: Number(row.match_title ?? 1) === 1,
    matchTags: Number(row.match_tags ?? 1) === 1,
    matchDescription: Number(row.match_description ?? 1) === 1,
    matchStage: Number(row.match_stage ?? 1) === 1,
    matchCategory: Number(row.match_category ?? 1) === 1,
    searchSensitivity: Number(row.search_sensitivity ?? 0.5),
    maxCourseLinks: Number(row.max_course_links ?? 3),
  }
}

export function getSearchConfig(): AssistantSearchConfig {
  ensureAssistantTables()
  const row = db.prepare('SELECT * FROM assistant_config WHERE id = 1').get() as
    | Record<string, unknown>
    | undefined
  if (!row) return { ...DEFAULT_SEARCH }
  return rowToSearch(row)
}

function migrateAssistantUiPanelColumns(): void {
  const cols = db.prepare('PRAGMA table_info(assistant_ui_state)').all() as { name: string }[]
  const names = new Set(cols.map((c) => c.name))
  if (!names.has('panel_left')) {
    db.exec(`ALTER TABLE assistant_ui_state ADD COLUMN panel_left REAL`)
  }
  if (!names.has('panel_top')) {
    db.exec(`ALTER TABLE assistant_ui_state ADD COLUMN panel_top REAL`)
  }
  if (!names.has('panel_width')) {
    db.exec(`ALTER TABLE assistant_ui_state ADD COLUMN panel_width REAL`)
  }
  if (!names.has('panel_height')) {
    db.exec(`ALTER TABLE assistant_ui_state ADD COLUMN panel_height REAL`)
  }
}

function getSettings(): {
  activeProvider: AssistantProvider
  systemPrompt: string
  maxTokens: number
  temperature: number
  updatedAt: string
} {
  ensureAssistantTables()
  const row = db.prepare('SELECT * FROM assistant_config WHERE id = 1').get() as
    | Record<string, unknown>
    | undefined
  if (!row) {
    return {
      activeProvider: 'deepseek',
      systemPrompt: DEFAULT_ASSISTANT_PROMPT,
      maxTokens: 1024,
      temperature: 0.7,
      updatedAt: new Date().toISOString(),
    }
  }
  return {
    activeProvider: (row.active_provider as AssistantProvider) || 'deepseek',
    systemPrompt: String(row.system_prompt || DEFAULT_ASSISTANT_PROMPT),
    maxTokens: Number(row.max_tokens ?? 1024),
    temperature: Number(row.temperature ?? 0.7),
    updatedAt: String(row.updated_at),
  }
}

export function getProviderProfile(provider: AssistantProvider): AssistantProviderProfile {
  ensureAssistantTables()
  const row = db
    .prepare('SELECT * FROM assistant_provider_profiles WHERE provider = ?')
    .get(provider) as Record<string, unknown> | undefined
  const d = PROVIDER_DEFAULTS[provider]
  if (!row) {
    return {
      provider,
      baseUrl: d.baseUrl,
      apiKey: '',
      model: d.model,
      updatedAt: new Date().toISOString(),
    }
  }
  return {
    provider,
    baseUrl: String(row.base_url || d.baseUrl),
    apiKey: String(row.api_key || ''),
    model: String(row.model || d.model),
    updatedAt: String(row.updated_at),
  }
}

export function getAllProviderProfilesPublic(): Record<
  AssistantProvider,
  AssistantProviderProfilePublic
> {
  const out = {} as Record<AssistantProvider, AssistantProviderProfilePublic>
  for (const p of PROVIDERS) {
    out[p] = profileToPublic(getProviderProfile(p))
  }
  return out
}

export function getAssistantConfig(): AssistantConfig {
  const settings = getSettings()
  const profile = getProviderProfile(settings.activeProvider)
  return {
    provider: settings.activeProvider,
    baseUrl: profile.baseUrl,
    apiKey: profile.apiKey,
    model: profile.model,
    systemPrompt: settings.systemPrompt,
    maxTokens: settings.maxTokens,
    temperature: settings.temperature,
    updatedAt: settings.updatedAt,
    search: getSearchConfig(),
  }
}

export function getAssistantConfigPublic(): AssistantConfigPublic {
  const settings = getSettings()
  const profile = getProviderProfile(settings.activeProvider)
  return {
    provider: settings.activeProvider,
    baseUrl: profile.baseUrl,
    apiKeyMasked: maskApiKey(profile.apiKey),
    model: profile.model,
    systemPrompt: settings.systemPrompt,
    maxTokens: settings.maxTokens,
    temperature: settings.temperature,
    updatedAt: settings.updatedAt,
    configured: Boolean(profile.apiKey?.trim()),
    profiles: getAllProviderProfilesPublic(),
    search: getSearchConfig(),
  }
}

export function updateAssistantConfig(patch: {
  provider?: AssistantProvider
  baseUrl?: string
  apiKey?: string
  model?: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  search?: Partial<AssistantSearchConfig>
}): AssistantConfigPublic {
  ensureAssistantTables()
  const settings = getSettings()
  const targetProvider = patch.provider ?? settings.activeProvider
  const currentProfile = getProviderProfile(targetProvider)
  const defaults = PROVIDER_DEFAULTS[targetProvider]

  const nextProfile: AssistantProviderProfile = {
    provider: targetProvider,
    baseUrl: patch.baseUrl ?? currentProfile.baseUrl ?? defaults.baseUrl,
    apiKey:
      patch.apiKey !== undefined && patch.apiKey !== ''
        ? patch.apiKey
        : currentProfile.apiKey,
    model: patch.model ?? currentProfile.model ?? defaults.model,
    updatedAt: new Date().toISOString(),
  }

  db.prepare(
    `INSERT INTO assistant_provider_profiles (provider, base_url, api_key, model, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(provider) DO UPDATE SET
       base_url = excluded.base_url,
       api_key = excluded.api_key,
       model = excluded.model,
       updated_at = datetime('now')`,
  ).run(
    nextProfile.provider,
    nextProfile.baseUrl,
    nextProfile.apiKey,
    nextProfile.model,
  )

  const nextSettings = {
    activeProvider: targetProvider,
    systemPrompt: patch.systemPrompt ?? settings.systemPrompt,
    maxTokens: patch.maxTokens ?? settings.maxTokens,
    temperature: patch.temperature ?? settings.temperature,
  }

  const searchPatch = patch.search
  const currentSearch = getSearchConfig()
  const nextSearch: AssistantSearchConfig = {
    ...currentSearch,
    ...searchPatch,
  }

  db.prepare(
    `UPDATE assistant_config SET
      active_provider = ?,
      system_prompt = ?,
      max_tokens = ?,
      temperature = ?,
      search_enabled = ?,
      content_api_path = ?,
      content_link_base = ?,
      match_title = ?,
      match_tags = ?,
      match_description = ?,
      match_stage = ?,
      match_category = ?,
      search_sensitivity = ?,
      max_course_links = ?,
      updated_at = datetime('now')
     WHERE id = 1`,
  ).run(
    nextSettings.activeProvider,
    nextSettings.systemPrompt,
    nextSettings.maxTokens,
    nextSettings.temperature,
    nextSearch.enabled ? 1 : 0,
    nextSearch.contentApiPath,
    nextSearch.contentLinkBase,
    nextSearch.matchTitle ? 1 : 0,
    nextSearch.matchTags ? 1 : 0,
    nextSearch.matchDescription ? 1 : 0,
    nextSearch.matchStage ? 1 : 0,
    nextSearch.matchCategory ? 1 : 0,
    nextSearch.searchSensitivity,
    nextSearch.maxCourseLinks,
  )

  return getAssistantConfigPublic()
}

export function listMessages(userId: number): AssistantMessage[] {
  ensureAssistantTables()
  const rows = db
    .prepare(
      `SELECT id, role, content, created_at FROM assistant_messages
       WHERE user_id = ? ORDER BY id ASC`,
    )
    .all(userId) as Record<string, unknown>[]
  return rows.map((r) => ({
    id: Number(r.id),
    role: r.role as 'user' | 'assistant',
    content: String(r.content),
    createdAt: String(r.created_at),
  }))
}

export function addMessage(
  userId: number,
  role: 'user' | 'assistant',
  content: string,
): AssistantMessage {
  const r = db
    .prepare(
      `INSERT INTO assistant_messages (user_id, role, content) VALUES (?, ?, ?)
       RETURNING id, role, content, created_at`,
    )
    .get(userId, role, content) as Record<string, unknown>
  return {
    id: Number(r.id),
    role: r.role as 'user' | 'assistant',
    content: String(r.content),
    createdAt: String(r.created_at),
  }
}

export function clearMessages(userId: number): void {
  db.prepare('DELETE FROM assistant_messages WHERE user_id = ?').run(userId)
}

export function getFloatPosition(userId: number): AssistantFloatPosition {
  ensureAssistantTables()
  const row = db
    .prepare(
      `SELECT desktop_x, desktop_y, mobile_x, panel_left, panel_top, panel_width, panel_height
       FROM assistant_ui_state WHERE user_id = ?`,
    )
    .get(userId) as Record<string, unknown> | undefined
  if (!row) {
    return {
      desktopX: 24,
      desktopY: 120,
      mobileX: 24,
      panelLeft: null,
      panelTop: null,
      panelWidth: null,
      panelHeight: null,
    }
  }
  return {
    desktopX: Number(row.desktop_x),
    desktopY: Number(row.desktop_y),
    mobileX: Number(row.mobile_x),
    panelLeft: row.panel_left != null ? Number(row.panel_left) : null,
    panelTop: row.panel_top != null ? Number(row.panel_top) : null,
    panelWidth: row.panel_width != null ? Number(row.panel_width) : null,
    panelHeight: row.panel_height != null ? Number(row.panel_height) : null,
  }
}

export function saveFloatPosition(userId: number, pos: AssistantFloatPosition): AssistantFloatPosition {
  ensureAssistantTables()
  db.prepare(
    `INSERT INTO assistant_ui_state (
       user_id, desktop_x, desktop_y, mobile_x,
       panel_left, panel_top, panel_width, panel_height, updated_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET
       desktop_x = excluded.desktop_x,
       desktop_y = excluded.desktop_y,
       mobile_x = excluded.mobile_x,
       panel_left = excluded.panel_left,
       panel_top = excluded.panel_top,
       panel_width = excluded.panel_width,
       panel_height = excluded.panel_height,
       updated_at = datetime('now')`,
  ).run(
    userId,
    pos.desktopX,
    pos.desktopY,
    pos.mobileX,
    pos.panelLeft,
    pos.panelTop,
    pos.panelWidth,
    pos.panelHeight,
  )
  return getFloatPosition(userId)
}
