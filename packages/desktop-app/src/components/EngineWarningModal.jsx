import { Sparkles, ExternalLink, X } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';

const EngineWarningModal = ({ engineName, scenario, configuredNames, onGoConfig, onContinue, onClose }) => {
  const { t } = useTranslation();

  const emStrong = <em className="text-amber-400/80 not-italic" />;
  const highlight = <span className="text-red-400/80" />;

  const descriptionKey = {
    noEngines: 'engineWarningNoEngines',
    noneWithEngines: 'engineWarningNoneWithEngines',
    unconfigured: 'engineWarningUnconfigured',
  }[scenario] || 'engineWarningNoEngines';

  const interpolation = {
    ...(scenario === 'noneWithEngines' && { names: configuredNames?.join('、') }),
    ...(scenario === 'unconfigured' && { name: engineName }),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative bg-[#1A1C1E] border border-white/10 rounded-3xl p-8 w-[500px] max-w-[90vw] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{t('engineWarningTitle')}</h3>
            <p className="text-sm text-white/40 mt-2 leading-relaxed">
              <Trans
                i18nKey={descriptionKey}
                values={interpolation}
                components={{ emStrong, highlight }}
              />
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onContinue}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/50 text-sm font-medium rounded-2xl transition-all"
          >
            {t('engineWarningDeployAnyway')}
          </button>
          <button
            onClick={onGoConfig}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 text-sm font-bold rounded-2xl transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            {t('engineWarningGoConfig')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EngineWarningModal;
