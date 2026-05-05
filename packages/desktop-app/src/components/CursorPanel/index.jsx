import { useState, useEffect, useRef } from 'react';
import { Key, ExternalLink, PackagePlus } from 'lucide-react';
import useConfigStore from '../../store/configStore';
import EngineWarningModal from '../EngineWarningModal';
import DeployProgressModal from '../DeployProgressModal';

import StatusCard from './StatusCard';
import DeployConfig from './DeployConfig';
import SkipRulesCard from './SkipRulesCard';
import ActionBar from './ActionBar';

const PROGRESS_RE = /\[(\d+)\/\d+\]\s+(\d+)\/(\d+)\s+条\s+\((\d+)%/;

const createCursorSteps = () => [
  { id: 'dict-check',    group: 'dict',   label: '检查字典',       status: 'pending', detail: null, progress: null, logs: [] },
  { id: 'dict-extract',  group: 'dict',   label: '提取源文本',     status: 'pending', detail: null, progress: null, logs: [] },
  { id: 'dict-translate',group: 'dict',   label: 'AI 批量翻译',    status: 'pending', detail: null, progress: null, logs: [] },
  { id: 'backup',        group: 'deploy', label: '创建版本备份',    status: 'pending', detail: null, progress: null, logs: [] },
  { id: 'patch',         group: 'deploy', label: '注入翻译补丁',    status: 'pending', detail: null, progress: null, logs: [] },
];

const BackupConfirmModal = ({ onConfirmBackupAndDeploy, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
    <div className="bg-[#1A1C1E] border border-white/10 rounded-3xl p-8 w-[440px] max-w-[90vw] shadow-2xl">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
          <PackagePlus className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">首次部署需要先创建备份</h3>
          <p className="text-sm text-white/40 mt-1 leading-relaxed">
            是否立即备份并继续部署？备份文件将用于日后恢复官方原版。
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/50 text-sm font-medium rounded-2xl transition-all"
        >
          取消
        </button>
        <button
          onClick={onConfirmBackupAndDeploy}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 text-sm font-bold rounded-2xl transition-all"
        >
          <PackagePlus className="w-4 h-4" />
          备份并继续部署
        </button>
      </div>
    </div>
  </div>
);

const CursorPanel = ({ status, setShowSudoOverlay, refreshStatus, setActiveTab }) => {
  const { config, updateCursorConfig, saveConfig } = useConfigStore();
  const [extensions, setExtensions] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [showBackupConfirm, setShowBackupConfirm] = useState(false);
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

  const fetchExtensions = async () => {
    if (!window.liveTranslatorAPI?.getCursorExtensions) return;
    setIsScanning(true);
    try {
      const exts = await window.liveTranslatorAPI.getCursorExtensions();
      setExtensions(exts);
    } catch (e) {
      console.error('Failed to scan extensions', e);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => { fetchExtensions(); }, []);

  // 版本不匹配 → 自动备份当前官方原版
  useEffect(() => {
    if (status?.versionMismatch && !backupTriggered.current) {
      backupTriggered.current = true;
      window.liveTranslatorAPI?.createBackupCursor?.().then(() => refreshStatus?.());
    }
  }, [status?.versionMismatch]);

  const executeDeploy = async () => {
    setIsBusy(true);

    const initialSteps = createCursorSteps();
    setSteps(initialSteps);
    setShowDeployModal(true);

    // Track local progress listeners
    let dictProgressCleanup = null;
    let patcherProgressCleanup = null;
    let currentStep = 'dict-check';

    try {
      const lang = config.cursor.targetLanguage;
      const engines = config.apiKeys.engines || {};

      // --- Step 1: Check dictionary ---
      setStep('dict-check', { status: 'running' });
      appendLog('dict-check', `检查 ${lang} 字典...`);

      const dictInfo = await window.liveTranslatorAPI.getDictStatus({ app: 'cursor', lang });

      const needGenerate = !dictInfo?.exists || dictInfo?.fallback;
      if (needGenerate) {
        const genEngine = Object.keys(engines).find(k => engines[k]?.apiKey);
        if (!genEngine) {
          if (dictInfo?.fallback) {
            setStep('dict-check', { status: 'success', detail: '使用内置字典', logs: [`⚠️ 无 AI 引擎，将使用内置字典`] });
          } else {
            setStep('dict-check', { status: 'success', detail: '无可用字典', logs: [`⚠️ ${lang} 字典不存在且无已配置的 AI 引擎，将仅使用运行时翻译`] });
          }
          setStep('dict-extract', { status: 'skipped' });
          setStep('dict-translate', { status: 'skipped' });
        } else {
          setStep('dict-check', { status: 'success', detail: dictInfo?.fallback ? '仅有内置字典，自动生成目标语言版本' : '未找到字典，将自动生成', logs: [`未找到 ${lang} 字典，自动生成中...`] });

          // --- Step 2: Extract & translate ---
          setStep('dict-extract', { status: 'running' });
          currentStep = 'dict-extract';

          // Register dict:progress listener
          const onDictMsg = (msg) => {
            const m = msg.match(PROGRESS_RE);
            if (m) {
              const done = parseInt(m[2], 10);
              const total = parseInt(m[3], 10);
              const pct = parseInt(m[4], 10);

              // First progress message with total → switch to translate step
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
              app: 'cursor', lang, engine: genEngine, batchSize: 40,
              engineConfig: engines[genEngine],
              appPath: config.cursor.appPath || null
            });
            if (!genResult?.ok) throw new Error(genResult?.error || '翻译引擎未返回有效结果');

            setStep('dict-translate', { status: 'success', detail: '翻译完成', logs: [...(stepsRef.current.find(s => s.id === 'dict-translate')?.logs || []), `✅ ${lang} 字典生成完成`] });
            appendLog('dict-extract', `✅ ${lang} 字典生成完成`);
          } catch (_err) {
            setStep('dict-translate', { status: 'error', detail: _err.message, logs: [...(stepsRef.current.find(s => s.id === 'dict-translate')?.logs || []), `❌ 字典生成失败: ${_err.message}`] });
          } finally {
            dictProgressCleanup?.();
            dictProgressCleanup = null;
          }
        }
      } else {
        setStep('dict-check', { status: 'success', detail: `已存在 ${dictInfo.count} 条翻译`, logs: [`✅ ${lang} 字典已存在 (${dictInfo.count} 条)`] });
        setStep('dict-extract', { status: 'skipped' });
        setStep('dict-translate', { status: 'skipped' });
      }

      // --- Deploy phase ---
      currentStep = 'backup';

      // Register patcher progress listener
      const onPatcherMsg = (msg) => {
        if (currentStep) appendLog(currentStep, msg);
      };
      window.liveTranslatorAPI.onProgress?.(onPatcherMsg);
      patcherProgressCleanup = () => window.liveTranslatorAPI.removeProgressListeners?.();

      const deployConfig = {
        ...config.cursor,
        engines: config.apiKeys.engines,
        skipRules: config.cursor.skipRules,
        resetCache: true
      };
      await saveConfig();

      // --- Step 4: Backup (if needed) ---
      if (status?.hasBackup) {
        setStep('backup', { status: 'success', detail: '已存在备份', logs: ['备份已存在，跳过'] });
      } else {
        setStep('backup', { status: 'running', logs: ['创建版本备份...'] });
        try {
          await window.liveTranslatorAPI.createBackupCursor();
          setStep('backup', { status: 'success', detail: '备份完成', logs: ['✅ 备份创建成功'] });
        } catch (e) {
          setStep('backup', { status: 'error', detail: e.message, logs: [`⚠️ 备份失败: ${e.message}，继续部署...`] });
        }
      }

      // --- Step 5: Patch ---
      setStep('patch', { status: 'running', logs: ['注入翻译补丁...'] });
      currentStep = 'patch';
      await window.liveTranslatorAPI.installCursor(deployConfig);
      setStep('patch', { status: 'success', detail: '补丁注入完成', logs: ['✅ 补丁注入成功'] });

      if (refreshStatus) await refreshStatus();
      await fetchExtensions();

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
    const activeId = config.cursor.activeId;
    const hasEngine = activeId && activeId !== 'none' && config.apiKeys.engines?.[activeId]?.apiKey;
    if (!hasEngine) {
      setShowEngineWarning(true);
      return;
    }
    if (!status?.hasBackup && !status?.versionMismatch) {
      setShowBackupConfirm(true);
      return;
    }
    await executeDeploy();
  };

  const configuredEngines = Object.entries(config.apiKeys.engines || {})
    .filter(([, cfg]) => cfg.apiKey)
    .map(([, cfg]) => cfg.name)
    .filter(Boolean);
  const engineWarningScenario = (() => {
    const activeId = config.cursor.activeId;
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
      ? config.apiKeys.engines?.[config.cursor.activeId]?.name || config.cursor.activeId
      : null;

  const handleConfirmBackupAndDeploy = async () => {
    setShowBackupConfirm(false);
    setIsBackingUp(true);
    try {
      await window.liveTranslatorAPI.createBackupCursor();
      if (refreshStatus) await refreshStatus();
    } catch (e) {
      // errors shown in modal
    } finally {
      setIsBackingUp(false);
    }
    await executeDeploy();
  };

  const handleRestore = async () => {
    setIsBusy(true);
    try {
      await window.liveTranslatorAPI.restoreCursor();
      if (refreshStatus) await refreshStatus();
      await fetchExtensions();
    } catch (e) {
      console.error('Restore failed:', e);
    } finally {
      setIsBusy(false);
      setShowSudoOverlay(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    try {
      await window.liveTranslatorAPI.createBackupCursor();
      if (refreshStatus) await refreshStatus();
    } catch (e) {
      console.error('Backup failed:', e);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDeleteOldBackup = async () => {
    setIsBackingUp(true);
    try {
      await window.liveTranslatorAPI.createBackupCursor();
      if (refreshStatus) await refreshStatus();
    } catch (e) {
      console.error('Re-backup failed:', e);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleBrowsePath = async () => {
    const selectedPath = await window.liveTranslatorAPI.browseAppPath('cursor');
    if (selectedPath) {
      updateCursorConfig({ appPath: selectedPath });
      await saveConfig();
      if (refreshStatus) await refreshStatus();
    }
  };

  const handleTogglePlugin = (id) => {
    const current = config.cursor.selectedPlugins || [];
    const next = current.includes(id)
      ? current.filter(i => i !== id)
      : [...current, id];
    updateCursorConfig({ selectedPlugins: next });
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
          onContinue={() => {
            setShowEngineWarning(false);
            if (!status?.hasBackup && !status?.versionMismatch) {
              setShowBackupConfirm(true);
            } else {
              executeDeploy();
            }
          }}
          onClose={() => setShowEngineWarning(false)}
        />
      )}
      {showBackupConfirm && (
        <BackupConfirmModal
          onConfirmBackupAndDeploy={handleConfirmBackupAndDeploy}
          onCancel={() => setShowBackupConfirm(false)}
        />
      )}

      <DeployProgressModal
        isOpen={showDeployModal}
        title="Cursor 汉化部署"
        steps={steps}
        isDone={allDone}
        hasError={hasErrorInSteps}
        onClose={() => setShowDeployModal(false)}
      />

      <StatusCard
        status={status}
        onCreateBackup={handleCreateBackup}
        onDeleteOldBackup={handleDeleteOldBackup}
        isBackingUp={isBackingUp}
        onBrowsePath={handleBrowsePath}
      />

      {!hasEngine && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">AI 引擎未配置</h4>
              <p className="text-xs text-blue-400/60">配置 AI 密钥以启用实时翻译功能（部署仅用静态字典时可跳过）。</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('apikeys')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20"
          >
            前往配置 <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <DeployConfig
        extensions={extensions}
        selectedPluginIds={config.cursor.selectedPlugins || []}
        onTogglePlugin={handleTogglePlugin}
        onRefreshExtensions={fetchExtensions}
        isScanning={isScanning}
      />

      <SkipRulesCard
        extensions={extensions}
        selectedPluginIds={config.cursor.selectedPlugins || []}
      />

      <ActionBar
        onDeploy={handleDeploy}
        onRestore={handleRestore}
        isDeploying={isBusy || isBackingUp}
        isRestoring={isBusy}
        hasBackup={status?.hasBackup}
      />
    </div>
  );
};

export default CursorPanel;
