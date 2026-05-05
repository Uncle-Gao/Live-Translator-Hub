const { app, BrowserWindow, ipcMain, safeStorage, dialog, nativeTheme, shell, Menu } = require('electron');
const path = require('path');
const fs   = require('fs');

app.setName('Live Translator Hub');

let autoUpdater = null;
try { ({ autoUpdater } = require('electron-updater')); } catch { /* dev mode without package */ }

// Fix: macOS 13 + Electron 34 AppKit state-restoration crash (NSPersistentUIRequiresSecureCoding)
app.commandLine.appendSwitch('disable-features', 'RestoredWindowsInformer');
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling');
app.commandLine.appendSwitch('disable-features', 'HardwareVideoDecoder');

// ─── Config paths ────────────────────────────────────────────────────────────
const CONFIG_DIR      = path.join(app.getPath('home'), '.live_translator_hub');
const API_KEYS_PATH   = path.join(CONFIG_DIR, 'api_keys.enc');
const CONFIG_FILE_PATH = path.join(CONFIG_DIR, 'config.json');

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8'));
    }
  } catch (e) {}
  return {};
}

// ─── API Key helpers (safeStorage) ──────────────────────────────────────────
function saveApiKeys(keys) {
  ensureConfigDir();
  if (!safeStorage.isEncryptionAvailable()) {
    fs.writeFileSync(API_KEYS_PATH + '.plain', JSON.stringify(keys, null, 2), { mode: 0o600 });
    return;
  }
  const encrypted = safeStorage.encryptString(JSON.stringify(keys));
  fs.writeFileSync(API_KEYS_PATH, encrypted, { mode: 0o600 });
}

function loadApiKeys() {
  ensureConfigDir();
  try {
    if (fs.existsSync(API_KEYS_PATH) && safeStorage.isEncryptionAvailable()) {
      const encrypted = fs.readFileSync(API_KEYS_PATH);
      return JSON.parse(safeStorage.decryptString(encrypted));
    }
    const plainPath = API_KEYS_PATH + '.plain';
    if (fs.existsSync(plainPath)) {
      return JSON.parse(fs.readFileSync(plainPath, 'utf8'));
    }
  } catch (e) {}
  return {};
}

// ─── Legacy config migration ─────────────────────────────────────────────────
const OLD_CURSOR_DIR  = path.join(app.getPath('home'), '.cursor_live_translator');
const OLD_CLAUDE_DIR  = path.join(app.getPath('home'), '.claude_live_translator');
const OLD_CURSOR_CFG  = path.join(OLD_CURSOR_DIR, 'config.json');
const OLD_CLAUDE_CFG  = path.join(OLD_CLAUDE_DIR, 'config.json');

function migrateFromLegacy() {
  if (fs.existsSync(CONFIG_FILE_PATH) && fs.existsSync(API_KEYS_PATH)) return; // already migrated

  const oldCursor = fs.existsSync(OLD_CURSOR_CFG) ? safeReadJSON(OLD_CURSOR_CFG) : null;
  const oldClaude = fs.existsSync(OLD_CLAUDE_CFG) ? safeReadJSON(OLD_CLAUDE_CFG) : null;
  if (!oldCursor && !oldClaude) return;

  console.log('[migrate] Found legacy configs, migrating...');
  ensureConfigDir();

  // --- API Keys ---
  const cursorEngines = oldCursor?.engines || {};
  const claudeEngines = oldClaude?.engines || {};
  const mergedEngines = { ...claudeEngines, ...cursorEngines }; // cursor wins
  const activeId = oldCursor?.activeId || oldClaude?.activeId || 'none';

  if (!fs.existsSync(API_KEYS_PATH)) {
    saveApiKeys({ activeId, engines: mergedEngines });
  }

  // --- Main config ---
  const newCfg = loadConfig(); // may be partial from previous runs

  const defaultFeatures = {
    enableDictionary: true,
    enableNestedDict: true,
    enableRegex: true,
    enableTranslationBridge: true,
    enableLoadingAnimation: true,
  };

  if (oldCursor) {
    newCfg.cursor = newCfg.cursor || {};
    newCfg.cursor.features = newCfg.cursor.features || { ...defaultFeatures };
    newCfg.cursor.targetLanguage = newCfg.cursor.targetLanguage || 'zh-CN';
    // cursor.skip._cursor_
    if (oldCursor.skip?._cursor_) {
      newCfg.cursor.skip = newCfg.cursor.skip || {};
      newCfg.cursor.skip._cursor_ = oldCursor.skip._cursor_;
    }
    // cursor.skip.{pluginKey} → cursor.skipRules.webview.{pluginKey}
    if (oldCursor.skip) {
      newCfg.cursor.skipRules = newCfg.cursor.skipRules || { webview: {} };
      for (const [key, val] of Object.entries(oldCursor.skip)) {
        if (key === '_cursor_') continue;
        newCfg.cursor.skipRules.webview[key] = val;
      }
    }
  }

  if (oldClaude) {
    newCfg.claude = newCfg.claude || {};
    newCfg.claude.features = newCfg.claude.features || { ...defaultFeatures };
    newCfg.claude.targetLanguage = newCfg.claude.targetLanguage || 'zh-CN';
    if (oldClaude.skip) {
      newCfg.claude.skip = { _claude_: oldClaude.skip };
    }
  }

  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(newCfg, null, 2), 'utf8');

  // --- Cleanup old dirs ---
  deleteDir(OLD_CURSOR_DIR);
  deleteDir(OLD_CLAUDE_DIR);

  console.log('[migrate] Done. Old configs migrated and cleaned up.');
}

function safeReadJSON(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch (e) { return null; }
}

function deleteDir(dir) {
  try { if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
}

// ─── Menu ─────────────────────────────────────────────────────────────────────
function buildMenu() {
  const template = [
    {
      label: app.getName(),
      submenu: [
        { label: '关于 Live Translator Hub', role: 'about' },
        { type: 'separator' },
        { label: '隐藏', role: 'hide', accelerator: 'Command+H' },
        { type: 'separator' },
        { label: '退出', role: 'quit', accelerator: 'Command+Q' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo', accelerator: 'Command+Z' },
        { label: '重做', role: 'redo', accelerator: 'Shift+Command+Z' },
        { type: 'separator' },
        { label: '剪切', role: 'cut', accelerator: 'Command+X' },
        { label: '复制', role: 'copy', accelerator: 'Command+C' },
        { label: '粘贴', role: 'paste', accelerator: 'Command+V' },
        { label: '全选', role: 'selectAll', accelerator: 'Command+A' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── Window ──────────────────────────────────────────────────────────────────
let mainWindow;

function createWindow() {
  const isMac = process.platform === 'darwin';

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 1000,
    minHeight: 640,
    icon: path.join(__dirname, '../build/icon-mac.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    ...(isMac && { titleBarStyle: 'hidden', trafficLightPosition: { x: 16, y: 20 } }),
    ...(!isMac && { autoHideMenuBar: true }),
    backgroundColor: '#0B0D10',
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// ─── Auto Updater ─────────────────────────────────────────────────────────────
function setupAutoUpdater() {
  if (!autoUpdater || process.env.VITE_DEV_SERVER_URL) return;

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'Uncle-Gao',
    repo: 'Live-Translator-Hub',
    releaseType: 'release',
  });

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;

  autoUpdater.on('checking-for-update', () => {
    if (mainWindow) mainWindow.webContents.send('update:checking');
  });

  autoUpdater.on('update-available', (info) => {
    if (mainWindow) mainWindow.webContents.send('update:available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
    });
  });

  autoUpdater.on('update-not-available', () => {
    if (mainWindow) mainWindow.webContents.send('update:not-available');
  });

  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow) mainWindow.webContents.send('update:download-progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond,
    });
  });

  autoUpdater.on('update-downloaded', () => {
    if (mainWindow) mainWindow.webContents.send('update:downloaded');
  });

  autoUpdater.on('error', (error) => {
    console.error('[autoUpdater]', error);
    if (mainWindow) mainWindow.webContents.send('update:error', {
      message: error.message,
      code: error.code,
    });
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[autoUpdater] checkForUpdates failed:', err.message);
    });
  }, 5000);
}

// ─── Lifecycle & IPC ────────────────────────────────────────────────────────
let cursor, claude, DictGenerator;

app.whenReady().then(() => {
  nativeTheme.themeSource = 'dark';
  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, '../build/icon-mac.png'));
    buildMenu();
  }
  migrateFromLegacy();

  // Delay loading patcher/generator logic to ensure Electron is fully stable
  const { CursorPatcher } = require('@live-translator/patcher-cursor');
  const { ClaudePatcher } = require('@live-translator/patcher-claude');
  const DG = require('@live-translator/dict-generator').DictGenerator;
  
  cursor = new CursorPatcher();
  claude = new ClaudePatcher();
  DictGenerator = DG;

  createWindow();
  setupAutoUpdater();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('i18n:getCursorStatus', async () => {
    const cfg = loadConfig();
    return cursor ? await cursor.detectStatus(cfg.cursor?.appPath || null) : { installed: false };
  });
ipcMain.handle('i18n:getClaudeStatus', async () => {
    const cfg = loadConfig();
    return claude ? await claude.detectStatus(cfg.claude?.appPath || null) : { installed: false };
  });

ipcMain.handle('i18n:getAvailableLanguages', async (_, targetApp) => {
  const langs = new Set(['zh-CN']);
  try {
    if (targetApp === 'cursor') {
      const dir = path.resolve(__dirname, '../../patcher-cursor/i18n');
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(f => {
          const m = f.match(/^dictionary\.(.+)\.json$/);
          if (m && m[1] !== 'json') langs.add(m[1]);
        });
      }
    } else {
      const dir = path.resolve(__dirname, '../../patcher-claude');
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(f => {
          const m = f.match(/^(.+)\.json$/);
          if (m && !['package', 'package-lock'].includes(m[1])) langs.add(m[1]);
        });
      }
    }
  } catch (err) {
    console.error('Failed to scan languages', err);
  }
  return Array.from(langs);
});

const buildHooks = () => ({
  onProgress: (msg) => { if (mainWindow) mainWindow.webContents.send('i18n:progress', msg); },
  onRequestSudo: () => { if (mainWindow) mainWindow.webContents.send('i18n:sudo-prompt'); },
  onTCCBlocked: () => { shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_AppBundles'); },
});

ipcMain.handle('i18n:installCursor', async (event, config) => {
  const apiConfig = loadApiKeys();
  config.engines = apiConfig.engines || {};
  return await cursor.install(config, buildHooks());
});
ipcMain.handle('i18n:installClaude', async (event, config) => {
  const apiConfig = loadApiKeys();
  config.engines = apiConfig.engines || {};
  return await claude.install(config, buildHooks());
});
ipcMain.handle('cursor:createBackup', async () => {
  const cfg = loadConfig();
  const config = { appPath: cfg.cursor?.appPath || null };
  try {
    const result = await cursor.createBackup(config, buildHooks());
    return { ok: true, ...result };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
ipcMain.handle('claude:createBackup', async () => {
  const cfg = loadConfig();
  const config = { appPath: cfg.claude?.appPath || null };
  try {
    const result = await claude.createBackup(config, buildHooks());
    return { ok: true, ...result };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('i18n:restoreCursor', async () => {
    const cfg = loadConfig();
    const config = { appPath: cfg.cursor?.appPath || null };
    return await cursor.restore(config, buildHooks());
  });
ipcMain.handle('i18n:restoreClaude', async () => {
    const cfg = loadConfig();
    const config = { appPath: cfg.claude?.appPath || null };
    return await claude.restore(config, buildHooks());
  });

ipcMain.handle('app:browsePath', async (_, targetApp) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: targetApp === 'cursor' ? '选择 Cursor 应用目录' : '选择 Claude 应用目录',
    defaultPath: process.platform === 'darwin' ? '/Applications' : process.env.PROGRAMFILES,
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return result.filePaths[0];
});

ipcMain.handle('app:openExternal', async (_, url) => {
  await require('electron').shell.openExternal(url);
});

ipcMain.handle('config:saveApiKeys', async (_, keys) => {
  saveApiKeys(keys);
  return { ok: true };
});

ipcMain.handle('config:loadApiKeys', async () => {
  return loadApiKeys();
});

ipcMain.handle('config:load', async () => {
  ensureConfigDir();
  return loadConfig();
});

ipcMain.handle('config:save', async (_, config) => {
  ensureConfigDir();
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf8');
    return { ok: true };
  } catch (e) {
    console.error('Failed to save config.json', e);
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('cursor:getInstalledExtensions', async () => {
  return await cursor.getInstalledExtensions();
});

ipcMain.handle('config:testApiKey', async (_, { engine, apiKey, model, baseURL }) => {
  try {
    await DictGenerator.testConnection({ engine, apiKey, model, baseURL });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('dict:generate', async (_, { app: targetApp, lang, engine, batchSize, engineConfig, appPath }) => {
  try {
    const gen = new DictGenerator({
      engine,
      lang,
      batchSize: batchSize || 40,
      apiConfig: engineConfig,
    });

    gen.on('progress', (msg) => {
      if (mainWindow) mainWindow.webContents.send('dict:progress', msg);
    });

    const results = await gen.generate(targetApp, appPath || null);
    return { ok: true, results };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('dict:status', async (_, { app: targetApp, lang }) => {
  try {
    if (targetApp === 'claude-strings') {
      const stringsPath = path.resolve(__dirname, '../../patcher-claude/Localizable.strings.zh-CN');
      if (!fs.existsSync(stringsPath)) return { exists: false };
      const content = fs.readFileSync(stringsPath, 'utf8');
      const count = (content.match(/^"[^"]+"\s*=/gm) || []).length;
      return { exists: true, count, path: stringsPath };
    }

    let dictPath;
    let fallback = false;
    if (targetApp === 'cursor') {
      dictPath = path.resolve(__dirname, '../../patcher-cursor/i18n', `dictionary.${lang}.json`);
      if (!fs.existsSync(dictPath)) {
        const fallbackPath = path.resolve(__dirname, '../../patcher-cursor/i18n', 'dictionary.json');
        if (fs.existsSync(fallbackPath)) {
          dictPath = fallbackPath;
          fallback = true;
        }
      }
    } else {
      dictPath = path.resolve(__dirname, '../../patcher-claude', `${lang}.json`);
    }
    if (!fs.existsSync(dictPath)) return { exists: false };
    const dict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
    const count = Object.keys(dict).length;
    return { exists: true, count, path: dictPath, fallback };
  } catch (e) {
    return { exists: false, error: e.message };
  }
});


// ─── Update IPC ────────────────────────────────────────────────────────────────
ipcMain.handle('update:check', async () => {
  if (!autoUpdater) return { ok: false, error: 'Update mechanism not available' };
  try {
    const result = await autoUpdater.checkForUpdates();
    return { ok: true, ...result };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('update:download', async () => {
  if (!autoUpdater) return { ok: false, error: 'Update mechanism not available' };
  try {
    await autoUpdater.downloadUpdate();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('update:install', () => {
  if (!autoUpdater) return { ok: false, error: 'Update mechanism not available' };
  // Remove macOS window-all-closed guard so the app can actually quit
  app.removeAllListeners('window-all-closed');
  autoUpdater.quitAndInstall();
  // Fallback: force exit after 3s if quitAndInstall didn't trigger
  setTimeout(() => app.exit(0), 3000);
  return { ok: true };
});

ipcMain.handle('update:getVersion', () => {
  return app.getVersion();
});
