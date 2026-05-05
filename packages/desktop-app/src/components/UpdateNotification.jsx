import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, RotateCw } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function UpdateNotification({ state, info, progress, onDownload, onInstall, onDismiss }) {
  const { t } = useTranslation();

  const variants = {
    available: {
      bg: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
      icon: Download,
      title: t('updateAvailable', { version: info?.version || '' }),
      btn: t('updateDownloadBtn'),
      action: onDownload,
    },
    downloading: {
      bg: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
      icon: RotateCw,
      title: t('updateDownloading'),
      progress: true,
    },
    downloaded: {
      bg: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
      icon: Download,
      title: t('updateReady'),
      btn: t('updateInstallBtn'),
      action: onInstall,
    },
  };

  const active = variants[state];
  if (!active) return null;

  const Icon = active.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden"
      >
        <div className={cn(
          'mx-8 mt-3 px-4 py-3 rounded-xl border bg-gradient-to-r flex items-center gap-3',
          active.bg
        )}>
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
            state === 'available' ? 'bg-blue-500/20 text-blue-400' :
            state === 'downloading' ? 'bg-purple-500/20 text-purple-400' :
            'bg-emerald-500/20 text-emerald-400'
          )}>
            <Icon className={cn('w-4 h-4', state === 'downloading' && 'animate-spin')} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/90">{active.title}</p>
            {active.progress && progress && (
              <div className="mt-1.5 space-y-1">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-purple-400 rounded-full"
                    animate={{ width: `${Math.round(progress.percent)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-[10px] text-white/40 font-mono">
                  {t('updateProgress', {
                    percent: Math.round(progress.percent),
                    speed: formatBytes(progress.bytesPerSecond) + '/s',
                  })}
                </p>
              </div>
            )}
          </div>

          {active.btn && (
            <button
              onClick={active.action}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
            >
              {active.btn}
            </button>
          )}
          {!active.progress && (
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
