import { useState, useEffect, useRef } from 'react';
import { FileText, AlertTriangle, CheckCircle2, Key, ExternalLink, Play, Loader2, ChevronDown } from 'lucide-react';
import useConfigStore from '../../store/configStore';

const BATCH_SIZES = [20, 40, 60, 80];

const DictStatus = ({ onGoToApiKeys }) => {
  const { config } = useConfigStore();
  const [dictInfo, setDictInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genEngine, setGenEngine] = useState('');
  const [batchSize, setBatchSize] = useState(40);
  const [progress, setProgress] = useState(null);
  const [genLogs, setGenLogs] = useState([]);
  const logsEndRef = useRef(null);

  const lang = config.cursor.targetLanguage;
  const engines = config.apiKeys.engines || {};
  const activeId = config.apiKeys.activeId;
  const hasEngine = activeId && activeId !== 'none' && engines[activeId]?.apiKey;

  useEffect(() => {
    const firstConfigured = Object.keys(engines).find(k => engines[k]?.apiKey);
    if (firstConfigured) setGenEngine(firstConfigured);
  }, [engines]);

  const checkDict = async () => {
    if (!window.liveTranslatorAPI?.getDictStatus) return;
    setLoading(true);
    try {
      const info = await window.liveTranslatorAPI.getDictStatus({ app: 'cursor', lang });
      setDictInfo(info);
    } catch {
      setDictInfo({ exists: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkDict(); }, [lang]);

  useEffect(() => {
    if (window.liveTranslatorAPI?.onDictProgress) {
      window.liveTranslatorAPI.onDictProgress((msg) => {
        setGenLogs(prev => [...prev, { text: msg, id: Date.now() + Math.random() }]);
        const m = msg.match(/批次\s*(\d+)\/(\d+)/);
        if (m) setProgress({ current: parseInt(m[1]), total: parseInt(m[2]) });
      });
    }
    return () => window.liveTranslatorAPI?.removeDictProgressListeners?.();
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [genLogs]);

  const handleGenerate = async () => {
    if (!engines[genEngine]?.apiKey) return;
    setGenerating(true);
    setGenLogs([{ text: `🚀 开始为 Cursor 生成 ${lang} 字典...`, id: Date.now() }]);
    setProgress(null);
    try {
      const res = await window.liveTranslatorAPI.generateDict({
        app: 'cursor', lang, engine: genEngine, batchSize,
        engineConfig: engines[genEngine],
        appPath: config.cursor.appPath || null
      });
      if (res.ok) {
        setGenLogs(prev => [...prev, { text: '✅ 字典生成完成！', id: Date.now() }]);
        await checkDict();
      } else {
        setGenLogs(prev => [...prev, { text: `❌ 生成失败: ${res.error}`, id: Date.now() }]);
      }
    } catch (e) {
      setGenLogs(prev => [...prev, { text: `❌ 异常: ${e.message}`, id: Date.now() }]);
    } finally {
      setGenerating(false);
      setProgress(null);
    }
  };

  return (
    <div className="bg-[#1A1C1E] border border-white/5 rounded-3xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <FileText className="w-4 h-4 text-white/30" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">字典状态</h3>
        <span className="text-[10px] text-white/20 ml-auto">{lang}</span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-white/30 text-xs">
          <Loader2 className="w-4 h-4 animate-spin" />
          检查字典文件...
        </div>
      ) : dictInfo?.exists ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">dictionary.{lang}.json</span>
            <span className="text-[11px] text-emerald-400/50">{dictInfo.count} 条</span>
          </div>
          <button onClick={checkDict} className="text-[10px] text-white/20 hover:text-white/50 transition-colors">刷新</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">dictionary.{lang}.json 不存在</span>
          </div>

          {/* 内嵌生成向导 */}
          <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-4">
            <p className="text-xs text-white/40">需要先生成字典才能部署</p>

            {!hasEngine ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-amber-400/70">
                  <Key className="w-4 h-4 shrink-0" />
                  <span className="text-xs">尚未配置 AI 引擎密钥</span>
                </div>
                <button
                  onClick={onGoToApiKeys}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 text-[11px] font-bold rounded-xl transition-all"
                >
                  <Key className="w-3 h-3" />
                  前往配置 <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/30">引擎</label>
                    <div className="relative">
                      <select
                        value={genEngine}
                        onChange={e => setGenEngine(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 outline-none appearance-none cursor-pointer"
                      >
                        {Object.keys(engines).filter(k => engines[k]?.apiKey).map(k => (
                          <option key={k} value={k} className="bg-[#1A1C1E]">{k.toUpperCase()}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/30">批次大小</label>
                    <div className="relative">
                      <select
                        value={batchSize}
                        onChange={e => setBatchSize(parseInt(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 outline-none appearance-none cursor-pointer"
                      >
                        {BATCH_SIZES.map(n => (
                          <option key={n} value={n} className="bg-[#1A1C1E]">{n}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                {generating && progress && (
                  <div className="space-y-1">
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-blue-400/60 text-right">
                      {Math.round((progress.current / progress.total) * 100)}%  正在翻译批次 {progress.current}/{progress.total}
                    </p>
                  </div>
                )}

                {/* Generation logs */}
                {genLogs.length > 0 && (
                  <div className="bg-black/40 rounded-xl p-3 max-h-24 overflow-y-auto font-mono text-[10px] space-y-0.5">
                    {genLogs.map(log => (
                      <div key={log.id} className={
                        log.text.includes('❌') ? 'text-red-400' :
                        log.text.includes('✅') ? 'text-emerald-400' : 'text-blue-300/70'
                      }>{log.text}</div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={generating || !genEngine}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {generating ? '生成中...' : '开始生成字典'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DictStatus;
