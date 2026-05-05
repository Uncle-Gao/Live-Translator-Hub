import { useTranslation } from 'react-i18next';
import { Shield, ShieldAlert, CheckCircle2, AlertCircle, PackagePlus, Trash2, FolderOpen } from 'lucide-react';
import { clsx } from 'clsx';

const StatusCard = ({ status, onCreateBackup, onDeleteOldBackup, isBackingUp, onBrowsePath }) => {
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

  const renderBackupStatus = () => {
    if (!installed) return null;

    if (isPatched && !hasBackup) {
      // 情形四：已注入但无备份（危险）
      return (
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-red-400">已注入但找不到备份文件！</p>
              <p className="text-[11px] text-red-300/60 mt-0.5">无法安全恢复，建议重新安装 Cursor 或提供原始文件</p>
            </div>
          </div>
        </div>
      );
    }

    if (!hasBackup) {
      // 情形一：首次，无备份
      return (
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-400/80">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-xs">主程序 未备份</span>
            </div>
            <button
              onClick={onCreateBackup}
              disabled={isBackingUp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 text-[11px] font-bold rounded-xl transition-all disabled:opacity-50"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              {isBackingUp ? '备份中...' : '立即创建备份'}
            </button>
          </div>
        </div>
      );
    }

    if (hasBackup && versionMismatch) {
      // 情形三：备份版本不匹配
      return (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
          <div className="flex items-start gap-2 text-amber-400/80">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs">备份版本 v{backupVersion} ≠ 当前 v{version}</p>
              <p className="text-[11px] text-white/30 mt-0.5">旧备份已无法用于恢复，建议重新备份后再部署</p>
            </div>
          </div>
          <button
            onClick={onDeleteOldBackup}
            disabled={isBackingUp}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 text-[11px] font-bold rounded-xl transition-all disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isBackingUp ? '备份中...' : '删除旧备份并重新备份'}
          </button>
        </div>
      );
    }

    // 情形二：已备份且版本匹配
    return (
      <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5">
        {['主程序', 'HTML'].map((_label, i) => (
          <div key={i} className="flex items-center gap-2 text-emerald-400/70">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px]">{i === 0 ? `主程序  workbench.js.${backupVersion}.bak` : `HTML  workbench.html.${backupVersion}.bak`}  <span className="text-emerald-400/40">(匹配当前版本)</span></span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* App Status */}
      <div className="bg-[#1A1C1E] border border-white/5 rounded-3xl p-6 flex items-start gap-5 relative overflow-hidden group">
        <div className={clsx(
          "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500",
          installed ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
        )}>
          {installed ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
        </div>
        <div className="space-y-1 z-10 flex-1">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/30">{t('cursorApp', 'Cursor Application')}</h4>
          <div className="text-lg font-bold text-white">
            {installed ? `v${version}` : t('notDetected', 'Not Detected')}
          </div>
          <p className="text-sm text-white/40">
            {installed ? t('appReady', 'Application found') : t('appMissing', 'Please install Cursor')}
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

      {/* Patcher + Backup Status */}
      <div className="bg-[#1A1C1E] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
        <div className="flex items-start gap-5">
          <div className={clsx(
            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500",
            isPatched ? "bg-blue-500/10 text-blue-400" : "bg-white/5 text-white/20"
          )}>
            {isPatched ? <Shield className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
          </div>
          <div className="space-y-1 z-10 flex-1">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/30">{t('patcherStatus', 'Injection Status')}</h4>
            <div className="text-lg font-bold text-white">
              {isPatched ? t('patched', '已注入') : t('unpatched', '未注入')}
            </div>
            <p className="text-sm text-white/40">
              {isPatched ? t('patchedDesc', '翻译引擎已激活') : t('unpatchedDesc', '尚未注入翻译')}
            </p>
          </div>
        </div>
        {renderBackupStatus()}
      </div>
    </div>
  );
};

export default StatusCard;
