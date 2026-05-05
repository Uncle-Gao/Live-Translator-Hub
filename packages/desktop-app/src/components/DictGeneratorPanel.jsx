import { useState, useEffect, useRef } from 'react'
import { Zap, Monitor, Cpu, Globe, Hash, Play, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'
import useConfigStore from '../store/configStore'
import { ALL_LANGUAGES } from '../constants'

export default function DictGeneratorPanel() {
  const { t } = useTranslation()
  const { config } = useConfigStore()
  
  const [targetApp, setTargetApp] = useState('cursor')
  const [targetLang, setTargetLang] = useState('ja-JP')
  const [engine, setEngine] = useState('openai')
  const [batchSize, setBatchSize] = useState(40)
  
  const [generating, setGenerating] = useState(false)
  const [progressLogs, setProgressLogs] = useState([])
  const logsEndRef = useRef(null)

  const apiKeys = config.apiKeys.engines || {}

  useEffect(() => {
    const firstEng = Object.keys(apiKeys).find(k => apiKeys[k]?.apiKey)
    if (firstEng && !engine) setEngine(firstEng)
  }, [apiKeys])

  useEffect(() => {
    if (window.liveTranslatorAPI?.onDictProgress) {
      window.liveTranslatorAPI.onDictProgress((msg) => {
        setProgressLogs(prev => [...prev, { text: msg, id: Date.now() + Math.random() }])
      })
    }
    return () => {
      window.liveTranslatorAPI?.removeDictProgressListeners?.()
    }
  }, [])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [progressLogs])

  const handleGenerate = async () => {
    if (!apiKeys[engine]?.apiKey) {
      alert('Please configure API Key in "AI Key Manager" first.')
      return
    }

    setGenerating(true)
    setProgressLogs([{ text: `🚀 Starting dictionary generation for ${targetApp} (${targetLang})...`, id: Date.now() }])
    
    try {
      const res = await window.liveTranslatorAPI.generateDict({
        app: targetApp,
        lang: targetLang,
        engine,
        batchSize,
        engineConfig: apiKeys[engine],
        appPath: config[targetApp]?.appPath || null
      })

      if (res.ok) {
        setProgressLogs(prev => [...prev, { text: '✨ Dictionary generation completed successfully!', id: Date.now() }])
      } else {
        setProgressLogs(prev => [...prev, { text: `❌ Error: ${res.error}`, id: Date.now() }])
      }
    } catch (e) {
      setProgressLogs(prev => [...prev, { text: `❌ Exception: ${e.message}`, id: Date.now() }])
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-[#1A1C1E] border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-purple-600 opacity-40" />
        
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Dictionary Generator</h3>
            <p className="text-xs font-bold text-white/20 uppercase tracking-[0.2em]">Automated AI Translation Workspace</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
              <Monitor className="w-3.5 h-3.5" />
              Target Application
            </label>
            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
              {[
                { id: 'cursor', label: 'Cursor', icon: '💎' },
                { id: 'claude', label: 'Claude', icon: '🐙' },
                { id: 'both',   label: 'Both',   icon: '⚡' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setTargetApp(item.id)}
                  className={clsx(
                    "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl transition-all duration-300",
                    targetApp === item.id 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" 
                      : "text-white/30 hover:text-white/60 hover:bg-white/5"
                  )}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
              <Globe className="w-3.5 h-3.5" />
              Target Language
            </label>
            <select
              value={targetLang}
              onChange={e => setTargetLang(e.target.value)}
              className="w-full bg-black/40 border border-white/5 hover:border-white/10 rounded-2xl px-5 py-4 text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              {Object.entries(ALL_LANGUAGES).map(([code, name]) => (
                <option key={code} value={code} className="bg-[#1A1C1E]">{name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
              <Cpu className="w-3.5 h-3.5" />
              Translation Engine
            </label>
            <select
              value={engine}
              onChange={e => setEngine(e.target.value)}
              className="w-full bg-black/40 border border-white/5 hover:border-white/10 rounded-2xl px-5 py-4 text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              {['openai', 'anthropic', 'gemini', 'deepl'].map(eng => (
                <option key={eng} value={eng} disabled={!apiKeys[eng]?.apiKey} className="bg-[#1A1C1E]">
                  {eng.toUpperCase()} {!apiKeys[eng]?.apiKey ? '(Not Configured)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
              <Hash className="w-3.5 h-3.5" />
              Batch Size (Concurrency)
            </label>
            <input
              type="number"
              value={batchSize}
              onChange={e => setBatchSize(parseInt(e.target.value) || 40)}
              className="w-full bg-black/40 border border-white/5 hover:border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full mt-12 relative group overflow-hidden py-5 rounded-[1.5rem] transition-all duration-500 hover:shadow-[0_0_50px_rgba(59,130,246,0.3)] disabled:opacity-50"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:scale-105 transition-transform duration-500" />
          <div className="relative flex items-center justify-center gap-3">
            {generating ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <Play className="w-5 h-5 text-white" />
            )}
            <span className="text-sm font-bold text-white uppercase tracking-[0.2em]">Execute Generation Task</span>
          </div>
        </button>
      </div>

      <div className="bg-black/60 backdrop-blur-xl rounded-[2rem] border border-white/5 flex flex-col font-mono text-[11px] overflow-hidden min-h-[300px] shadow-2xl relative">
        <div className="h-10 bg-white/5 border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-white/30 text-[10px] uppercase tracking-widest font-bold">Process Monitoring</span>
          </div>
          <button onClick={() => setProgressLogs([])} className="text-white/20 hover:text-white/50 transition-colors">Clear Logs</button>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto space-y-1.5 custom-scrollbar">
          {progressLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-white/10 italic text-sm">
              Waiting for task initiation...
            </div>
          ) : (
            progressLogs.map((log) => (
              <div key={log.id} className="flex gap-3 items-start group">
                <span className="text-white/10 shrink-0 select-none">[{new Date(log.id).toLocaleTimeString([], { hour12: false })}]</span>
                <span className={clsx(
                  "leading-relaxed transition-colors",
                  log.text.includes('❌') ? 'text-red-400' : 
                  log.text.includes('✅') || log.text.includes('✨') ? 'text-emerald-400' : 
                  'text-blue-300/70 group-hover:text-blue-300'
                )}>
                  {log.text}
                </span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  )
}
