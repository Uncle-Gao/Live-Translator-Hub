import { useTranslation } from 'react-i18next';
import { Play, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';

const ActionBar = ({ onDeploy, onRestore, isDeploying, isRestoring, hasBackup }) => {
  const { t } = useTranslation();

  return (
    <div className="flex gap-4">
      <button
        onClick={onDeploy}
        disabled={isDeploying || isRestoring}
        className={clsx(
          "flex-1 relative group overflow-hidden rounded-2xl transition-all duration-300",
          isDeploying ? "cursor-wait opacity-80" : "hover:shadow-[0_0_20px_rgba(147,51,234,0.3)]"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-400 group-hover:scale-105 transition-transform duration-500" />
        <div className="relative flex items-center justify-center gap-3 px-6 py-4">
          {isDeploying ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-5 h-5 text-white" />
          )}
          <span className="text-sm font-bold text-white uppercase tracking-widest">{t('deployNow', '部署本地化')}</span>
        </div>
      </button>

      <button
        onClick={onRestore}
        disabled={isDeploying || isRestoring || !hasBackup}
        title={!hasBackup ? '无备份，无法恢复' : undefined}
        className={clsx(
          "flex-1 relative group overflow-hidden rounded-2xl transition-all duration-300",
          (!hasBackup || isRestoring) ? "opacity-40 cursor-not-allowed" : "hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
        )}
      >
        <div className="absolute inset-0 bg-[#1A1C1E] border border-white/5 group-hover:bg-red-500/5 group-hover:border-red-500/20 transition-all duration-300" />
        <div className="relative flex items-center justify-center gap-3 px-6 py-4">
          {isRestoring ? (
            <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          ) : (
            <RotateCcw className="w-5 h-5 text-red-400" />
          )}
          <span className="text-sm font-bold text-red-400 uppercase tracking-widest">{t('restoreOfficial', '恢复官方原版')}</span>
        </div>
      </button>
    </div>
  );
};

export default ActionBar;
