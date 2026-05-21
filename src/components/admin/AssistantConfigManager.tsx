import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import {
  DEFAULT_SEARCH_CONFIG,
  fetchAssistantConfig,
  PROVIDER_LABEL,
  PROVIDERS,
  saveAssistantConfig,
  setActiveAssistantProvider,
  testAssistantConfig,
  type AssistantConfigPublic,
  type AssistantProvider,
  type AssistantProviderProfilePublic,
  type AssistantSearchConfig,
} from '../../api/adminAssistant'
import { ApiError } from '../../api/client'
import { useApp } from '../../context/AppContext'

type ProviderForm = {
  baseUrl: string
  model: string
  apiKey: string
}

export function AssistantConfigManager() {
  const { showToast } = useApp()
  const [config, setConfig] = useState<AssistantConfigPublic | null>(null)
  const [profiles, setProfiles] = useState<Record<AssistantProvider, AssistantProviderProfilePublic>>(
    () => ({} as Record<AssistantProvider, AssistantProviderProfilePublic>),
  )
  const [provider, setProvider] = useState<AssistantProvider>('deepseek')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [maxTokens, setMaxTokens] = useState(1024)
  const [temperature, setTemperature] = useState(0.7)
  const [search, setSearch] = useState<AssistantSearchConfig>(DEFAULT_SEARCH_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  const draftsRef = useRef<Partial<Record<AssistantProvider, ProviderForm>>>({})

  const applyProviderForm = useCallback(
    (p: AssistantProvider, source?: AssistantProviderProfilePublic) => {
      const prof = source ?? profiles[p]
      const draft = draftsRef.current[p]
      if (draft) {
        setBaseUrl(draft.baseUrl)
        setModel(draft.model)
        setApiKey(draft.apiKey)
      } else if (prof) {
        setBaseUrl(prof.baseUrl)
        setModel(prof.model)
        setApiKey('')
      }
    },
    [profiles],
  )

  const stashCurrentDraft = useCallback(() => {
    draftsRef.current[provider] = { baseUrl, model, apiKey }
  }, [provider, baseUrl, model, apiKey])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { config: c } = await fetchAssistantConfig()
      setConfig(c)
      setProfiles(c.profiles)
      setProvider(c.provider)
      setSystemPrompt(c.systemPrompt)
      setMaxTokens(c.maxTokens)
      setTemperature(c.temperature)
      setSearch(c.search ?? DEFAULT_SEARCH_CONFIG)
      draftsRef.current = {}
      const prof = c.profiles[c.provider]
      if (prof) {
        setBaseUrl(prof.baseUrl)
        setModel(prof.model)
        setApiKey('')
      }
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : '加载配置失败')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    void load()
  }, [load])

  const onProviderChange = async (next: AssistantProvider) => {
    if (next === provider) return
    stashCurrentDraft()
    setProvider(next)
    try {
      const { config: c } = await setActiveAssistantProvider(next)
      setConfig(c)
      setProfiles(c.profiles)
      applyProviderForm(next, c.profiles[next])
    } catch (e) {
      applyProviderForm(next)
      showToast(e instanceof ApiError ? e.message : '切换厂商失败')
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { config: c } = await saveAssistantConfig({
        provider,
        baseUrl,
        apiKey: apiKey || undefined,
        model,
        systemPrompt,
        maxTokens,
        temperature,
        search,
      })
      setConfig(c)
      setProfiles(c.profiles)
      setSearch(c.search)
      draftsRef.current[provider] = undefined
      setApiKey('')
      showToast(`${PROVIDER_LABEL[provider]} 配置已保存`)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const onTest = async () => {
    setTesting(true)
    try {
      await saveAssistantConfig({
        provider,
        baseUrl,
        apiKey: apiKey || undefined,
        model,
        systemPrompt,
        maxTokens,
        temperature,
        search,
      })
      setApiKey('')
      const r = await testAssistantConfig()
      showToast(r.message || '配置成功')
      void load()
    } catch (err) {
      showToast(
        err instanceof ApiError
          ? err.message
          : '配置失败，请检查 Base URL 和 API key 正确性',
      )
    } finally {
      setTesting(false)
    }
  }

  const activeProfile = profiles[provider]
  const configuredProviders = PROVIDERS.filter((p) => profiles[p]?.configured)

  if (loading) {
    return <p className="text-sm text-slate-500">加载智能学习助手配置…</p>
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="card max-w-2xl space-y-4 text-sm">
      <div>
        <h2 className="font-semibold text-slate-800">智能学习助手配置</h2>
        <p className="mt-1 text-xs text-slate-500">
          各模型厂商的 API key、模型名称独立保存；切换厂商时自动载入该厂商已保存的配置。
        </p>
        {configuredProviders.length > 0 && (
          <p className="mt-1 text-xs text-primary-600">
            已配置：{configuredProviders.map((p) => PROVIDER_LABEL[p]).join('、')}
          </p>
        )}
      </div>

      <label className="block">
        <span className="text-slate-700">当前启用模型</span>
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          value={provider}
          onChange={(e) => void onProviderChange(e.target.value as AssistantProvider)}
        >
          {PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {PROVIDER_LABEL[p]}
              {profiles[p]?.configured ? ' ✓' : ''}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-slate-700">Base URL</span>
        <input
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          required
          placeholder="https://api.deepseek.com"
        />
      </label>

      <label className="block">
        <span className="text-slate-700">API key（{PROVIDER_LABEL[provider]}）</span>
        {activeProfile?.apiKeyMasked && (
          <p className="text-xs text-slate-400">
            已保存：{activeProfile.apiKeyMasked}（留空则不修改）
          </p>
        )}
        <input
          type="password"
          autoComplete="off"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={activeProfile?.configured ? '留空保持该厂商原密钥' : '请输入 API key'}
        />
      </label>

      <label className="block">
        <span className="text-slate-700">模型名称（{PROVIDER_LABEL[provider]}）</span>
        <input
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          required
        />
      </label>

      <fieldset className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-800">网站内容检索配置</legend>
        <p className="text-xs text-slate-500">
          绑定站内培训内容库（{search.contentApiPath}），按规则匹配课程并生成可跳转链接。
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={search.enabled}
            onChange={(e) => setSearch((s) => ({ ...s, enabled: e.target.checked }))}
          />
          启用站内课程检索
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">内容库接口路径</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
            value={search.contentApiPath}
            onChange={(e) => setSearch((s) => ({ ...s, contentApiPath: e.target.value }))}
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">课程链接前缀</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
            value={search.contentLinkBase}
            onChange={(e) => setSearch((s) => ({ ...s, contentLinkBase: e.target.value }))}
            placeholder="/content?id="
          />
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ['matchTitle', '课程名称'],
              ['matchTags', '知识点标签'],
              ['matchDescription', '课程简介'],
              ['matchStage', '培训体系阶段'],
              ['matchCategory', '内容类型'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={search[key]}
                onChange={(e) => setSearch((s) => ({ ...s, [key]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-700">检索灵敏度 ({search.searchSensitivity.toFixed(1)})</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              className="mt-2 w-full"
              value={search.searchSensitivity}
              onChange={(e) =>
                setSearch((s) => ({ ...s, searchSensitivity: Number(e.target.value) }))
              }
            />
            <p className="mt-0.5 text-xs text-slate-400">越高匹配越宽松，越低越精准</p>
          </label>
          <label className="block text-sm">
            <span className="text-slate-700">最多关联课程数</span>
            <input
              type="number"
              min={1}
              max={5}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={search.maxCourseLinks}
              onChange={(e) =>
                setSearch((s) => ({ ...s, maxCourseLinks: Number(e.target.value) }))
              }
            />
          </label>
        </div>
      </fieldset>

      <label className="block">
        <span className="text-slate-700">Prompt 提示词（全局）</span>
        <textarea
          rows={7}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-relaxed"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-slate-700">回复长度 (max tokens)</span>
          <input
            type="number"
            min={256}
            max={4096}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value))}
          />
        </label>
        <label className="block">
          <span className="text-slate-700">精准度 (temperature 0–1)</span>
          <input
            type="number"
            min={0}
            max={1}
            step={0.1}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
          />
          <p className="mt-0.5 text-xs text-slate-400">数值越低回复越稳定、越贴近规范表述</p>
        </label>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <button type="submit" className="btn-primary text-sm" disabled={saving}>
          {saving ? '保存中…' : '保存全部配置'}
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
          disabled={testing}
          onClick={() => void onTest()}
        >
          {testing ? '测试中…' : '测试当前厂商连接'}
        </button>
      </div>

      {config && (
        <p className="text-xs text-slate-400">
          当前启用：{PROVIDER_LABEL[config.provider]} ·{' '}
          {config.configured ? '已配置 API key' : '未配置 API key'} · 更新于{' '}
          {new Date(config.updatedAt).toLocaleString()}
        </p>
      )}
    </form>
  )
}
