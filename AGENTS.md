# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
# Install all workspace dependencies (run from repo root)
npm install

# Start the desktop app in dev mode (Electron + Vite HMR)
npm run dev

# Lint the desktop app
npm run lint -w desktop-app

# Build the desktop app (Electron distributable for all platforms)
npm run build -w desktop-app
# macOS only:
npm run build:mac -w desktop-app

# Build Vite frontend only (skip electron-builder)
npm run dist -w desktop-app

# Dict-generator: run tests (note: no test files currently exist)
npm test -w @live-translator/dict-generator

# i18n: extract new keys from t() and <Trans> calls into locale JSONs
npm run i18n:extract -w desktop-app

# i18n: translate all untranslated keys via Anthropic API
ANTHROPIC_API_KEY=sk-xxx npm run i18n:translate -w desktop-app
# Target specific languages:
ANTHROPIC_API_KEY=sk-xxx npm run i18n:translate -w desktop-app -- --lang ja-JP,ko-KR

# Translate README from zh-CN into 30+ languages (needs DEEPSEEK_API_KEY in .env)
node scripts/translate-readme.js
```

**Important:** The patcher packages (`patcher-cursor`, `patcher-claude`) have no CLI or build scripts. They are libraries called directly from `electron/main.js` via IPC handlers. The `core` package also has no scripts — it's a single-file runtime kernel injected raw into target apps.

## Architecture

This is a **npm workspaces monorepo** with five packages under `packages/`. Pure JS throughout — no TypeScript. Electron 34, React 19, Tailwind CSS v4, Zustand, Framer Motion.

### `packages/desktop-app` — Electron + React GUI

The main user-facing application. Built with Vite + `vite-plugin-electron/simple`.

- **`electron/main.js`** — Electron main process. Handles 18 IPC channels across `i18n:*`, `config:*`, `dict:*`, `cursor:*`, `claude:*`, `app:*`, and `update:*` namespaces. Persists config to `~/.live_translator_hub/config.json`, encrypts API keys via Electron `safeStorage` to `~/.live_translator_hub/api_keys.enc`. On startup, migrates legacy config from `~/.cursor_live_translator/` and `~/.claude_live_translator/` into the unified Hub format, then deletes the old directories.
- **`electron/preload.js`** — Context bridge exposing `window.liveTranslatorAPI` with invoke methods and event listeners (progress, sudo-prompt, update events). All renderer↔main communication goes through this interface.
- **`src/store/configStore.js`** — Single Zustand store. Top-level `config` has keys: `cursor`, `claude`, `apiKeys`. `saveConfig` intentionally strips `apiKeys` before writing to disk (keys saved separately via `saveApiKeys`).
- **`src/App.jsx`** — Tab-based layout: Cursor Engine, Claude Engine, API Keys, Dict Generator.
- **`src/i18n.js`** — i18next init. Loads all JSON files from `src/locales/` via `import.meta.glob` at build time. Ships 34 languages.

Component tree: `CursorPanel/` and `ClaudePanel/` each contain `StatusCard`, `ActionBar`, `DeployConfig`, `DictStatus`, and `SkipRules`.

### `packages/core` — Translation Runtime Kernel

Two files:

- **`src/translator-engine.js`** — The single runtime injected into patched apps. Pure browser JS (no imports), reads config from `window.__I18N_CONFIG__` and dictionary from `window.__I18N_TERMS__`. Key behaviors:
  - Dictionary matching (static terms + regex patterns + nested lookup)
  - AI translation: calls `fetch()` directly in the top window; in iframes/webviews, forwards requests via `postMessage` to the top window to bypass CSP
  - `localStorage`-backed translation cache keyed by `live_i18n_cache_<entity_name>`
  - `cacheVersion` (replaced the old boolean `resetCache`): when user checks "部署时清除翻译缓存", a `Date.now()` timestamp is injected. Engine compares it against the last cleared version in localStorage, so cache is only cleared once after deploy, not on every restart.
  - Debug mode: `Cmd+Option+Shift+B` (Mac) / `Ctrl+Alt+Shift+B` (Win) toggles blue dashed highlight borders; hold `Option`/`Alt` and hover over Chinese text to see original
- **`src/language-names.js`** — Maps language codes to display names in multiple locales. Used by patchers to resolve target language names and by dict-generator for reverse lookups.

### `packages/patcher-cursor` — Cursor App Patcher (Library)

Called from `electron/main.js` IPC handlers, not a standalone CLI.

```js
const { CursorPatcher } = require('@live-translator/patcher-cursor');
const patcher = new CursorPatcher();

// Methods
patcher.detectStatus(customRoot?)  // → { hasBackup, patched, dictVersion, dictKeys, appVersion }
patcher.createBackup(config, hooks)
patcher.getInstalledExtensions()   // scans ~/.cursor/extensions/ for webview plugins
patcher.install(config, hooks)
patcher.restore(config, hooks)

// config shape
{ appPath, engines, activeId, targetLanguage, skip: { _cursor_: [...] }, skipRules: { webview: { pluginId: { selectors, titles, urls } } }, injectWebview: true, cacheVersion, features }

// hooks shape  
{ onProgress(msg), onRequestSudo(msg) }
```

macOS flow: modify workbench.js → update workbench.html CSP → fix product.json checksum → re-sign with `codesign`. Has hardcoded `DEFAULT_SKIPS` for 10 CSS selectors (breadcrumbs, terminal layers, etc.).

### `packages/patcher-claude` — Claude App Patcher (Library)

Same pattern as patcher-cursor but targets Claude desktop app.

```js
const { ClaudePatcher } = require('@live-translator/patcher-claude');
const patcher = new ClaudePatcher();

// Methods
patcher.detectStatus(customRoot?)
patcher.createBackup(config, hooks)
patcher.install(config, hooks)
patcher.restore(config, hooks)

// Additional hooks
{ onProgress(msg), onRequestSudo(msg), onTCCBlocked(msg) }  // TCC = macOS privacy settings

// Utilities
resolveResourcesPath()  // returns path to bundled i18n resources (handles ASAR vs filesystem)
detectVersion(appPath)  // returns Claude app version
```

macOS flow: extract app.asar → inject runtime + dicts → repack asar → update `ElectronAsarIntegrity` in Info.plist → remove quarantine xattr → re-sign. Uses `sudo-prompt` for privileged file writes. When loaded from inside an ASAR archive, copies resource files to temp directory so shell scripts can reference real paths.

### `packages/dict-generator` — AI Dictionary Generator (Library)

EventEmitter-based library, not a CLI.

```js
const { DictGenerator, SUPPORTED_LANGUAGES, findLanguage } = require('@live-translator/dict-generator');
const gen = new DictGenerator({ engine, lang, batchSize: 40, apiConfig, outputDir });
gen.on('progress', (msg) => {});
await gen.generate('cursor' | 'claude' | 'both');

// Static
DictGenerator.testConnection({ engine, apiKey, model, baseURL });
```

Internal: `source-extractors/` pull strings from target app bundles → `api-adapters/` (OpenAI, Anthropic, Gemini, DeepL) batch-translate → `formatters/` serialize to JSON/strings format. Retries up to 3 times with batch size halving on failure. Writes atomically (tmp file → rename). Supports 35 languages (LTR only, no Arabic/Hebrew).

## Config Files

- **`electron-builder.yml`** — appId `com.live-translator.hub`, product "Live Translator Hub". macOS: disabled hardenedRuntime + gatekeeperAssess (no Apple dev cert). Win: NSIS oneClick false, allow user dir. Linux: AppImage + deb. GitHub release provider (Uncle-Gao/Live-Translator-Hub).
- **`vite.config.mjs`** — Uses `vite-plugin-electron/simple`, strips `crossorigin` for `file://` loading, externalizes `sudo-prompt`, `original-fs`, `electron-updater`, and all `@live-translator/*` packages.
- **`eslint.config.js`** — Flat config: `@eslint/js` recommended, `react-hooks`, `react-refresh`, `no-unused-vars` at warn, `module` source type.
- **`jsconfig.json`** — Target ES2022, bundler module resolution, `jsx: "react-jsx"`.
- **`i18next.config.js`** — Locales `zh-CN` + `en-US`, `removeUnusedKeys: false`, no plural detection.

## Key Conventions

- The IPC surface is defined in `preload.js`; all new main↔renderer features must be added there first.
- API keys are **never** written into `config.json`; always route through `saveApiKeys`/`loadApiKeys` IPC handlers.
- The runtime kernel (`translator-engine.js`) must remain a self-contained IIFE with no ES module syntax — it is appended raw into third-party app bundles.
- Skip rules use two separate data shapes: workbench skips live under `config.cursor.skip._cursor_` (arrays), while Webview plugin skips live under `config.cursor.skipRules.webview.<pluginId>` (objects with `selectors`/`titles`/`urls` strings).
- `cacheVersion` checkbox in each panel's advanced settings (default: 0/off). When checked on deploy, injects a `Date.now()` timestamp; the engine clears cache only once on first mismatch, then persists the new version so cache survives restarts.
- There are **no test files** anywhere in the repo. The dict-generator test script matches no files.

## Release / Publishing

**Never build locally for releases.** Publishing is done via GitHub Actions CI.

1. Bump version in `packages/desktop-app/package.json`
2. Commit and push to `master`
3. Create and push an annotated tag

```bash
git tag -a v3.0.1 -m "v3.0.1 — <summary>" && git push origin v3.0.1
```

Pushing a `v*` tag triggers `.github/workflows/release.yml` → CI builds macOS (x64+arm64), Windows (x64), Linux (x64) in parallel → `git-cliff` auto-generates changelog → GitHub release with platform artifacts.

## I18n (desktop-app UI)

**Every user-visible string in `packages/desktop-app/src/` must use i18n.** No hardcoded Chinese or English text in JSX.

### Adding new UI text

```jsx
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
<span>{t('myNewKey', '默认中文')}</span>

// For text with inline formatting:
import { Trans } from 'react-i18next';
<Trans i18nKey="myNewKey" components={{ emStrong: <em className="..." /> }}>
  Default text with <em>formatting</em>
</Trans>
```

### After adding new keys

```bash
npm run i18n:extract -w desktop-app
```

This scans `t()` and `<Trans>` calls and auto-adds missing keys to `zh-CN.json` and `en-US.json`. The first argument to `t()` is always the key; i18next falls back to the second argument when a key is missing. After extraction, search for `__STRING_NOT_TRANSLATED__` in the JSON files.

### Adding a new language

Drop a JSON file into `src/locales/` — `import.meta.glob` in `i18n.js` auto-discovers it. Zero code changes.
