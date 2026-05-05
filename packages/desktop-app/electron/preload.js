const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('liveTranslatorAPI', {
  // ── Patcher (existing) ────────────────────────────────
  getCursorStatus: () => ipcRenderer.invoke('i18n:getCursorStatus'),
  getClaudeStatus: () => ipcRenderer.invoke('i18n:getClaudeStatus'),
  createBackupCursor: () => ipcRenderer.invoke('cursor:createBackup'),
  createBackupClaude: () => ipcRenderer.invoke('claude:createBackup'),
  installCursor:   (config) => ipcRenderer.invoke('i18n:installCursor', config),
  installClaude:   (config) => ipcRenderer.invoke('i18n:installClaude', config),
  restoreCursor:   () => ipcRenderer.invoke('i18n:restoreCursor'),
  restoreClaude:   () => ipcRenderer.invoke('i18n:restoreClaude'),
  getAvailableLanguages: (app) => ipcRenderer.invoke('i18n:getAvailableLanguages', app),

  // ── Real-time events from Node to React ──────────────
  onProgress:    (cb) => ipcRenderer.on('i18n:progress', (_e, v) => cb(v)),
  onSudoPrompt:  (cb) => ipcRenderer.on('i18n:sudo-prompt', () => cb()),
  removeProgressListeners: () => ipcRenderer.removeAllListeners('i18n:progress'),
  removeSudoListeners:     () => ipcRenderer.removeAllListeners('i18n:sudo-prompt'),

  // ── Phase 5: API Key management ───────────────────────
  saveApiKeys:  (keys) => ipcRenderer.invoke('config:saveApiKeys', keys),
  loadApiKeys:  ()     => ipcRenderer.invoke('config:loadApiKeys'),
  testApiKey:   (opts) => ipcRenderer.invoke('config:testApiKey', opts),

  // ── Phase 5: Dict generation ──────────────────────────
  generateDict: (opts) => ipcRenderer.invoke('dict:generate', opts),
  onDictProgress: (cb) => ipcRenderer.on('dict:progress', (_e, v) => cb(v)),
  removeDictProgressListeners: () => ipcRenderer.removeAllListeners('dict:progress'),

  // ── Phase 6: Full Config & Extensions ──────────────
  loadConfig:    () => ipcRenderer.invoke('config:load'),
  saveConfig:    (config) => ipcRenderer.invoke('config:save', config),
  getCursorExtensions: () => ipcRenderer.invoke('cursor:getInstalledExtensions'),
  getDictStatus: (opts) => ipcRenderer.invoke('dict:status', opts),

  // ── Path browser ──────────────────────────────────────
  browseAppPath: (targetApp) => ipcRenderer.invoke('app:browsePath', targetApp),
  openExternal:  (url)       => ipcRenderer.invoke('app:openExternal', url),

  // ── Auto Updater ────────────────────────────────────
  checkForUpdates:   () => ipcRenderer.invoke('update:check'),
  downloadUpdate:    () => ipcRenderer.invoke('update:download'),
  installUpdate:     () => ipcRenderer.invoke('update:install'),
  getAppVersion:     () => ipcRenderer.invoke('update:getVersion'),

  onUpdateChecking:      (cb) => ipcRenderer.on('update:checking', () => cb()),
  onUpdateAvailable:     (cb) => ipcRenderer.on('update:available', (_e, info) => cb(info)),
  onUpdateNotAvailable:  (cb) => ipcRenderer.on('update:not-available', () => cb()),
  onUpdateProgress:      (cb) => ipcRenderer.on('update:download-progress', (_e, p) => cb(p)),
  onUpdateDownloaded:    (cb) => ipcRenderer.on('update:downloaded', (_e, info) => cb(info)),
  onUpdateError:         (cb) => ipcRenderer.on('update:error', (_e, err) => cb(err)),

  removeUpdateListeners: () => {
    ipcRenderer.removeAllListeners('update:checking');
    ipcRenderer.removeAllListeners('update:available');
    ipcRenderer.removeAllListeners('update:not-available');
    ipcRenderer.removeAllListeners('update:download-progress');
    ipcRenderer.removeAllListeners('update:downloaded');
    ipcRenderer.removeAllListeners('update:error');
  },
});
