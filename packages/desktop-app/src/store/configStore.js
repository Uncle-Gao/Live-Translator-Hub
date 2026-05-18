import { create } from 'zustand';
import protectionDefaults from '@live-translator/core/src/protection-defaults.json';

const DEFAULT_FEATURES = {
  enableDictionary: true,
  enableNestedDict: true,
  enableRegex: true,
  enableTranslationBridge: true,
  enableLoadingAnimation: true,
  enableFileNameGuard: true,
  enableProtectedTermGuard: true
};

const DEFAULT_PROTECTION = {
  terms: protectionDefaults.terms,
  patterns: protectionDefaults.patterns,
  disabledTerms: [],
  disabledPatterns: []
};

let configPersistTimer = null;

function scheduleConfigPersist(config) {
  if (!window.liveTranslatorAPI?.saveConfig) return;
  if (configPersistTimer) clearTimeout(configPersistTimer);
  configPersistTimer = setTimeout(() => {
    // eslint-disable-next-line no-unused-vars
    const { apiKeys, ...configToSave } = config;
    window.liveTranslatorAPI.saveConfig(configToSave).catch(() => {});
    configPersistTimer = null;
  }, 250);
}

const useConfigStore = create((set, get) => ({
  config: {
    cursor: {
      appPath: '',
      targetLanguage: 'zh-CN',
      activeId: 'none',
      features: { ...DEFAULT_FEATURES },
      skip: {
        _cursor_: {
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
          urls: []
        }
      },
      selectedPlugins: [],
      injectWebview: true,
      cacheVersion: 0,
      skipRules: {
        webview: {
          _global_: { selectors: '', titles: '', urls: '' }
        }
      }
    },
    claude: {
      appPath: '',
      targetLanguage: 'zh-CN',
      activeId: 'none',
      features: { ...DEFAULT_FEATURES },
      skip: {
        _claude_: {
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
          urls: []
        }
      },
      cacheVersion: 0,
      enableThirdPartyInferenceMode: false,
    },
    protection: { ...DEFAULT_PROTECTION },
    apiKeys: {
      engines: {},
      activeId: 'none'
    }
  },
  
  loading: true,
  error: null,

  loadConfig: async () => {
    set({ loading: true });
    try {
      const savedConfig = await window.liveTranslatorAPI.loadConfig();
      const apiKeys = await window.liveTranslatorAPI.loadApiKeys();
      const savedCursor = { ...(savedConfig.cursor || {}) };
      const savedClaude = { ...(savedConfig.claude || {}) };
      const savedProtection = savedConfig.protection
        || savedConfig.cursor?.protection
        || savedConfig.claude?.protection
        || {};
      delete savedCursor.protection;
      delete savedClaude.protection;
      
      set(state => ({
        config: {
          ...state.config,
          ...savedConfig,
          protection: { ...DEFAULT_PROTECTION, ...savedProtection },
          cursor: {
            ...state.config.cursor,
            ...savedCursor,
            features: { ...DEFAULT_FEATURES, ...(savedCursor.features || {}) }
          },
          claude: {
            ...state.config.claude,
            ...savedClaude,
            features: { ...DEFAULT_FEATURES, ...(savedClaude.features || {}) }
          },
          apiKeys: {
            ...state.config.apiKeys,
            ...apiKeys
          }
        },
        loading: false
      }));
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  saveConfig: async (updates = {}) => {
    const currentConfig = get().config;
    // Deep merge updates
    const newConfig = {
      ...currentConfig,
      ...updates
    };
    
    // We don't save apiKeys to config.json, they are handled separately via saveApiKeys
    // eslint-disable-next-line no-unused-vars
    const { apiKeys, ...configToSave } = newConfig;
    
    try {
      await window.liveTranslatorAPI.saveConfig(configToSave);
      set({ config: newConfig });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  updateCursorConfig: (updates) => {
    let nextConfig;
    set(state => ({
      config: (nextConfig = {
        ...state.config,
        cursor: { ...state.config.cursor, ...updates }
      })
    }));
    scheduleConfigPersist(nextConfig);
  },

  updateCursorSkipRules: (path, value) => {
    let nextConfig;
    set(state => {
      const webview = { ...state.config.cursor.skipRules?.webview };
      if (path === '_workbench_') {
        nextConfig = {
          ...state.config,
          cursor: {
            ...state.config.cursor,
            skip: { _cursor_: { ...state.config.cursor.skip._cursor_, ...value } }
          }
        };
        return {
          config: nextConfig
        };
      }
      webview[path] = { ...webview[path], ...value };
      nextConfig = {
        ...state.config,
        cursor: {
          ...state.config.cursor,
          skipRules: { webview }
        }
      };
      return {
        config: nextConfig
      };
    });
    scheduleConfigPersist(nextConfig);
  },

  updateClaudeConfig: (updates) => {
    let nextConfig;
    set(state => ({
      config: (nextConfig = {
        ...state.config,
        claude: { ...state.config.claude, ...updates }
      })
    }));
    scheduleConfigPersist(nextConfig);
  },

  updateProtectionConfig: (updates) => {
    let nextConfig;
    set(state => ({
      config: (nextConfig = {
        ...state.config,
        protection: { ...state.config.protection, ...updates }
      })
    }));
    scheduleConfigPersist(nextConfig);
  },

  updateApiKeys: async (keys) => {
    try {
      await window.liveTranslatorAPI.saveApiKeys(keys);
      set(state => ({
        config: {
          ...state.config,
          apiKeys: keys
        }
      }));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
}));

export default useConfigStore;
