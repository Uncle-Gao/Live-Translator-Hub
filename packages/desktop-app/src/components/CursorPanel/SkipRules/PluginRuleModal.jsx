import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save } from 'lucide-react';
import SkipChipInput from './SkipChipInput';

const PluginRuleModal = ({ plugin, rule, onSave, onClose }) => {
  const { t } = useTranslation();
  const [selectors, setSelectors] = useState(
    Array.isArray(rule?.selectors) ? [...rule.selectors] : []
  );
  const [disabledSelectors, setDisabledSelectors] = useState(
    Array.isArray(rule?.disabledSelectors) ? [...rule.disabledSelectors] : []
  );

  const handleSave = () => {
    onSave({
      selectors,
      disabledSelectors,
      titles: rule?.titles || [],
      disabledTitles: rule?.disabledTitles || [],
      urls: rule?.urls || [],
      disabledUrls: rule?.disabledUrls || [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1A1C1E] border border-white/10 rounded-3xl p-8 w-[480px] max-w-[90vw] shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-white">{t('skipRulesConfigurePlugin')}</h3>
            <p className="text-xs text-white/30 mt-1">{plugin.displayName || plugin.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all text-white/30 hover:text-white/60">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 mb-2">
          <div className="flex justify-between">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">
              {t('skipRulesSkipCssDesc')}
            </label>
          </div>
          <SkipChipInput
            type="selectors"
            items={selectors}
            onChange={setSelectors}
            disabledItems={disabledSelectors}
            onDisabledItemsChange={setDisabledSelectors}
            placeholder={t('skipRulesPastePlaceholder')}
          />
          <p className="text-[10px] text-white/20 italic">{t('skipRulesEmptyMeansAll')}</p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/50 text-sm font-medium rounded-2xl transition-all"
          >
            {t('skipRulesCancel')}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 text-sm font-bold rounded-2xl transition-all"
          >
            <Save className="w-4 h-4" />
            {t('skipRulesSave')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PluginRuleModal;
