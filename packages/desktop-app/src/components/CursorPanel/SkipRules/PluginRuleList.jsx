import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import useConfigStore from '../../../store/configStore';
import PluginRuleModal from './PluginRuleModal';

const PluginRuleList = ({ extensions, selectedIds }) => {
  const { t } = useTranslation();
  const { config, updateCursorSkipRules } = useConfigStore();
  const [editingPlugin, setEditingPlugin] = useState(null);

  const webviewRules = config.cursor.skipRules?.webview || {};

  const getPluginIds = (plugin) => [plugin.id, ...(plugin.legacyIds || [])];
  const getPluginRule = (plugin) => getPluginIds(plugin)
    .map(id => webviewRules[id])
    .find(Boolean) || {};

  const selectedPlugins = extensions.filter(ext => getPluginIds(ext).some(id => selectedIds.includes(id)));

  if (selectedPlugins.length === 0) {
    return (
      <p className="text-[11px] text-white/20 italic px-1">
        {t('skipRulesCheckPluginsHint')}
      </p>
    );
  }

  const handleSave = (pluginId, rule) => {
    updateCursorSkipRules(pluginId, rule);
  };

  const handleDelete = (pluginId) => {
    updateCursorSkipRules(pluginId, { selectors: [], titles: [], urls: [] });
  };

  return (
    <>
      <div className="space-y-2">
        {selectedPlugins.map(ext => {
          const rule = getPluginRule(ext);
          const hasSelectors = (rule.selectors || []).length > 0;

          return (
            <div
              key={ext.id}
              className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/5 rounded-2xl"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={clsx(
                  "w-2 h-2 rounded-full shrink-0",
                  hasSelectors ? "bg-purple-400" : "bg-white/10"
                )} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/70 truncate">
                    {ext.displayName || ext.id}
                  </p>
                  {hasSelectors ? (
                    <p className="text-[10px] text-white/30 font-mono truncate">
                      {(rule.selectors || []).slice(0, 2).join(', ')}{(rule.selectors || []).length > 2 ? ' ...' : ''}
                    </p>
                  ) : (
                    <p className="text-[10px] text-white/20 italic">{t('skipRulesNoRules')}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => setEditingPlugin(ext)}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-all text-white/20 hover:text-white/60"
                  title={t('skipRulesEdit')}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(ext.id)}
                  className="p-1.5 hover:bg-red-500/10 rounded-lg transition-all text-white/20 hover:text-red-400"
                  title={t('skipRulesClearRules')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editingPlugin && (
        <PluginRuleModal
          plugin={editingPlugin}
          rule={getPluginRule(editingPlugin)}
          onSave={(rule) => handleSave(editingPlugin.id, rule)}
          onClose={() => setEditingPlugin(null)}
        />
      )}
    </>
  );
};

export default PluginRuleList;
