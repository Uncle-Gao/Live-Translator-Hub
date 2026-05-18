import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useConfigStore from '../../../store/configStore';
import SkipChipInput from './SkipChipInput';

const CURSOR_DEFAULT_SKIPS = {
  selectors: [
    '.monaco-breadcrumbs',
    '.view-lines.monaco-mouse-cursor-text',
    '.monaco-list-row',
    '.pane-header.expanded',
    '.xterm-link-layer',
    '.conversations',
    '.aislash-editor-input',
    '.composer-file-list-item',
    '.agent-sidebar-cell-content-wrapper',
    '[data-resource-name*="."]',
  ],
  titles: [],
  urls: [],
};

const WorkbenchSkips = () => {
  const { t } = useTranslation();
  const { config, updateCursorSkipRules } = useConfigStore();
  const skip = config.cursor.skip?._cursor_ || {};

  const update = (field, value) => {
    updateCursorSkipRules('_workbench_', { [field]: value });
  };

  const updateDisabled = (field, value) => {
    updateCursorSkipRules('_workbench_', { [`disabled${field[0].toUpperCase()}${field.slice(1)}`]: value });
  };

  const restoreDefaults = () => {
    updateCursorSkipRules('_workbench_', { ...CURSOR_DEFAULT_SKIPS, disabledSelectors: [], disabledTitles: [], disabledUrls: [] });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider">{t('skipRulesMainWindow')}</h4>

      <div className="space-y-2">
        <label className="text-[10px] text-white/20 uppercase tracking-wider">{t('skipRulesCssSelectors')}</label>
        <SkipChipInput
          type="selectors"
          items={Array.isArray(skip.selectors) ? skip.selectors : []}
          onChange={v => update('selectors', v)}
          disabledItems={Array.isArray(skip.disabledSelectors) ? skip.disabledSelectors : []}
          onDisabledItemsChange={v => updateDisabled('selectors', v)}
          placeholder={t('skipRulesPastePlaceholder')}
        />
        <div className="flex justify-end">
          <button
            onClick={restoreDefaults}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-white/20 hover:text-white/50 hover:bg-white/5 rounded-lg transition-all"
            title={t('skipRulesRestoreDefaultTitle')}
          >
            <RotateCcw className="w-3 h-3" />
            {t('skipRulesRestoreDefault')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] text-white/20 uppercase tracking-wider">{t('skipRulesSkipTitles')}</label>
          <SkipChipInput
            type="titles"
            items={Array.isArray(skip.titles) ? skip.titles : []}
            onChange={v => update('titles', v)}
            disabledItems={Array.isArray(skip.disabledTitles) ? skip.disabledTitles : []}
            onDisabledItemsChange={v => updateDisabled('titles', v)}
            placeholder="Output, Terminal..."
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-white/20 uppercase tracking-wider">{t('skipRulesSkipUrls')}</label>
          <SkipChipInput
            type="urls"
            items={Array.isArray(skip.urls) ? skip.urls : []}
            onChange={v => update('urls', v)}
            disabledItems={Array.isArray(skip.disabledUrls) ? skip.disabledUrls : []}
            onDisabledItemsChange={v => updateDisabled('urls', v)}
            placeholder="vscode-extension://..."
          />
        </div>
      </div>
    </div>
  );
};

export default WorkbenchSkips;
