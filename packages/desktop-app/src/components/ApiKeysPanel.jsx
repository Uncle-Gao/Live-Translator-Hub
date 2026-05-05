import { useState, useEffect } from 'react'
import { Key, Globe, Cpu, Check, AlertCircle, Eye, EyeOff, Save, FlaskConical, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'
import useConfigStore from '../store/configStore'

const OPENAI_PRESETS = [
  { label: 'GPT-4o',              model: 'gpt-4o',                  baseURL: 'https://api.openai.com/v1' },
  { label: 'GPT-4o Mini',         model: 'gpt-4o-mini',             baseURL: 'https://api.openai.com/v1' },
  { label: 'DeepSeek V4 Flash',   model: 'deepseek-v4-flash',       baseURL: 'https://api.deepseek.com' },
  { label: 'DeepSeek V4 Pro',     model: 'deepseek-v4-pro',         baseURL: 'https://api.deepseek.com' },
  { label: 'Qwen Max',            model: 'qwen-max',                baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  { label: 'Qwen Plus',           model: 'qwen-plus',               baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  { label: 'Groq Llama 3.3 70B', model: 'llama-3.3-70b-versatile', baseURL: 'https://api.groq.com/openai/v1' },
  { label: 'Moonshot V1',         model: 'moonshot-v1-8k',          baseURL: 'https://api.moonshot.cn/v1' },
]

const ENGINE_CONFIGS = [
  {
    id: 'openai',
    label: 'OpenAI / Compatible API',
    color: 'emerald',
    hasModel: true,
    defaultModel: 'gpt-4o-mini',
    placeholder: 'sk-...',
  },
  {
    id: 'anthropic',
    label: 'Anthropic Claude',
    color: 'orange',
    hasModel: true,
    defaultModel: 'claude-sonnet-4-6',
    defaultBaseURL: 'https://api.anthropic.com',
    models: ['claude-sonnet-4-6', 'claude-opus-4-7', 'claude-haiku-4-5-20251001'],
    placeholder: 'sk-ant-...',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    color: 'blue',
    hasModel: true,
    defaultModel: 'gemini-3-flash-preview',
    defaultBaseURL: 'https://generativelanguage.googleapis.com',
    models: ['gemini-3.1-pro-preview', 'gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview'],
    placeholder: 'AIza...',
  },
  {
    id: 'deepl',
    label: 'DeepL API',
    color: 'purple',
    hasModel: false,
    defaultModel: null,
    models: [],
    placeholder: 'xxxxxxxx-xxxx-...:fx',
  },
]

const inputCls = "w-full bg-black/40 border border-white/5 hover:border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-mono placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
const labelCls = "text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1"

export default function ApiKeysPanel() {
  const { t } = useTranslation()
  const { config, updateApiKeys } = useConfigStore()

  const [localKeys, setLocalKeys] = useState({
    openai:    { apiKey: '', model: 'gpt-4o-mini', baseURL: 'https://api.openai.com/v1', name: '' },
    anthropic: { apiKey: '', model: 'claude-sonnet-4-6', baseURL: 'https://api.anthropic.com' },
    gemini:    { apiKey: '', model: 'gemini-3-flash-preview', baseURL: 'https://generativelanguage.googleapis.com' },
    deepl:     { apiKey: '' },
  })

  const [visible, setVisible]       = useState({})
  const [testing, setTesting]       = useState({})
  const [testResult, setTestResult] = useState({})
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)

  useEffect(() => {
    if (config.apiKeys.engines) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalKeys(prev => {
        const merged = { ...prev }
        for (const [id, saved] of Object.entries(config.apiKeys.engines)) {
          merged[id] = { ...prev[id], ...saved }
        }
        return merged
      })
    }
  }, [config.apiKeys.engines])

  const update = (id, field, value) => {
    setLocalKeys(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
    setTestResult(prev => ({ ...prev, [id]: null }))
    setSaved(false)
  }

  const handleModelChange = (engId, value) => {
    update(engId, 'model', value === '__custom__' ? '' : value)
  }

  const handlePresetChange = (value) => {
    if (value === '__custom__') {
      setLocalKeys(prev => ({ ...prev, openai: { ...prev.openai, model: '' } }))
    } else {
      const preset = OPENAI_PRESETS.find(p => p.model === value)
      if (preset) {
        setLocalKeys(prev => ({ ...prev, openai: { ...prev.openai, model: preset.model, baseURL: preset.baseURL } }))
      }
    }
    setTestResult(prev => ({ ...prev, openai: null }))
    setSaved(false)
  }

  const handleTest = async (engineId) => {
    const cfg = localKeys[engineId]
    if (!cfg?.apiKey) return
    setTesting(prev => ({ ...prev, [engineId]: true }))
    setTestResult(prev => ({ ...prev, [engineId]: null }))
    try {
      const res = await window.liveTranslatorAPI.testApiKey({
        engine: engineId, apiKey: cfg.apiKey, model: cfg.model, baseURL: cfg.baseURL,
      })
      setTestResult(prev => ({ ...prev, [engineId]: res.ok ? 'ok' : 'fail' }))
    } catch {
      setTestResult(prev => ({ ...prev, [engineId]: 'fail' }))
    } finally {
      setTesting(prev => ({ ...prev, [engineId]: false }))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await updateApiKeys({
      ...config.apiKeys,
      engines: localKeys,
      activeId: config.apiKeys.activeId === 'none' ? 'openai' : config.apiKeys.activeId,
    })
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
    setSaving(false)
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="grid grid-cols-1 gap-6">
        {ENGINE_CONFIGS.map(eng => {
          const cfg       = localKeys[eng.id] || {}
          const isVisible = visible[eng.id]
          const isTesting = testing[eng.id]
          const result    = testResult[eng.id]
          const isCustom  = eng.id === 'openai'
            ? !OPENAI_PRESETS.find(p => p.model === cfg.model)
            : eng.hasModel && !eng.models.includes(cfg.model)

          return (
            <div key={eng.id} className="group bg-[#1A1C1E] border border-white/5 rounded-3xl p-6 relative overflow-hidden transition-all hover:bg-[#1E2023] hover:border-white/10 shadow-xl">
              {/* color stripe */}
              <div className={clsx(
                "absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b opacity-40 group-hover:opacity-100 transition-opacity",
                eng.color === 'emerald' ? 'from-emerald-500 to-teal-600' :
                eng.color === 'orange'  ? 'from-orange-500 to-amber-600' :
                eng.color === 'blue'    ? 'from-blue-500 to-indigo-600'  :
                'from-purple-500 to-violet-600'
              )} />

              {/* header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={clsx(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    eng.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
                    eng.color === 'orange'  ? 'bg-orange-500/10 text-orange-400'   :
                    eng.color === 'blue'    ? 'bg-blue-500/10 text-blue-400'       :
                    'bg-purple-500/10 text-purple-400'
                  )}>
                    {eng.id === 'openai'    ? <Globe className="w-5 h-5" /> :
                     eng.id === 'anthropic' ? <Cpu className="w-5 h-5" />   :
                     eng.id === 'gemini'    ? <FlaskConical className="w-5 h-5" /> :
                     <Key className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {eng.id === 'openai' && cfg.name ? cfg.name : eng.label}
                    </h3>
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{t('engineLabel', { name: eng.id })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {result === 'ok' && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                      <Check className="w-3 h-3" /> {t('testSuccess')}
                    </div>
                  )}
                  {result === 'fail' && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 uppercase tracking-widest">
                      <AlertCircle className="w-3 h-3" /> {t('testFailed')}
                    </div>
                  )}
                  <button
                    onClick={() => handleTest(eng.id)}
                    disabled={!cfg.apiKey || isTesting}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-xs font-bold text-white/60 hover:text-white transition-all disabled:opacity-30"
                  >
                    {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
                    {t('test', 'Test Connection')}
                  </button>
                </div>
              </div>

              {/* fields */}
              {eng.id === 'openai' ? (
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {/* row 1 left: API Key */}
                  <div className="space-y-2">
                    <label className={labelCls}>{t('apiKey')}</label>
                    <div className="relative group/input">
                      <input
                        type={isVisible ? 'text' : 'password'}
                        value={cfg.apiKey || ''}
                        placeholder={eng.placeholder}
                        onChange={e => update('openai', 'apiKey', e.target.value)}
                        className={inputCls}
                      />
                      <button
                        onClick={() => setVisible(prev => ({ ...prev, openai: !prev.openai }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-white/60 transition-colors"
                      >
                        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* row 1 right: Model */}
                  <div className="space-y-2">
                    <label className={labelCls}>{t('model')}</label>
                    {isCustom ? (
                      <div className="relative">
                        <input
                          type="text"
                          value={cfg.model || ''}
                          placeholder={t('enterModelName')}
                          autoFocus
                          onChange={e => update('openai', 'model', e.target.value)}
                          className="w-full bg-black/40 border border-emerald-500/20 hover:border-emerald-500/30 rounded-2xl px-4 py-3 text-sm text-white font-mono placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                        <button
                          onClick={() => handlePresetChange(OPENAI_PRESETS[0].model)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 hover:text-white/60 transition-colors"
                        >{t('preset')}</button>
                      </div>
                    ) : (
                      <select
                        value={cfg.model || eng.defaultModel}
                        onChange={e => handlePresetChange(e.target.value)}
                        className={inputCls + ' cursor-pointer'}
                      >
                        {OPENAI_PRESETS.map(p => (
                          <option key={p.model} value={p.model} className="bg-[#1A1C1E]">{p.label}</option>
                        ))}
                        <option value="__custom__" className="bg-[#1A1C1E]">{t('customModel')}</option>
                      </select>
                    )}
                  </div>

                  {/* row 2: Base URL full width */}
                  <div className="col-span-2 space-y-2">
                    <label className={labelCls}>{t('baseUrl')}</label>
                    <input
                      type="text"
                      value={cfg.baseURL || ''}
                      placeholder="https://api.openai.com/v1"
                      onChange={e => update('openai', 'baseURL', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              ) : (
                <div className={clsx('grid gap-x-6 gap-y-4', eng.hasModel ? 'grid-cols-2' : 'grid-cols-1')}>
                  {/* API Key */}
                  <div className="space-y-2">
                    <label className={labelCls}>{t('apiKey')}</label>
                    <div className="relative group/input">
                      <input
                        type={isVisible ? 'text' : 'password'}
                        value={cfg.apiKey || ''}
                        placeholder={eng.placeholder}
                        onChange={e => update(eng.id, 'apiKey', e.target.value)}
                        className={inputCls}
                      />
                      <button
                        onClick={() => setVisible(prev => ({ ...prev, [eng.id]: !prev[eng.id] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-white/60 transition-colors"
                      >
                        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Model */}
                  {eng.hasModel && (
                    <div className="space-y-2">
                      <label className={labelCls}>{t('modelName')}</label>
                      {isCustom ? (
                        <div className="relative">
                          <input
                            type="text"
                            value={cfg.model || ''}
                            placeholder={t('enterModelName')}
                            autoFocus
                            onChange={e => update(eng.id, 'model', e.target.value)}
                            className={clsx(
                              'w-full bg-black/40 border rounded-2xl px-4 py-3 text-sm text-white font-mono placeholder-white/10 focus:outline-none focus:ring-2 transition-all',
                              eng.color === 'orange' ? 'border-orange-500/20 hover:border-orange-500/30 focus:ring-orange-500/20' :
                                                       'border-blue-500/20 hover:border-blue-500/30 focus:ring-blue-500/20'
                            )}
                          />
                          <button
                            onClick={() => handleModelChange(eng.id, eng.defaultModel)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 hover:text-white/60 transition-colors"
                          >{t('preset')}</button>
                        </div>
                      ) : (
                        <select
                          value={cfg.model || eng.defaultModel}
                          onChange={e => handleModelChange(eng.id, e.target.value)}
                          className={inputCls + ' cursor-pointer'}
                        >
                          {eng.models.map(m => <option key={m} value={m} className="bg-[#1A1C1E]">{m}</option>)}
                          <option value="__custom__" className="bg-[#1A1C1E]">{t('customModel')}</option>
                        </select>
                      )}
                    </div>
                  )}

                  {/* Base URL */}
                  {eng.defaultBaseURL && (
                    <div className="col-span-2 space-y-2">
                      <label className={labelCls}>{t('baseUrl')}</label>
                      <input
                        type="text"
                        value={cfg.baseURL || ''}
                        placeholder={eng.defaultBaseURL}
                        onChange={e => update(eng.id, 'baseURL', e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex justify-center pt-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="relative group overflow-hidden px-10 py-4 rounded-2xl transition-all duration-500 hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] disabled:opacity-50"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative flex items-center gap-3">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            <span className="text-sm font-bold text-white uppercase tracking-widest">
              {saved ? t('savedMsg') : t('saveAll')}
            </span>
          </div>
        </button>
      </div>
    </div>
  )
}
