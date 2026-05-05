import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useConfigStore from '../../store/configStore';
import SkipChipInput from '../CursorPanel/SkipRules/SkipChipInput';

const CLAUDE_DEFAULT_SKIPS = {
  selectors: [
    '.monaco-breadcrumbs',
    '.view-lines',
    '.monaco-list-row',
    '.pane-header',
    '.xterm-link-layer',
    '.conversations',
    '.aislash-editor-input',
    '.composer-file-list-item',
    '.agent-sidebar-cell-content-wrapper',
    '.code-block',
    '.mantine-CodeHighlight-root',
    'pre',
    'code',
  ],
  titles: [],
  urls: [],
};

const BlacklistCard = () => {
  const { t } = useTranslation();
  const { config, updateClaudeConfig } = useConfigStore();
  const claude = config.claude;
  const skip = claude.skip?._claude_ || {};

  const updateSkip = (field, value) => {
    updateClaudeConfig({
      skip: { _claude_: { ...skip, [field]: value } }
    });
  };

  const restoreDefaults = () => {
    updateClaudeConfig({
      skip: { _claude_: { ...CLAUDE_DEFAULT_SKIPS } }
    });
  };

  return (
    <div className="bg-[#1A1C1E] border border-white/5 rounded-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">{t('skipRulesTitle')}</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] text-white/20 uppercase tracking-wider">{t('skipRulesCssSelectors')}</label>
          <SkipChipInput
            type="selectors"
            items={Array.isArray(skip.selectors) ? skip.selectors : []}
            onChange={v => updateSkip('selectors', v)}
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
              onChange={v => updateSkip('titles', v)}
              placeholder="Settings, Welcome..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-white/20 uppercase tracking-wider">{t('skipRulesSkipUrls')}</label>
            <SkipChipInput
              type="urls"
              items={Array.isArray(skip.urls) ? skip.urls : []}
              onChange={v => updateSkip('urls', v)}
              placeholder="vscode-extension://..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlacklistCard;
