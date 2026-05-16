import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import useConfigStore from '../../store/configStore';
import { ALL_LANGUAGES } from '../../constants';

const DeployConfig = () => {
  const { t } = useTranslation();
  const { config, updateClaudeConfig } = useConfigStore();
  const claude = config.claude;
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
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white/80 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all cursor-pointer"
            value={claude.targetLanguage}
            onChange={e => updateClaudeConfig({ targetLanguage: e.target.value })}
          >
            {Object.keys(ALL_LANGUAGES).map(code => (
              <option key={code} value={code} className="bg-[#1A1C1E]">{ALL_LANGUAGES[code]}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">{t('runtimeEngine', '运行时引擎')}</label>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white/80 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all cursor-pointer"
            value={claude.activeId}
            onChange={e => {
              const val = e.target.value;
              updateClaudeConfig({
                activeId: val,
                ...(val === 'none' ? { features: { ...claude.features, enableDictionary: true } } : {})
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
          <span className="text-sm font-medium text-white/60 group-hover:text-white/90">{t('showLoadingAnimation', '显示加载动画')}</span>
          <input
            type="checkbox"
            checked={!!claude.features.enableLoadingAnimation}
            onChange={e => updateClaudeConfig({ features: { ...claude.features, enableLoadingAnimation: e.target.checked } })}
            className="w-5 h-5 rounded-lg bg-black/40 border-white/10 text-purple-500 focus:ring-purple-500/20"
          />
        </label>
      </div>

      {/* Advanced Toggle */}
      <div className="pt-2">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-xs font-bold text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest"
        >
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {t('advancedSettings', '高级设置 (Claude 专有)')}
        </button>

        {showAdvanced && (
          <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Feature toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* enableDictionary: forced on when engine is "none" */}
              <label className={`flex items-center justify-between p-4 border rounded-2xl transition-all group ${
                claude.activeId === 'none'
                  ? 'bg-purple-500/5 border-purple-500/20 cursor-not-allowed'
                  : 'bg-white/5 border-white/5 cursor-pointer hover:bg-white/[0.08]'
              }`}>
                <span className="text-sm font-medium text-white/60 group-hover:text-white/90">{t('injectDictionary', '注入字典资源')}</span>
                <input
                  type="checkbox"
                  checked={claude.activeId === 'none' ? true : !!claude.features.enableDictionary}
                  disabled={claude.activeId === 'none'}
                  onChange={e => updateClaudeConfig({ features: { ...claude.features, enableDictionary: e.target.checked } })}
                  className="w-5 h-5 rounded-lg bg-black/40 border-white/10 text-purple-500 focus:ring-purple-500/20 disabled:opacity-60"
                />
              </label>
              <label className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/[0.08] transition-all group">
                <div>
                  <span className="text-sm font-medium text-white/60 group-hover:text-white/90">{t('resetCacheOnDeploy', '清空 AI 翻译缓存（仅一次）')}</span>
                  <p className="text-[10px] text-white/30 mt-0.5">{t('resetCacheDesc', '清除 localStorage 中的 AI 翻译缓存，下次启动时重新翻译')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!claude.cacheVersion}
                  onChange={e => updateClaudeConfig({ cacheVersion: e.target.checked ? Date.now() : 0 })}
                  className="w-5 h-5 rounded-lg bg-black/40 border-white/10 text-purple-500 focus:ring-purple-500/20 shrink-0 ml-3"
                />
              </label>
              <label className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/[0.08] transition-all group">
                <div>
                  <span className="text-sm font-medium text-white/60 group-hover:text-white/90">{t('enableThirdPartyInferenceMode', '在第三方推理模式中启用')}</span>
                  <p className="text-[10px] text-white/30 mt-0.5">{t('enableThirdPartyInferenceModeDesc', '为 Claude 本地/第三方推理模式追加当前翻译 API 域名到 CSP，仅影响 Claude 部署')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!claude.enableThirdPartyInferenceMode}
                  onChange={e => updateClaudeConfig({ enableThirdPartyInferenceMode: e.target.checked })}
                  className="w-5 h-5 rounded-lg bg-black/40 border-white/10 text-purple-500 focus:ring-purple-500/20 shrink-0 ml-3"
                />
              </label>
              {Object.entries({
                enableRegex: t('enableRegex', '启用正则匹配'),
                enableNestedDict: t('enableNestedDict', '嵌套字典寻址'),
                enableTranslationBridge: t('enableTranslationBridge', '跨 Webview 桥接'),
              }).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/[0.08] transition-all group">
                  <span className="text-sm font-medium text-white/60 group-hover:text-white/90">{label}</span>
                  <input
                    type="checkbox"
                    checked={!!claude.features[key]}
                    onChange={e => updateClaudeConfig({ features: { ...claude.features, [key]: e.target.checked } })}
                    className="w-5 h-5 rounded-lg bg-black/40 border-white/10 text-purple-500 focus:ring-purple-500/20"
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
