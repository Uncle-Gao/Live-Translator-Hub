import { create } from 'zustand';

const useConfigStore = create((set, get) => ({
  config: {
    cursor: {
      appPath: '',
      targetLanguage: 'zh-CN',
      activeId: 'none',
      features: {
        enableDictionary: true,
        enableNestedDict: true,
        enableRegex: true,
        enableTranslationBridge: true,
        enableLoadingAnimation: true
      },
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
      features: {
        enableDictionary: true,
        enableNestedDict: true,
        enableRegex: true,
        enableTranslationBridge: true,
        enableLoadingAnimation: true
      },
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
      
      set(state => ({
        config: {
          ...state.config,
          ...savedConfig,
          cursor: { ...state.config.cursor, ...(savedConfig.cursor || {}) },
          claude: { ...state.config.claude, ...(savedConfig.claude || {}) },
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
    set(state => ({
      config: {
        ...state.config,
        cursor: { ...state.config.cursor, ...updates }
      }
    }));
  },

  updateCursorSkipRules: (path, value) => {
    set(state => {
      const webview = { ...state.config.cursor.skipRules?.webview };
      if (path === '_workbench_') {
        return {
          config: {
            ...state.config,
            cursor: {
              ...state.config.cursor,
              skip: { _cursor_: { ...state.config.cursor.skip._cursor_, ...value } }
            }
          }
        };
      }
      webview[path] = { ...webview[path], ...value };
      return {
        config: {
          ...state.config,
          cursor: {
            ...state.config.cursor,
            skipRules: { webview }
          }
        }
      };
    });
  },

  updateClaudeConfig: (updates) => {
    set(state => ({
      config: {
        ...state.config,
        claude: { ...state.config.claude, ...updates }
      }
    }));
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
