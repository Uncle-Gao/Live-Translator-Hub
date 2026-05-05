import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, MinusCircle, ArrowRightCircle } from 'lucide-react';
import { clsx } from 'clsx';

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-red-400" />;
    case 'running':
      return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
    case 'skipped':
      return <MinusCircle className="w-4 h-4 text-white/20" />;
    default:
      return <div className="w-3 h-3 rounded-full border border-white/15" />;
  }
};

const MiniProgress = ({ progress }) => {
  if (!progress) return null;
  const pct = Math.min(100, Math.max(0, progress.pct || 0));
  return (
    <div className="mt-1.5 w-full">
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[10px] text-white/30 mt-0.5 tabular-nums">
        {progress.done}/{progress.total}
      </div>
    </div>
  );
};

const StepGroup = ({ label, steps }) => (
  <div className="mb-6">
    <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-3 pl-1">
      {label}
    </div>
    <div className="relative">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const isActive = step.status === 'running';
        return (
          <div key={step.id} className="relative flex gap-3">
            {/* Vertical connector line */}
            {!isLast && (
              <div className="absolute left-[7px] top-5 bottom-0 w-px bg-white/5" />
            )}
            <div className={clsx(
              "relative z-10 flex items-center justify-center w-[15px] h-5 shrink-0",
              isActive && "mt-0"
            )}>
              <StatusIcon status={step.status} />
            </div>
            <div className={clsx(
              "pb-4 flex-1 min-w-0",
              isLast && "pb-0"
            )}>
              <div className={clsx(
                "text-xs font-medium leading-tight",
                step.status === 'error' ? 'text-red-300' :
                step.status === 'success' ? 'text-white/70' :
                step.status === 'running' ? 'text-blue-300' :
                step.status === 'skipped' ? 'text-white/25 line-through' :
                'text-white/30'
              )}>
                {step.label}
              </div>
              {step.detail && (
                <div className="text-[10px] text-white/30 mt-0.5 leading-relaxed">
                  {step.detail}
                </div>
              )}
              <MiniProgress progress={step.progress} />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const DeployProgressModal = ({ isOpen, title, steps, isDone, hasError, onClose }) => {
  const { t } = useTranslation();
  const logsEndRef = useRef(null);
  const now = new Date();
  const defaultTime = now.toLocaleTimeString([], { hour12: false });
  const allLogs = steps.flatMap(s => s.logs).map(l =>
    typeof l === 'string' ? { text: l, time: defaultTime } : l
  );

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allLogs]);

  const dictSteps = steps.filter(s => s.group === 'dict');
  const deploySteps = steps.filter(s => s.group === 'deploy');

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#141618] border border-white/10 rounded-[2rem] w-[820px] max-w-[95vw] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="h-14 border-b border-white/5 flex items-center px-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className={clsx(
                  "w-2.5 h-2.5 rounded-full",
                  isDone ? (hasError ? 'bg-red-500' : 'bg-emerald-500') : 'bg-blue-500 animate-pulse'
                )} />
                <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Left — steps */}
              <div className="w-[38%] border-r border-white/5 p-6 overflow-y-auto custom-scrollbar shrink-0">
                <StepGroup label={t('deployProgressDictPrepare')} steps={dictSteps} />
                <StepGroup label={t('deployProgressDeploy')} steps={deploySteps} />
              </div>

              {/* Right — logs */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="h-9 border-b border-white/5 flex items-center px-5 shrink-0">
                  <span className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em]">
                    {t('deployProgressDetailLog')}
                  </span>
                </div>
                <div className="flex-1 p-5 overflow-y-auto font-mono text-[11px] space-y-1 custom-scrollbar">
                  {allLogs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-white/8 italic text-xs">
                      {t('deployProgressWaiting')}
                    </div>
                  ) : (
                    allLogs.map((log, i) => (
                      <div key={i} className="flex gap-2 items-start group">
                        <span className="text-white/15 shrink-0 select-none tabular-nums">
                          {log.time}
                        </span>
                        <span className={clsx(
                          "leading-relaxed break-all",
                          (log.text || '').includes('❌') || (log.text || '').includes('Error') ? 'text-red-400' :
                          (log.text || '').includes('✅') || (log.text || '').includes('✨') ? 'text-emerald-400' :
                          (log.text || '').includes('⚠️') ? 'text-amber-400' :
                          'text-white/50 group-hover:text-white/70'
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

            {/* Footer */}
            <div className="h-14 border-t border-white/5 flex items-center justify-end px-6 shrink-0">
              {isDone && (
                <div className="flex items-center gap-2 mr-auto">
                  <div className={clsx(
                    "w-2 h-2 rounded-full",
                    hasError ? 'bg-red-500' : 'bg-emerald-500'
                  )} />
                  <span className={clsx(
                    "text-xs font-medium",
                    hasError ? 'text-red-400' : 'text-emerald-400'
                  )}>
                    {hasError ? t('deployProgressDoneWithErrors') : t('deployProgressDone')}
                  </span>
                </div>
              )}
              {!isDone && (
                <div className="flex items-center gap-2 mr-auto">
                  <ArrowRightCircle className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  <span className="text-xs text-white/30">{t('deployProgressInProgress')}</span>
                </div>
              )}
              <button
                disabled={!isDone}
                onClick={onClose}
                className={clsx(
                  "px-6 py-2 rounded-xl text-xs font-bold transition-all",
                  isDone
                    ? "bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    : "bg-white/5 text-white/15 cursor-not-allowed"
                )}
              >
                {t('deployProgressConfirm')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
};

export default DeployProgressModal;
