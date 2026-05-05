# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install all workspace dependencies (run from repo root)
npm install

# Start the desktop app in dev mode (Electron + Vite HMR)
npm run dev
# or directly:
npm run dev -w desktop-app

# Lint the desktop app
npm run lint -w desktop-app

# Build the desktop app (Electron distributable)
npm run build -w desktop-app

# Run dict-generator tests
npm test -w @live-translator/dict-generator
# or:
node --test packages/dict-generator/src/**/*.test.js

# Build patcher CLI binaries (node18 cross-platform via pkg)
npm run build -w @live-translator/patcher-cursor
npm run build -w @live-translator/patcher-claude
```

## Architecture

This is a **npm workspaces monorepo** with four packages under `packages/`:

### `packages/desktop-app` — Electron + React GUI

The main user-facing application. Built with Vite, React 19, Tailwind CSS v4, Zustand, and Framer Motion.

- **`electron/main.js`** — Electron main process. Handles IPC channels (`i18n:*`, `config:*`, `dict:*`, `cursor:*`), persists config to `~/.live_translator_hub/config.json`, and encrypts API keys via Electron `safeStorage` to `~/.live_translator_hub/api_keys.enc`.
- **`electron/preload.js`** — Context bridge that exposes `window.liveTranslatorAPI` to the renderer. All renderer↔main communication goes through these typed IPC calls.
- **`src/store/configStore.js`** — Single Zustand store holding all UI state. The top-level `config` object has three keys: `cursor`, `claude`, and `apiKeys`. The store's `saveConfig` intentionally strips `apiKeys` before writing to disk (API keys are saved separately via `saveApiKeys`).
- **`src/App.jsx`** — Tab-based layout with four tabs: Cursor Engine, Claude Engine, API Keys, and Dict Generator.
- **`src/i18n.js`** — The desktop app's own UI localization (i18next). Ships zh-CN and en-US strings; all other locales fall back to en-US.

Component tree for the two patcher panels follows the same pattern: `CursorPanel/` and `ClaudePanel/` each contain `StatusCard`, `ActionBar`, `DeployConfig`, `DictStatus`, and `SkipRules` sub-components.

### `packages/core` — Translation Runtime Kernel

**`src/translator-engine.js`** is the single runtime injected into patched apps. It is pure browser JS (no imports), reads its configuration from `window.__I18N_CONFIG__` and its dictionary from `window.__I18N_TERMS__` (or `window.__CURSOR_TERMS__` / `window.__CLAUDE_TERMS__`). Key responsibilities:
- Dictionary matching (static terms + regex patterns)
- Nested dictionary lookup (`enableNestedDict`)
- AI translation via a **Translation Bridge**: in Webview contexts (`window.self !== window.top`), requests are forwarded via `postMessage` to the top window to bypass CSP restrictions.
- `localStorage`-backed translation cache keyed by `live_i18n_cache_<entity_name>`.

### `packages/patcher-cursor` — Cursor App Patcher CLI

Node.js CLI that patches Cursor's bundled JS (`workbench.desktop.main.js`) and injects the runtime from `core`. It also scans `~/.cursor/extensions/` for installed extensions with `webview/index.js` and can inject the runtime into those too. Config is stored at `~/.cursor_live_translator/config.json`.

### `packages/patcher-claude` — Claude App Patcher CLI

Same pattern as `patcher-cursor` but targets the Claude desktop app. Uses `sudo-prompt` for privileged file writes. Localization strings live in `zh-CN.json` and `Localizable.strings.zh-CN`.

### `packages/dict-generator` — AI Dictionary Generator

Generates JSON translation dictionaries by extracting UI strings from the target app's source files and batch-translating them via AI. Internal structure:
- **`src/source-extractors/`** — pull raw strings from Cursor or Claude app bundles
- **`src/api-adapters/`** — adapters for OpenAI, Anthropic, Gemini, DeepL
- **`src/formatters/`** — serialize translated terms into the JSON/strings format consumed by the patchers
- **`src/generator.js`** / **`index.js`** — `DictGenerator` facade with `generate('cursor'|'claude'|'both')`

## Key Conventions

- The IPC surface is defined in `preload.js`; all new main↔renderer features must be added there first.
- API keys are **never** written into `config.json`; always route through `saveApiKeys`/`loadApiKeys` IPC handlers.
- The runtime kernel (`translator-engine.js`) must remain a self-contained IIFE with no ES module syntax — it is appended raw into third-party app bundles.
- Skip rules use two separate data shapes: workbench skips live under `config.cursor.skip._cursor_` (arrays), while Webview plugin skips live under `config.cursor.skipRules.webview.<pluginId>` (objects with `selectors`/`titles`/`urls` strings).

## I18n (desktop-app UI)

**Every user-visible string in `packages/desktop-app/src/` must use i18n.** No hardcoded Chinese or English text in JSX.

### Adding new UI text

```jsx
// In components:
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
<span>{t('myNewKey', '默认中文')}</span>

// For text with inline formatting (em, span, etc.):
import { Trans } from 'react-i18next';
<Trans i18nKey="myNewKey" components={{ emStrong: <em className="..." /> }}>
  Default text with <em>formatting</em>
</Trans>
```

### After adding new keys

```bash
npm run i18n:extract -w desktop-app
```

This scans all `t()` and `<Trans>` calls, then auto-adds missing keys to:
- `packages/desktop-app/src/locales/zh-CN.json` (primary)
- `packages/desktop-app/src/locales/en-US.json` (secondary)

The first argument to `t()` is always the key. When a key is missing in the JSON files, i18next falls back to the second argument (or the key name itself). After extraction, search for `__STRING_NOT_TRANSLATED__` in the JSON files to find keys that need manual translation.

### How it works

- `src/i18n.js` initializes i18next with resources loaded from all JSON files in `src/locales/` via Vite's `import.meta.glob`
- `i18next-cli` (configured in `i18next.config.js`) scans `src/**/*.{jsx,js}` for `t()` and `<Trans>`
- The extractor never removes keys automatically (`removeUnusedKeys: false`)
- Plural detection is disabled — use `{{count}}` interpolation directly

### Adding a new language

**Drop a JSON file into `src/locales/` — that's it. Zero code changes.**

1. Create `src/locales/<code>.json` (copy from `en-US.json` as starting point)
2. Run the translation script to populate it (see below)
3. Done — `import.meta.glob` in `i18n.js` auto-discovers and loads all `*.json` files in the directory at build time. No imports to add, no constants to update.

### Batch translating locales

```bash
ANTHROPIC_API_KEY=sk-xxx npm run i18n:translate -w desktop-app
# Or target specific languages:
ANTHROPIC_API_KEY=sk-xxx npm run i18n:translate -w desktop-app -- --lang ja-JP,ko-KR
# With DeepSeek:
ANTHROPIC_API_KEY=sk-xxx node scripts/translate-locales.js --base-url https://api.deepseek.com --model deepseek-chat
```

The script (`scripts/translate-locales.js`) reads `en-US.json` as source, detects untranslated keys, and batch-translates them via the Anthropic Messages API.
