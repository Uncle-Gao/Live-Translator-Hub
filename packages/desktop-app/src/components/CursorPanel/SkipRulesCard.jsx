import { useTranslation } from 'react-i18next';
import useConfigStore from '../../store/configStore';
import WorkbenchSkips from './SkipRules/WorkbenchSkips';
import WebviewGlobalSkips from './SkipRules/WebviewGlobalSkips';
import PluginRuleList from './SkipRules/PluginRuleList';

const SkipRulesCard = ({ extensions, selectedPluginIds }) => {
  const { t } = useTranslation();
  const { config } = useConfigStore();
  const cursor = config.cursor;

  return (
    <div className="bg-[#1A1C1E] border border-white/5 rounded-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">{t('skipRulesTitle')}</h3>
      </div>

      <div className="bg-black/20 border border-white/5 rounded-2xl p-4">
        <WorkbenchSkips />
      </div>

      {cursor.injectWebview && (
        <div className="space-y-4">
          <div className="bg-black/20 border border-white/5 rounded-2xl p-4">
            <WebviewGlobalSkips />
          </div>

          {selectedPluginIds.length > 0 && (
            <div className="bg-black/20 border border-white/5 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider">{t('skipRulesSelectedPlugin')}</h4>
              <PluginRuleList
                extensions={extensions}
                selectedIds={selectedPluginIds}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkipRulesCard;
