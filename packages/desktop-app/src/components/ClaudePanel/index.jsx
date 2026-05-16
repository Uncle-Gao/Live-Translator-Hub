import { useState, useEffect, useRef } from 'react';
import { Key, ExternalLink } from 'lucide-react';
import useConfigStore from '../../store/configStore';
import EngineWarningModal from '../EngineWarningModal';
import DeployProgressModal from '../DeployProgressModal';

import StatusCard from './StatusCard';
import DeployConfig from './DeployConfig';
import BlacklistCard from './BlacklistCard';
import ActionBar from './ActionBar';

const PROGRESS_RE = /\[(\d+)\/\d+\]\s+(\d+)\/(\d+)\s+条\s+\((\d+)%/;

const createClaudeSteps = () => [
  { id: 'dict-check',    group: 'dict',   label: '检查字典',       status: 'pending', detail: null, progress: null, logs: [] },
  { id: 'dict-extract',  group: 'dict',   label: '提取源文本',     status: 'pending', detail: null, progress: null, logs: [] },
  { id: 'dict-translate',group: 'dict',   label: 'AI 批量翻译',    status: 'pending', detail: null, progress: null, logs: [] },
  { id: 'patch',         group: 'deploy', label: '注入翻译补丁',    status: 'pending', detail: null, progress: null, logs: [] },
];

const ClaudePanel = ({ status, setShowSudoOverlay, refreshStatus, setActiveTab }) => {
  const { config, updateClaudeConfig, saveConfig } = useConfigStore();
  const [isBusy, setIsBusy] = useState(false);
  const [showEngineWarning, setShowEngineWarning] = useState(false);
  const backupTriggered = useRef(false);

  // Deploy progress modal
  const [steps, setSteps] = useState([]);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const stepsRef = useRef(steps);
  useEffect(() => { stepsRef.current = steps; }, [steps]);

  const setStep = (id, patch) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const appendLog = (id, msg) => {
    const entry = { text: msg, time: new Date().toLocaleTimeString([], { hour12: false }) };
    setSteps(prev => prev.map(s => s.id === id ? { ...s, logs: [...s.logs, entry] } : s));
  };

  // 版本不匹配 → 自动备份当前官方原版（可能需要提权）
  useEffect(() => {
    if (status?.versionMismatch && !backupTriggered.current) {
      backupTriggered.current = true;
      setShowSudoOverlay?.(true);
      window.liveTranslatorAPI?.createBackupClaude?.().then(() => {
        setShowSudoOverlay?.(false);
        refreshStatus?.();
      }).catch(() => {
        setShowSudoOverlay?.(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.versionMismatch]);

  const executeDeploy = async () => {
    setIsBusy(true);

    setSteps(createClaudeSteps());
    setShowDeployModal(true);

    let dictProgressCleanup = null;
    let patcherProgressCleanup = null;
    let currentStep = 'dict-check';

    try {
      const lang = config.claude.targetLanguage;
      const engines = config.apiKeys.engines || {};

      // --- Step 1: Check dictionary ---
      setStep('dict-check', { status: 'running' });
      appendLog('dict-check', `检查 ${lang} 字典...`);

      const dictInfo = await window.liveTranslatorAPI.getDictStatus({ app: 'claude', lang });

      if (dictInfo?.exists) {
        setStep('dict-check', { status: 'success', detail: `已存在 ${dictInfo.count} 条翻译`, logs: [`✅ ${lang} 字典已存在 (${dictInfo.count} 条)`] });
        setStep('dict-extract', { status: 'skipped' });
        setStep('dict-translate', { status: 'skipped' });
      } else {
        setStep('dict-check', { status: 'success', detail: '未找到字典，将自动生成', logs: [`未找到 ${lang} 字典`] });

        const genEngine = Object.keys(engines).find(k => engines[k]?.apiKey);
        if (!genEngine) {
          appendLog('dict-check', `⚠️ ${lang} 字典不存在且无已配置的 AI 引擎，将仅使用运行时翻译`);
        } else {
          setStep('dict-extract', { status: 'running', logs: [`📖 ${lang} 字典不存在，自动生成中...`] });
          currentStep = 'dict-extract';

          const onDictMsg = (msg) => {
            const m = msg.match(PROGRESS_RE);
            if (m) {
              const done = parseInt(m[2], 10);
              const total = parseInt(m[3], 10);
              const pct = parseInt(m[4], 10);

              if (total > 0 && stepsRef.current.find(s => s.id === 'dict-extract')?.status === 'running') {
                setStep('dict-extract', { status: 'success', detail: `提取到 ${total} 个条目`, logs: [`共找到 ${total} 个待翻译条目`] });
                setStep('dict-translate', { status: 'running' });
                currentStep = 'dict-translate';
              }

              if (currentStep === 'dict-translate') {
                setStep('dict-translate', { progress: { done, total, pct } });
              }
            }
            if (currentStep) {
              appendLog(currentStep, msg);
            }
          };
          window.liveTranslatorAPI.onDictProgress?.(onDictMsg);
          dictProgressCleanup = () => window.liveTranslatorAPI.removeDictProgressListeners?.();

          try {
            const genResult = await window.liveTranslatorAPI.generateDict({
              app: 'claude', lang, engine: genEngine, batchSize: 40,
              engineConfig: engines[genEngine],
              appPath: config.claude.appPath || null
            });
            if (!genResult?.ok) throw new Error(genResult?.error || '翻译引擎未返回有效结果');

            setStep('dict-translate', { status: 'success', detail: '翻译完成', logs: [...(stepsRef.current.find(s => s.id === 'dict-translate')?.logs || []), `✅ ${lang} 字典生成完成`] });
          } catch (e) {
            setStep('dict-translate', { status: 'error', detail: e.message, logs: [...(stepsRef.current.find(s => s.id === 'dict-translate')?.logs || []), `❌ 字典生成失败: ${e.message}`] });
          } finally {
            dictProgressCleanup?.();
            dictProgressCleanup = null;
          }
        }
      }

      // --- Deploy phase ---
      currentStep = 'patch';

      const onPatcherMsg = (msg) => {
        if (currentStep) appendLog(currentStep, msg);
      };
      window.liveTranslatorAPI.onProgress?.(onPatcherMsg);
      patcherProgressCleanup = () => window.liveTranslatorAPI.removeProgressListeners?.();

      await saveConfig();
      const deployConfig = {
        ...config.claude,
        engines: config.apiKeys.engines,
        cacheVersion: config.claude.cacheVersion
      };

      setStep('patch', { status: 'running', logs: ['注入翻译补丁...'] });
      await window.liveTranslatorAPI.installClaude(deployConfig);
      setStep('patch', { status: 'success', detail: '补丁注入完成', logs: ['✅ 补丁注入成功'] });

      if (refreshStatus) await refreshStatus();

    } catch (e) {
      if (currentStep) {
        setStep(currentStep, { status: 'error', detail: e.message });
        appendLog(currentStep, `❌ Error: ${e.message}`);
      }
    } finally {
      setIsBusy(false);
      setShowSudoOverlay(false);
      dictProgressCleanup?.();
      patcherProgressCleanup?.();
    }
  };

  const handleDeploy = async () => {
    const activeId = config.claude.activeId;
    const hasEngine = activeId && activeId !== 'none' && config.apiKeys.engines?.[activeId]?.apiKey;
    if (!hasEngine) {
      setShowEngineWarning(true);
      return;
    }
    await executeDeploy();
  };

  const configuredEngines = Object.entries(config.apiKeys.engines || {})
    .filter(([, cfg]) => cfg.apiKey)
    .map(([, cfg]) => cfg.name)
    .filter(Boolean);
  const engineWarningScenario = (() => {
    const activeId = config.claude.activeId;
    if (activeId && activeId !== 'none' && !config.apiKeys.engines?.[activeId]?.apiKey) {
      return 'unconfigured';
    }
    if ((!activeId || activeId === 'none') && configuredEngines.length > 0) {
      return 'noneWithEngines';
    }
    return 'noEngines';
  })();
  const engineWarningName =
    engineWarningScenario === 'unconfigured'
      ? config.apiKeys.engines?.[config.claude.activeId]?.name || config.claude.activeId
      : null;

  const handleBrowsePath = async () => {
    const selectedPath = await window.liveTranslatorAPI.browseAppPath('claude');
    if (selectedPath) {
      updateClaudeConfig({ appPath: selectedPath });
      await saveConfig();
      if (refreshStatus) await refreshStatus();
    }
  };

  const handleRestore = async () => {
    setIsBusy(true);
    try {
      await window.liveTranslatorAPI.restoreClaude();
      if (refreshStatus) await refreshStatus();
    } catch (e) {
      console.error('Restore failed:', e);
    } finally {
      setIsBusy(false);
      setShowSudoOverlay(false);
    }
  };

  const activeEngineId = config.apiKeys.activeId;
  const hasEngine = activeEngineId !== 'none' && config.apiKeys.engines?.[activeEngineId]?.apiKey;

  const hasErrorInSteps = steps.some(s => s.status === 'error');
  const allDone = steps.length > 0 && steps.every(s => s.status !== 'pending' && s.status !== 'running');

  return (
    <div className="space-y-6 pb-20">
      {showEngineWarning && (
        <EngineWarningModal
          scenario={engineWarningScenario}
          engineName={engineWarningName}
          configuredNames={configuredEngines}
          onGoConfig={() => { setShowEngineWarning(false); setActiveTab('apikeys'); }}
          onContinue={() => { setShowEngineWarning(false); executeDeploy(); }}
          onClose={() => setShowEngineWarning(false)}
        />
      )}

      <DeployProgressModal
        isOpen={showDeployModal}
        title="Claude 汉化部署"
        steps={steps}
        isDone={allDone}
        hasError={hasErrorInSteps}
        onClose={() => setShowDeployModal(false)}
      />

      <StatusCard status={status} onBrowsePath={handleBrowsePath} />

      {!hasEngine && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-3xl p-6 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">AI 引擎未配置</h4>
              <p className="text-xs text-purple-400/60">配置 AI 密钥以启用实时翻译功能（仅静态字典时可跳过）。</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('apikeys')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500 text-white text-xs font-bold hover:bg-purple-400 transition-all shadow-lg shadow-purple-500/20"
          >
            前往配置 <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <DeployConfig />

      <BlacklistCard />

      <ActionBar
        onDeploy={handleDeploy}
        onRestore={handleRestore}
        isDeploying={isBusy}
        isRestoring={isBusy}
        hasBackup={status?.hasBackup}
      />
    </div>
  );
};

export default ClaudePanel;
