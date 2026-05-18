import { useTranslation } from 'react-i18next';
import useConfigStore from '../../../store/configStore';
import SkipChipInput from './SkipChipInput';

const WebviewGlobalSkips = () => {
  const { t } = useTranslation();
  const { config, updateCursorSkipRules } = useConfigStore();
  const globalSkip = config.cursor.skipRules?.webview?._global_ || {};

  const update = (field, value) => {
    updateCursorSkipRules('_global_', { [field]: value });
  };

  const updateDisabled = (field, value) => {
    updateCursorSkipRules('_global_', { [`disabled${field[0].toUpperCase()}${field.slice(1)}`]: value });
  };

  const toArray = (v) => (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean) : []);

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider">{t('skipRulesGlobalPlugin')}</h4>

      <div className="space-y-2">
        <label className="text-[10px] text-white/20 uppercase tracking-wider">{t('skipRulesCssSelectors')}</label>
        <SkipChipInput
          type="selectors"
          items={toArray(globalSkip.selectors)}
          onChange={v => update('selectors', v)}
          disabledItems={toArray(globalSkip.disabledSelectors)}
          onDisabledItemsChange={v => updateDisabled('selectors', v)}
          placeholder={t('skipRulesPastePlaceholder')}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] text-white/20 uppercase tracking-wider">{t('skipRulesSkipTitles')}</label>
          <SkipChipInput
            type="titles"
            items={toArray(globalSkip.titles)}
            onChange={v => update('titles', v)}
            disabledItems={toArray(globalSkip.disabledTitles)}
            onDisabledItemsChange={v => updateDisabled('titles', v)}
            placeholder="Output, Terminal..."
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-white/20 uppercase tracking-wider">{t('skipRulesSkipUrls')}</label>
          <SkipChipInput
            type="urls"
            items={toArray(globalSkip.urls)}
            onChange={v => update('urls', v)}
            disabledItems={toArray(globalSkip.disabledUrls)}
            onDisabledItemsChange={v => updateDisabled('urls', v)}
            placeholder="vscode-extension://..."
          />
        </div>
      </div>
    </div>
  );
};

export default WebviewGlobalSkips;
