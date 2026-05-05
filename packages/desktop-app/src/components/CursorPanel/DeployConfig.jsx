import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import useConfigStore from '../../store/configStore';
import { ALL_LANGUAGES } from '../../constants';

const DeployConfig = ({ extensions, selectedPluginIds, onTogglePlugin, onRefreshExtensions, isScanning }) => {
  const { t } = useTranslation();
  const { config, updateCursorConfig } = useConfigStore();
  const cursor = config.cursor;
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const engines = config.apiKeys.engines || {};

  return (
    <div className="bg-[#1A1C1E] border border-white/5 rounded-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">{t('deployConfig', '部署配置')}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">{t('targetLang', '目标语言')}</label>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white/80 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer"
            value={cursor.targetLanguage}
            onChange={e => updateCursorConfig({ targetLanguage: e.target.value })}
          >
            {Object.keys(ALL_LANGUAGES).map(code => (
              <option key={code} value={code} className="bg-[#1A1C1E]">{ALL_LANGUAGES[code]}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">{t('runtimeEngine', '运行时引擎')}</label>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white/80 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer"
            value={cursor.activeId}
            onChange={e => {
              const val = e.target.value;
              updateCursorConfig({
                activeId: val,
                ...(val === 'none' ? { features: { ...cursor.features, enableDictionary: true } } : {})
              });
            }}
          >
            <option value="none" className="bg-[#1A1C1E]">{t('engineNone', '无 (仅静态字典)')}</option>
            {Object.keys(engines).map(id => (
              <option key={id} value={id} className="bg-[#1A1C1E]">{engines[id].name || id}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Card-level toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/[0.08] transition-all group">
          <span className="text-sm font-medium text-white/60 group-hover:text-white/90">显示加载动画</span>
          <input
            type="checkbox"
            checked={!!cursor.features.enableLoadingAnimation}
            onChange={e => updateCursorConfig({ features: { ...cursor.features, enableLoadingAnimation: e.target.checked } })}
            className="w-5 h-5 rounded-lg bg-black/40 border-white/10 text-blue-500 focus:ring-blue-500/20"
          />
        </label>
        <label className="flex items-center justify-between p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl cursor-pointer hover:bg-purple-500/10 transition-all group">
          <span className="text-sm font-medium text-purple-300/80 group-hover:text-purple-200">本地化插件 Webview（深度本地化）</span>
          <input
            type="checkbox"
            checked={!!cursor.injectWebview}
            onChange={e => updateCursorConfig({ injectWebview: e.target.checked })}
            className="w-5 h-5 rounded-lg bg-black/40 border-purple-500/30 text-purple-500 focus:ring-purple-500/20"
          />
        </label>
      </div>

      {/* Plugin selector – shown when injectWebview is on */}
      {cursor.injectWebview && (
        <div className="bg-black/20 border border-purple-500/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider text-purple-300/50">
              已安装插件列表（勾选要本地化的插件）
            </label>
            <button
              onClick={onRefreshExtensions}
              disabled={isScanning}
              className="p-1 hover:bg-white/5 rounded-lg transition-all text-white/20 hover:text-white/60 disabled:opacity-50"
              title="刷新插件列表"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {extensions.length === 0 ? (
            <p className="text-[11px] text-white/20 italic">未发现含 Webview 的插件</p>
          ) : (
            <div className="space-y-1.5">
              {extensions.map(ext => {
                const isSelected = selectedPluginIds.includes(ext.id);
                return (
                  <label
                    key={ext.id}
                    className="flex items-center gap-3 p-2 hover:bg-white/[0.04] rounded-xl cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onTogglePlugin(ext.id)}
                      className="w-4 h-4 rounded bg-black/40 border-white/10 text-purple-500"
                    />
                    <span className={`text-xs font-medium flex-1 ${isSelected ? 'text-purple-300' : 'text-white/50'}`}>
                      {ext.displayName || ext.id}
                    </span>
                    <span className="text-[10px] text-white/20 font-mono">v{ext.version}</span>
                    {ext.isPatched && (
                      <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-full font-bold">已注入</span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Advanced Toggle */}
      <div className="pt-2">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-xs font-bold text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest"
        >
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {t('advancedSettings', '高级设置 (Cursor 专有)')}
        </button>

        {showAdvanced && (
          <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* enableDictionary: forced on when engine is "none" */}
              <label className={`flex items-center justify-between p-4 border rounded-2xl transition-all group ${
                cursor.activeId === 'none'
                  ? 'bg-blue-500/5 border-blue-500/20 cursor-not-allowed'
                  : 'bg-white/5 border-white/5 cursor-pointer hover:bg-white/[0.08]'
              }`}>
                <span className="text-sm font-medium text-white/60 group-hover:text-white/90">注入字典资源</span>
                <input
                  type="checkbox"
                  checked={cursor.activeId === 'none' ? true : !!cursor.features.enableDictionary}
                  disabled={cursor.activeId === 'none'}
                  onChange={e => updateCursorConfig({ features: { ...cursor.features, enableDictionary: e.target.checked } })}
                  className="w-5 h-5 rounded-lg bg-black/40 border-white/10 text-blue-500 focus:ring-blue-500/20 disabled:opacity-60"
                />
              </label>
              {Object.entries({
                enableRegex: '启用正则匹配',
                enableTranslationBridge: '跨 Webview 桥接',
                enableNestedDict: '嵌套字典寻址',
              }).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/[0.08] transition-all group">
                  <span className="text-sm font-medium text-white/60 group-hover:text-white/90">{label}</span>
                  <input
                    type="checkbox"
                    checked={!!cursor.features[key]}
                    onChange={e => updateCursorConfig({ features: { ...cursor.features, [key]: e.target.checked } })}
                    className="w-5 h-5 rounded-lg bg-black/40 border-white/10 text-blue-500 focus:ring-blue-500/20"
                  />
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeployConfig;
