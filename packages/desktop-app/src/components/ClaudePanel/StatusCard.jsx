import { useTranslation } from 'react-i18next';
import { Cpu, Shield, ShieldAlert, CheckCircle2, AlertCircle, FolderOpen } from 'lucide-react';
import { clsx } from 'clsx';

const StatusCard = ({ status, onBrowsePath }) => {
  const { t } = useTranslation();

  if (!status) return (
    <div className="bg-white/5 border border-white/5 rounded-3xl p-6 animate-pulse flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-white/5" />
      <div className="space-y-2">
        <div className="w-32 h-4 bg-white/5 rounded" />
        <div className="w-20 h-3 bg-white/5 rounded" />
      </div>
    </div>
  );

  const { installed, version, isPatched, hasBackup, backupVersion, versionMismatch } = status;

  const renderBackupBadge = () => {
    if (!installed) return null;
    if (isPatched && !hasBackup) {
      return (
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-red-400">已注入但无纯净备份</p>
              <p className="text-[11px] text-red-300/60 mt-0.5">如遇异常请重装 Claude</p>
            </div>
          </div>
        </div>
      );
    }
    if (!hasBackup) {
      return (
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[11px] text-amber-400/60 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            备份将在首次部署时自动创建
          </p>
        </div>
      );
    }
    if (versionMismatch) {
      return (
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[11px] text-amber-400/70 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            备份 v{backupVersion} ≠ 当前 v{version}，建议重新部署
          </p>
        </div>
      );
    }
    return (
      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-[11px] text-emerald-400/60 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          备份已锁定 (v{backupVersion})
        </p>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* App Status */}
      <div className="bg-[#1A1C1E] border border-white/5 rounded-3xl p-6 flex items-start gap-5 relative overflow-hidden group">
        <div className={clsx(
          "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500",
          installed ? "bg-purple-500/10 text-purple-400" : "bg-red-500/10 text-red-400"
        )}>
          {installed ? <Cpu className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
        </div>
        <div className="space-y-1 z-10">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/30">{t('claudeApp', 'Claude Desktop')}</h4>
          <div className="text-lg font-bold text-white">
            {installed ? `v${version}` : t('notDetected', 'Not Detected')}
          </div>
          <p className="text-sm text-white/40">
            {installed ? t('appReadyClaude', '已检测到应用') : t('appMissingClaude', '请安装 Claude Desktop')}
          </p>
          {!installed && onBrowsePath && (
            <button
              onClick={onBrowsePath}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 text-xs font-medium rounded-xl transition-all"
            >
              <FolderOpen className="w-4 h-4" />
              {t('browseApp', 'Browse...')}
            </button>
          )}
        </div>
      </div>

      {/* Patcher + Backup */}
      <div className="bg-[#1A1C1E] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
        <div className="flex items-start gap-5">
          <div className={clsx(
            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500",
            isPatched ? "bg-purple-500/10 text-purple-400" : "bg-white/5 text-white/20"
          )}>
            {isPatched ? <Shield className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
          </div>
          <div className="space-y-1 z-10 flex-1">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/30">{t('patcherStatus', 'Injection Status')}</h4>
            <div className="text-lg font-bold text-white">
              {isPatched ? '已注入' : '未注入'}
            </div>
            <p className="text-sm text-white/40">
              {isPatched ? 'ASAR 注入已激活' : '原始文件未修改'}
            </p>
          </div>
        </div>
        {renderBackupBadge()}
      </div>
    </div>
  );
};

export default StatusCard;
