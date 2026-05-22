/**
 * live-translator-core-runtime.js (Unified Kernel V3)
 * 支持 OpenAI 与 DeepL 双协议的高品质实时翻译引擎。
 * 由 Feature Flags 驱动，支持 Cursor 和 Claude 等多种环境。
 */

// === 1. 外部注入配置与初始化 ===
const I18N_TERMS = window.__I18N_TERMS__ || {};
const CONFIG = window.__I18N_CONFIG__ || { apiType: 'none', skip: {}, features: {} };
const FEATURES = Object.assign({
  enableDictionary: true,
  enableNestedDict: true,
  enableRegex: true,
  enableTranslationBridge: true,
  enableLoadingAnimation: true,
  enableFileNameGuard: true,
  enableProtectedTermGuard: true
}, CONFIG.features || {});

console.log('[I18N] Engine loaded, CONFIG.apiType:', CONFIG.apiType, 'features:', JSON.stringify(FEATURES));

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE', 'KBD', 'SAMP']);
const SKIP_TITLES = CONFIG.skip?.titles || [];
const SKIP_URLS = CONFIG.skip?.urls || [];
const SKIP_SELECTORS = CONFIG.skip?.selectors || [];
const panelBypassSelectors = new Set();
const panelSkipSelectors = new Set();
const CACHE_KEY = 'live_i18n_cache_' + (CONFIG.name ? String(CONFIG.name).replace(/[^a-zA-Z0-9]/g, '_') : 'default');
const IS_WORKBENCH = window.self === window.top;

// === 2. 缓存体系 ===
let CACHE = {};
try {
  CACHE = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
} catch (e) { }

const CACHE_VERSION_KEY = CACHE_KEY + '_version';
const cacheVersion = CONFIG.cacheVersion || 0;
if (cacheVersion && localStorage.getItem(CACHE_VERSION_KEY) !== String(cacheVersion)) {
  localStorage.removeItem(CACHE_KEY);
  CACHE = {};
  localStorage.setItem(CACHE_VERSION_KEY, cacheVersion);
  console.log('%c[I18N] 已执行翻译缓存清除（版本更新）', 'color:#f59e0b;font-weight:bold');
}

function logCacheStatus() {
  const count = Object.keys(CACHE).length;
  if (!IS_WORKBENCH && count === 0) return;
  const estKB = (count * 100 / 1024).toFixed(2);
  const limitKB = 5120;
  const percent = ((estKB / limitKB) * 100).toFixed(2);

  let color = '#10b981';
  if (percent > 80) color = '#ef4444';
  else if (percent > 50) color = '#f59e0b';

  console.log(
    `%c[I18N]${CONFIG.name ? ` [${CONFIG.name}]` : ''}%c 翻译缓存占用: ~%c${estKB} KB / ${limitKB} KB (${percent}%) (${count} 条)`,
    'color:#3b82f6;font-weight:bold',
    'color:inherit',
    `color:${color};font-weight:bold`
  );
}

// === 3. 异步翻译管线 (智能防抖与批处理) ===
const PENDING_JOBS = new Set();
const IN_FLIGHT_JOBS = new Set();
const PENDING_ELEMENTS = new Set();
let globalBatchTimer = null;
const REQUEST_INTERVAL = 2000;

let cacheDirty = false;
let cachePersistTimer = null;
function scheduleCachePersist() {
  cacheDirty = true;
  if (cachePersistTimer) clearTimeout(cachePersistTimer);
  cachePersistTimer = setTimeout(() => flushCache(), 5000);
}
function flushCache() {
  if (!cacheDirty) return;
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(CACHE)); } catch (e) {}
  cacheDirty = false;
  cachePersistTimer = null;
}
let DEBUG_STYLE = `
  body.i18n-debug-active .i18n-debug-highlight {
    outline: 1px dashed #3b82f6 !important;
    outline-offset: -1px !important;
    background-color: rgba(59, 130, 246, 0.1) !important;
    position: relative !important;
  }
  #i18n-hover-tooltip {
    position: fixed; z-index: 1000000; padding: 6px 10px;
    background: rgba(0, 0, 0, 0.85); color: #fff; border-radius: 4px;
    font-size: 12px; pointer-events: none; display: none;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3); backdrop-filter: blur(4px);
    border: 1px solid rgba(255,255,255,0.1); max-width: 450px;
    word-break: break-word; line-height: 1.4;
  }
  .i18n-skip-preview {
    outline: 2px dashed #ef4444 !important;
    outline-offset: 1px !important;
    background-color: rgba(239, 68, 68, 0.12) !important;
  }
  body.i18n-debug-active .i18n-debug-highlight.i18n-skip-preview,
  body.i18n-debug-active .i18n-skip-preview {
    outline: 2px dashed #ef4444 !important;
    outline-offset: 1px !important;
    background-color: rgba(239, 68, 68, 0.12) !important;
  }
  #i18n-skip-panel {
    position: fixed; top: 12px; right: 12px; z-index: 2147483647;
    width: 280px; max-height: 480px;
    background: rgba(15, 23, 42, 0.96); border: 1px solid rgba(239,68,68,0.4);
    border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    display: flex; flex-direction: column; font-family: monospace;
    font-size: 11px; color: #e2e8f0; overflow: hidden;
  }
  #i18n-panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 10px; background: rgba(239,68,68,0.15);
    border-bottom: 1px solid rgba(239,68,68,0.2); flex-shrink: 0;
    font-size: 11px; font-weight: bold; color: #fca5a5;
  }
  #i18n-panel-close {
    background: none; border: none; color: #94a3b8; cursor: pointer;
    font-size: 13px; line-height: 1; padding: 0 2px;
  }
  #i18n-panel-close:hover { color: #ef4444; }
  #i18n-panel-body {
    flex: 1; overflow-y: auto; padding: 6px 0;
  }
  .i18n-panel-section {
    padding: 2px 10px 4px; font-size: 10px;
    color: rgba(148,163,184,0.5); text-transform: uppercase; letter-spacing: 0.05em;
  }
  .i18n-rule-item {
    display: flex; align-items: center; gap: 6px;
    padding: 3px 10px; cursor: default;
  }
  .i18n-rule-item:hover { background: rgba(255,255,255,0.04); }
  .i18n-rule-checkbox { cursor: pointer; flex-shrink: 0; accent-color: #ef4444; }
  .i18n-rule-label {
    flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    color: #cbd5e1; font-size: 11px;
  }
  .i18n-rule-label.inherited { color: #64748b; }
  .i18n-rule-lock { color: #475569; font-size: 10px; flex-shrink: 0; }
  .i18n-rule-delete {
    background: none; border: none; color: #475569; cursor: pointer;
    font-size: 11px; line-height: 1; padding: 0 2px; flex-shrink: 0;
  }
  .i18n-rule-delete:hover { color: #ef4444; }
  #i18n-panel-footer {
    display: flex; gap: 6px; padding: 8px 10px;
    border-top: 1px solid rgba(255,255,255,0.06); flex-shrink: 0;
  }
  #i18n-panel-footer button {
    flex: 1; padding: 5px 0; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 5px; background: rgba(255,255,255,0.05);
    color: #94a3b8; cursor: pointer; font-size: 10px;
    font-family: monospace; transition: all 0.15s;
  }
  #i18n-panel-footer button:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }
  #i18n-panel-copy:hover { border-color: rgba(34,197,94,0.4); color: #86efac !important; }
  #i18n-panel-clear:hover { border-color: rgba(239,68,68,0.4); color: #fca5a5 !important; }
  #i18n-selector-chooser {
    position: fixed; z-index: 2147483648; min-width: 240px; max-width: 420px;
    background: rgba(15, 23, 42, 0.97); border: 1px solid rgba(249,115,22,0.5);
    border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.6);
    font-family: monospace; font-size: 11px; overflow: hidden; display: none;
  }
  #i18n-chooser-title {
    display: flex; justify-content: space-between; align-items: center;
    padding: 6px 10px; color: #64748b; font-size: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    word-break: break-all; cursor: move;
  }
  #i18n-ch-close {
    cursor: pointer; flex-shrink: 0; color: #64748b; transition: color 0.15s;
  }
  #i18n-ch-close:hover { color: #ef4444 !important; }

  .i18n-chooser-item {
    padding: 6px 10px; color: #cbd5e1; cursor: pointer;
    border-bottom: 1px solid rgba(255,255,255,0.04); word-break: break-all;
  }
  .i18n-chooser-item:last-child { border-bottom: none; }
  .i18n-chooser-item:hover { background: rgba(249,115,22,0.15); color: #fdba74; }
  .i18n-chooser-item.active { background: rgba(249,115,22,0.15); color: #fdba74; }
  .i18n-chooser-item-best::before { content: "▶ "; color: #f97316; }
  #i18n-chooser-nav {
    display: flex; gap: 6px; padding: 8px 10px;
    border-top: 1px solid rgba(255,255,255,0.06);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  #i18n-chooser-actions {
    display: flex; gap: 6px; padding: 8px 10px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  #i18n-chooser-nav button,
  #i18n-chooser-actions button {
    flex: 1; padding: 5px 0; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 5px; background: rgba(255,255,255,0.05);
    color: #94a3b8; cursor: pointer; font-size: 10px;
    font-family: monospace; transition: all 0.15s;
  }
  #i18n-chooser-nav button:hover,
  #i18n-chooser-actions button:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }
  #i18n-chooser-confirm:hover { border-color: rgba(34,197,94,0.4); color: #86efac !important; }
  #i18n-pick-toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: #16a34a; color: #fff; font: bold 12px/1 monospace;
    padding: 7px 18px; border-radius: 20px; z-index: 2147483647;
    pointer-events: none; opacity: 0; transition: opacity 0.25s;
  }
`;

if (FEATURES.enableLoadingAnimation) {
  DEBUG_STYLE += `
  .i18n-loading::after {
    content: '';
    display: inline-block;
    width: 0.8em;
    height: 0.8em;
    margin-left: 6px;
    vertical-align: middle;
    border: 2px solid rgba(59, 130, 246, 0.2);
    border-top-color: #4f5f7cff;
    border-radius: 50%;
    animation: i18n-spin 0.8s linear infinite;
    z-index: 1000;
    pointer-events: none;
    opacity: 1 !important;
  }
  @keyframes i18n-spin {
    to { transform: rotate(360deg); }
  }
  `;
}

const HAS_CHINESE = /[\u4e00-\u9fa5]/;
const FILE_NAME_EXTENSIONS = new Set([
  'c', 'cc', 'cfg', 'conf', 'cpp', 'cs', 'css', 'csv', 'cxx', 'dart', 'dockerfile',
  'env', 'go', 'h', 'hpp', 'html', 'ini', 'java', 'js', 'json', 'jsx', 'less',
  'lock', 'log', 'lua', 'mjs', 'md', 'mdx', 'mts', 'php', 'plist', 'properties',
  'py', 'rb', 'rs', 'sass', 'scss', 'sh', 'sql', 'svelte', 'swift', 'toml', 'ts',
  'tsx', 'txt', 'vue', 'xml', 'yaml', 'yml'
]);
const FILE_NAME_BASENAMES = new Set([
  'dockerfile', 'makefile', 'gemfile', 'rakefile', 'procfile', 'license', 'readme',
  'changelog', 'notice', 'copying', 'authors', 'contributors'
]);
function createProtectedPattern(source) {
  if (!source || typeof source !== 'string') return null;
  const trimmed = source.trim();
  if (!trimmed) return null;
  try {
    const literal = trimmed.match(/^\/(.+)\/([a-z]*)$/i);
    if (literal) {
      const flags = Array.from(new Set(`${literal[2]}g`.split(''))).join('');
      return new RegExp(literal[1], flags);
    }
    return new RegExp(trimmed, 'g');
  } catch (e) {
    console.warn('[I18N] Invalid protected pattern:', trimmed);
    return null;
  }
}
const PROTECTED_TECH_TERMS = Array.isArray(CONFIG.protection?.terms)
  ? CONFIG.protection.terms
  : [];
const DISABLED_PROTECTED_TERMS = new Set(CONFIG.protection?.disabledTerms || []);
const DISABLED_PROTECTED_PATTERNS = new Set(CONFIG.protection?.disabledPatterns || []);
const ACTIVE_PROTECTED_TECH_TERMS = PROTECTED_TECH_TERMS.filter(term => !DISABLED_PROTECTED_TERMS.has(term));
const PROTECTED_MODEL_PATTERNS = (Array.isArray(CONFIG.protection?.patterns)
  ? CONFIG.protection.patterns
  : [])
  .filter(pattern => !DISABLED_PROTECTED_PATTERNS.has(pattern))
  .map(createProtectedPattern)
  .filter(Boolean);
let PROTECTED_TECH_PATTERN = null;
try {
  PROTECTED_TECH_PATTERN = ACTIVE_PROTECTED_TECH_TERMS.length > 0
    ? new RegExp(
        `(^|[^A-Za-z0-9_])(${ACTIVE_PROTECTED_TECH_TERMS
          .slice()
          .sort((a, b) => b.length - a.length)
          .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'))
          .join('|')})(?=$|[^A-Za-z0-9_])`,
        'g'
      )
    : null;
} catch(e) {
  console.error('[I18N] PROTECTED_TECH_PATTERN build failed:', e.message);
}

let FILE_NAME_PATTERN;
try {
  FILE_NAME_PATTERN = new RegExp(
    `(^|[\\s("'\\[<{])([A-Za-z0-9_@+~%#=.-]+[\\\\/][\\w@+~%#=.-]+(?:[\\\\/][\\w@+~%#=.-]+)*(?:\\:\\d+(?:\\:\\d+)?)?|[A-Za-z0-9_@+~%#=-][\\w@+~%#=.-]*\\.(${Array.from(FILE_NAME_EXTENSIONS).join('|')})(?::\\d+(?::\\d+)?)?|\\.[A-Za-z0-9_-]+(?:\\.[A-Za-z0-9_-]+)*|(?:~|\\.{1,2})?[\\\\/][\\w@+~%#=.-]+(?:[\\\\/][\\w@+~%#=.-]+)+(?:\\:\\d+(?:\\:\\d+)?)?)(?=$|[\\s)"'\\]}>.,;:])`,
    'gi'
  );
} catch(e) {
  console.error('[I18N] FILE_NAME_PATTERN build failed:', e.message);
  FILE_NAME_PATTERN = /(?!x)x/g; // never-matching regex as fallback
}

function isFileNameLike(text) {
  if (!FEATURES.enableFileNameGuard) return false;
  if (!text || text.length > 260 || /[\r\n]/.test(text)) return false;

  let value = text.trim();
  if (!value || /\s{2,}/.test(value)) return false;

  value = value
    .replace(/^[`'"]|[`'"]$/g, '')
    .replace(/[),\]}]+$/g, '')
    .replace(/:\d+(?::\d+)?$/g, '')
    .replace(/[?#].*$/g, '');

  if (!value || value.includes('...') || value.includes('…')) return false;
  if (/[^\w\s./\\@:+~%#=-]/.test(value)) return false;

  const hasPathSeparator = /[\\/]/.test(value);
  const parts = value.split(/[\\/]/).filter(Boolean);
  const name = parts[parts.length - 1] || value;
  if (!name || name === '.' || name === '..') return false;

  const lowerName = name.toLowerCase();
  if (FILE_NAME_BASENAMES.has(lowerName)) return true;
  if (/^\.[a-z0-9_-]+(?:\.[a-z0-9_-]+)*$/i.test(name)) return true;

  const match = name.match(/^(.+)\.([a-z0-9][a-z0-9_-]{0,15})$/i);
  if (!match) return false;

  const basename = match[1];
  const ext = match[2].toLowerCase();
  if (!/[a-z]/i.test(basename)) return false;
  if (FILE_NAME_EXTENSIONS.has(ext)) return true;

  return hasPathSeparator && /[a-z]/i.test(ext) && ext.length <= 8;
}

function protectTextForTranslation(text) {
  if (!FEATURES.enableProtectedTermGuard || !text || text.length < 2) {
    return { text, protectedValues: [], restore: value => value };
  }

  const values = [];
  const tokenFor = (value) => {
    const existing = values.indexOf(value);
    const index = existing >= 0 ? existing : values.push(value) - 1;
    return `__I18N_KEEP_${index}__`;
  };

  let protectedText = text.replace(FILE_NAME_PATTERN, (match, prefix, value) => {
    return `${prefix}${tokenFor(value)}`;
  });

  for (const pattern of PROTECTED_MODEL_PATTERNS) {
    protectedText = protectedText.replace(pattern, value => tokenFor(value));
  }

  if (PROTECTED_TECH_PATTERN) {
    protectedText = protectedText.replace(PROTECTED_TECH_PATTERN, (match, prefix, value) => {
      return `${prefix}${tokenFor(value)}`;
    });
  }

  return {
    text: protectedText,
    protectedValues: values,
    restore: (value) => {
      let restored = value || '';
      values.forEach((original, index) => {
        const token = `__I18N_KEEP_${index}__`;
        restored = restored.split(token).join(original);
      });
      return restored;
    }
  };
}

function isOnlyProtectedPlaceholders(text) {
  return text.replace(/__I18N_KEEP_\d+__/g, '').trim() === '';
}

function cachedValueKeepsProtectedTerms(value, protectedValues) {
  if (!Array.isArray(protectedValues) || protectedValues.length === 0) return true;
  if (typeof value !== 'string') return false;
  return protectedValues.every(original => value.includes(original));
}

function prepareProtectedBatch(texts) {
  return texts.map(original => ({
    original,
    ...protectTextForTranslation(original)
  }));
}

function restoreObjectTranslations(result, batch) {
  const restored = {};
  batch.forEach(item => {
    const value = result[item.text] ?? result[item.original];
    if (typeof value === 'string') restored[item.original] = item.restore(value);
  });
  return restored;
}

function restoreArrayTranslations(translations, batch) {
  const restored = {};
  batch.forEach((item, index) => {
    if (typeof translations[index] === 'string') restored[item.original] = item.restore(translations[index]);
  });
  return restored;
}

async function callOnlineAPI(texts) {
  if (CONFIG.apiType === 'none') return;
  const engine = CONFIG[CONFIG.apiType];
  if (!engine?.apiKey) return;
  const batch = prepareProtectedBatch(texts);

  if (CONFIG.apiType === 'openai')    await callOpenAI(batch);
  else if (CONFIG.apiType === 'anthropic') await callAnthropic(batch);
  else if (CONFIG.apiType === 'gemini')    await callGemini(batch);
  else if (CONFIG.apiType === 'deepl')     await callDeepL(batch);
}

async function callOpenAI(batch) {
  const texts = batch.map(item => item.text);
  const langName = CONFIG.targetLanguage || 'Simplified Chinese';
  const prompt = `Translate software UI strings to ${langName} (Faithful, Expressive, Elegant).
Return JSON ONLY with keys as original strings and values as translated strings.
Preserve placeholders like __I18N_KEEP_0__ exactly.
Strings: ${JSON.stringify(texts)}`;

  const baseURL = CONFIG.openai.baseURL || 'https://api.openai.com/v1';

  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.openai.apiKey}`
      },
      body: JSON.stringify({
        model: CONFIG.openai.model || 'gpt-4o-mini',
        messages: [{ role: 'system', content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 4096,
        temperature: 0.3,
        thinking: { type: "disabled" }
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty AI response');
    const result = JSON.parse(content);
    applyTranslations(restoreObjectTranslations(result, batch));
  } catch (err) {
    console.error('[I18N] OpenAI Error:', err.message || err);
  }
}

async function callAnthropic(batch) {
  const texts = batch.map(item => item.text);
  const langName = CONFIG.targetLanguage || 'Simplified Chinese';
  const prompt = `Translate software UI strings to ${langName} (Faithful, Expressive, Elegant).
Return JSON ONLY: {"translations": ["t1", "t2", ...]} with exactly ${texts.length} items.
Preserve placeholders like __I18N_KEEP_0__ exactly.
Strings: ${JSON.stringify(texts)}`;

  const baseURL = CONFIG.anthropic.baseURL || 'https://api.anthropic.com';

  try {
    const response = await fetch(`${baseURL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CONFIG.anthropic.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: CONFIG.anthropic.model || 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: prompt,
        messages: [{ role: 'user', content: JSON.stringify(texts) }]
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const raw = data.content?.[0]?.text;
    if (!raw) throw new Error('Empty AI response');
    const cleaned = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    const translations = parsed.translations;
    if (!Array.isArray(translations)) throw new Error('Missing translations array');
    applyTranslations(restoreArrayTranslations(translations, batch));
  } catch (err) {
    console.error('[I18N] Anthropic Error:', err.message || err);
  }
}

async function callGemini(batch) {
  const texts = batch.map(item => item.text);
  const langName = CONFIG.targetLanguage || 'Simplified Chinese';
  const prompt = `You are a professional software UI translator. Translate these ${texts.length} UI strings to ${langName}.

CRITICAL RULES:
1. Return ONLY a valid JSON object: {"translations": ["t1", "t2", ...]}
2. The array length MUST exactly match the number of input strings (${texts.length}).
3. Preserve ALL placeholders: $1, $2, {name}, {{count}}, %s, %d, etc.
4. Preserve protected placeholders like __I18N_KEEP_0__ exactly.
5. Do NOT add explanations or comments.

Input strings:
${texts.map((t, i) => `${i + 1}. ${JSON.stringify(t)}`).join('\n')}`;

  const baseURL = CONFIG.gemini.baseURL || 'https://generativelanguage.googleapis.com';
  const model = CONFIG.gemini.model || 'gemini-2.0-flash';

  try {
    const response = await fetch(`${baseURL}/v1beta/models/${model}:generateContent?key=${encodeURIComponent(CONFIG.gemini.apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error('Empty Gemini response');
    const cleaned = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    const translations = parsed.translations;
    if (!Array.isArray(translations)) throw new Error('Missing translations array');
    applyTranslations(restoreArrayTranslations(translations, batch));
  } catch (err) {
    console.error('[I18N] Gemini Error:', err.message || err);
  }
}

async function callDeepL(batch) {
  const texts = batch.map(item => item.text);
  const apiKey = CONFIG.deepl.apiKey;
  const baseURL = CONFIG.deepl.baseURL || (apiKey.endsWith(':fx') ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate');
  const targetLangCode = CONFIG.targetLanguageCode || 'ZH';

  const body = new URLSearchParams();
  body.append('auth_key', apiKey);
  body.append('target_lang', targetLangCode.toUpperCase());
  body.append('preserve_formatting', '1');
  for (const t of texts) body.append('text', t);

  try {
    const response = await fetch(baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const results = {};
    if (data.translations) {
      data.translations.forEach((t, i) => {
        if (batch[i]) results[batch[i].original] = batch[i].restore(t.text);
      });
    }
    applyTranslations(results);
  } catch (err) {
    console.error('[I18N] DeepL Error:', err.message || err);
  }
}

function applyTranslations(newMap) {
  Object.assign(CACHE, newMap);
  for (const k in newMap) {
    IN_FLIGHT_JOBS.delete(k);
    PENDING_JOBS.delete(k);
  }
  scheduleCachePersist();
  logCacheStatus();

  if (FEATURES.enableTranslationBridge && IS_WORKBENCH) {
    const broadcast = (win) => {
        if (!win || !win.frames) return;
        for (let i = 0; i < win.frames.length; i++) {
            const frame = win.frames[i];
            try {
                frame.postMessage({ type: 'I18N_BRIDGE_PUSH', newMap }, '*');
                broadcast(frame);
            } catch (e) {}
        }
    };
    broadcast(window);
  }

  logCacheStatus();
  requestAnimationFrame(() => {
    if (PENDING_ELEMENTS.size > 0) {
      for (const el of PENDING_ELEMENTS) {
        if (el.isConnected) walkAndTranslate(el);
      }
      PENDING_ELEMENTS.clear();
    }
  });
}

function scheduleTranslation(text) {
  if (I18N_TERMS[text] || CACHE[text] || PENDING_JOBS.has(text) || IN_FLIGHT_JOBS.has(text) || CONFIG.apiType === 'none') return;

  if (FEATURES.enableTranslationBridge && !IS_WORKBENCH) {
    if (window.top && window.top !== window.self && typeof window.top.postMessage === 'function') {
      PENDING_JOBS.add(text);
      window.top.postMessage({ type: 'I18N_BRIDGE_REQ', text }, '*');
    }
    return;
  }

  PENDING_JOBS.add(text);

  if (globalBatchTimer) clearTimeout(globalBatchTimer);
  globalBatchTimer = setTimeout(() => {
    let batch = Array.from(PENDING_JOBS);
    if (batch.length > 0) {
      batch.forEach(t => {
        PENDING_JOBS.delete(t);
        IN_FLIGHT_JOBS.add(t);
      });

      const chunkSize = 30;
      for (let i = 0; i < batch.length; i += chunkSize) {
        const chunk = batch.slice(i, i + chunkSize);
        callOnlineAPI(chunk);
      }
    }
  }, REQUEST_INTERVAL);
}

// === 4. 核心匹配逻辑与正则引擎 ===
let REGEX_RULES = [];

function initRegexRules() {
  if (!FEATURES.enableRegex || !I18N_TERMS.regex) return;
  for (const [pattern, template] of Object.entries(I18N_TERMS.regex)) {
    try { REGEX_RULES.push({ re: new RegExp(pattern), template }); } catch (e) { }
  }
}

function findInNestedDict(dict, key) {
  if (dict[key] && typeof dict[key] === 'string') return dict[key];
  for (const v of Object.values(dict)) {
    if (typeof v === 'object' && v !== null) {
      const res = findInNestedDict(v, key);
      if (res) return res;
    }
  }
  return null;
}

function getTranslation(text) {
  const t = text.trim();
  if (!t || t.length < 2) return null;
  if (isFileNameLike(t)) return null;
  const protectedInfo = protectTextForTranslation(t);
  const hasProtectedValues = protectedInfo.protectedValues.length > 0;

  if (hasProtectedValues && isOnlyProtectedPlaceholders(protectedInfo.text)) {
    if (CACHE[t]) {
      delete CACHE[t];
      scheduleCachePersist();
    }
    return null;
  }

  if (FEATURES.enableDictionary) {
      const direct = FEATURES.enableNestedDict ? findInNestedDict(I18N_TERMS, t) : I18N_TERMS[t];
      if (direct) return direct;
  }

  if (CACHE[t]) {
    if (!cachedValueKeepsProtectedTerms(CACHE[t], protectedInfo.protectedValues)) {
      delete CACHE[t];
      scheduleCachePersist();
    } else {
      return CACHE[t];
    }
  }

  if (FEATURES.enableRegex) {
      for (const rule of REGEX_RULES) {
        if (rule.re.test(t)) {
          const result = t.replace(rule.re, rule.template);
          CACHE[t] = result;
          return result;
        }
      }
  }

  if (HAS_CHINESE.test(t)) return null;

  scheduleTranslation(t);
  return null;
}

function isExcluded(node) {
  if (!node) return false;
  const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  if (!el) return false;
  if (el.closest('#i18n-skip-panel, #i18n-selector-chooser, #i18n-pick-toast, #i18n-hover-tooltip')) return true;

  for (const selector of SKIP_SELECTORS) {
    if (!selector || typeof selector !== 'string') continue;
    try {
      if (el.closest(selector)) {
        if (panelBypassSelectors.has(selector)) continue;
        if (node.nodeType === Node.ELEMENT_NODE) {
          console.warn(`[Live-Translator] 屏蔽区域匹配成功: ${selector}`, node);
        }
        return true;
      }
    } catch (e) { }
  }
  for (const selector of panelSkipSelectors) {
    try { if (el.closest(selector)) return true; } catch (e) {}
  }
  return false;
}

function processNode(node, skipExclusion) {
  if (!skipExclusion && isExcluded(node)) return;
  const raw = node.textContent.trim();
  const trans = getTranslation(raw);
  const parent = node.parentElement;

  if (trans && node.textContent.includes(raw)) {
    if (parent) {
      parent.classList.add('i18n-debug-highlight');
      if (FEATURES.enableLoadingAnimation) parent.classList.remove('i18n-loading');
      parent.setAttribute('data-i18n-original', raw);
    }
    node.textContent = node.textContent.replace(raw, trans);
  } else if (parent && (PENDING_JOBS.has(raw) || IN_FLIGHT_JOBS.has(raw))) {
    if (FEATURES.enableLoadingAnimation && !parent.classList.contains('i18n-loading')) {
      parent.classList.add('i18n-loading');
    }
    PENDING_ELEMENTS.add(parent);
  }
}

function processTitle(el, skipExclusion) {
  if (!skipExclusion && isExcluded(el)) return;
  const title = el.getAttribute('title');
  if (!title) return;
  const target = getTranslation(title.trim());
  if (target && title.includes(title.trim())) {
    el.classList.add('i18n-debug-highlight');
    el.setAttribute('data-i18n-original-title', title);
    el.setAttribute('title', title.replace(title.trim(), target));
  }
}

// === 5. DOM 驱动与监听 ===
let mutationBuffer = [];
let rafId = null;

function walkAndTranslate(root, skipExclusion) {
  if (!root || !root.isConnected) return;
  if (root.nodeType === Node.TEXT_NODE) {
    processNode(root, skipExclusion);
  } else if (root.nodeType === Node.ELEMENT_NODE) {
    if (SKIP_TAGS.has(root.tagName)) return;
    if (root.hasAttribute('title')) processTitle(root, skipExclusion);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, (n) => {
      return (n.parentElement && SKIP_TAGS.has(n.parentElement.tagName)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    });
    let textNode;
    while ((textNode = walker.nextNode())) processNode(textNode, skipExclusion);
  }
}

function handleMutations() {
  rafId = null;
  const nodes = mutationBuffer.splice(0, mutationBuffer.length);
  nodes.forEach(n => {
    if (!n.isConnected) return;
    walkAndTranslate(n);
    if (document.body.classList.contains('i18n-debug-active')) syncRedOverlays(n);
  });
}

const observer = new MutationObserver((mutations) => {
  let hasAct = false;
  for (const m of mutations) {
    if (m.type === 'childList') {
      m.addedNodes.forEach(n => { mutationBuffer.push(n); hasAct = true; });
    } else if (m.type === 'attributes' && m.attributeName === 'title') {
      mutationBuffer.push(m.target);
      hasAct = true;
    }
  }
  if (hasAct && !rafId) rafId = requestAnimationFrame(handleMutations);
});

function getPickSelectors(el) {
  const results = [];
  for (const attr of el.attributes) {
    if (attr.name.startsWith('data-') && !attr.name.startsWith('data-i18n') &&
        attr.value && attr.value.length < 60)
      results.push(`[${attr.name}="${attr.value}"]`);
  }
  if (el.id) results.push(`#${el.id}`);
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.length < 40) results.push(`[aria-label="${ariaLabel}"]`);
  const role = el.getAttribute('role');
  if (role) results.push(`[role="${role}"]`);
  const stableClasses = [...el.classList].filter(c =>
    !c.startsWith('i18n-') && c.length > 3 &&
    !/^(flex|grid|block|inline|hidden|relative|absolute|fixed|static|sticky)$/.test(c)
  );
  if (stableClasses.length) results.push('.' + stableClasses.slice(0, 3).join('.'));
  return results;
}

function getAncestorChain(el) {
  const parts = [];
  let cur = el.parentElement;
  let depth = 0;
  while (cur && cur !== document.body && depth < 3) {
    const tag = cur.tagName.toLowerCase();
    const cls = [...cur.classList]
      .filter(c => !c.startsWith('i18n-') && c.length > 3).slice(0, 2).join('.');
    parts.unshift(cls ? `${tag}.${cls}` : tag);
    cur = cur.parentElement;
    depth++;
  }
  return parts.join(' > ');
}

function getActivePreviewSelectors() {
  const selectors = [];
  for (const selector of SKIP_SELECTORS) {
    if (selector && !panelBypassSelectors.has(selector)) selectors.push(selector);
  }
  for (const selector of panelSkipSelectors) {
    if (selector) selectors.push(selector);
  }
  return selectors;
}

function syncRedOverlays(root) {
  const base = root
    ? (root.nodeType === Node.ELEMENT_NODE ? root : root.parentElement)
    : document.body;
  if (!base) return;

  if (!root) {
    document.querySelectorAll('.i18n-skip-preview').forEach(el => {
      el.classList.remove('i18n-skip-preview');
    });
  } else if (base.classList) {
    base.classList.remove('i18n-skip-preview');
    base.querySelectorAll('.i18n-skip-preview').forEach(el => {
      el.classList.remove('i18n-skip-preview');
    });
  }

  for (const selector of getActivePreviewSelectors()) {
    try {
      if (base.matches && base.matches(selector)) base.classList.add('i18n-skip-preview');
      base.querySelectorAll(selector).forEach(el => {
        el.classList.add('i18n-skip-preview');
      });
    } catch (e) {}
  }
}

function applyRedOverlay() {
  syncRedOverlays();
}

function removeRedOverlay() {
  syncRedOverlays();
}

function restoreElementText(el) {
  const original = el.getAttribute('data-i18n-original');
  if (!original) return;
  const trans = getTranslation(original);
  if (!trans) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.textContent.includes(trans)) {
      node.textContent = node.textContent.replace(trans, original);
    }
  }
}

function restoreOriginalInArea(selector) {
  try {
    document.querySelectorAll(selector).forEach(root => {
      restoreElementText(root);
      root.querySelectorAll('[data-i18n-original]').forEach(el => restoreElementText(el));
      root.querySelectorAll('[data-i18n-original-title]').forEach(el => {
        el.setAttribute('title', el.getAttribute('data-i18n-original-title'));
      });
    });
  } catch (e) {}
}

function retranslateArea(selector) {
  try {
    document.querySelectorAll(selector).forEach(el => walkAndTranslate(el));
  } catch (e) {}
}

function init() {
  try {
  if (SKIP_URLS.some(u => location.href.includes(u)) || SKIP_TITLES.some(t => document.title.includes(t))) return;

  if (window.__LIVE_I18N_INIT_DONE__) return;
  window.__LIVE_I18N_INIT_DONE__ = true;

  console.log('[I18N] init() starting...');

  window.addEventListener('beforeunload', () => { flushCache(); });

  initRegexRules();

  const style = document.createElement('style');
  style.textContent = DEBUG_STYLE;
  document.head.appendChild(style);

  const tooltip = document.createElement('div');
  tooltip.id = 'i18n-hover-tooltip';
  document.body.appendChild(tooltip);

  const skipPanel = document.createElement('div');
  skipPanel.id = 'i18n-skip-panel';
  skipPanel.style.display = 'none';
  skipPanel.innerHTML = `
    <div id="i18n-panel-header">
      <span>⛔ 屏蔽规则预览</span>
      <button id="i18n-panel-close">✕</button>
    </div>
    <div id="i18n-panel-body">
      <div class="i18n-panel-section">当前配置</div>
      <ul id="i18n-panel-inherited" style="list-style:none;margin:0;padding:0"></ul>
      <div class="i18n-panel-section" style="margin-top:4px">已拾取</div>
      <ul id="i18n-panel-picked" style="list-style:none;margin:0;padding:0"></ul>
    </div>
    <div id="i18n-panel-footer">
      <button id="i18n-panel-copy">复制已选</button>
      <button id="i18n-panel-clear">清除已拾取</button>
    </div>
  `;
  document.body.appendChild(skipPanel);

  const pickToast = document.createElement('div');
  pickToast.id = 'i18n-pick-toast';
  document.body.appendChild(pickToast);

  let toastTimer = null;
  const pickedRules = new Map();

  function showPickToast(text) {
    pickToast.textContent = text;
    pickToast.style.opacity = '1';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { pickToast.style.opacity = '0'; }, 2500);
  }

  function makePanelRuleItem(selector, type) {
    const li = document.createElement('li');
    li.className = 'i18n-rule-item';
    li.dataset.selector = selector;
    li.dataset.type = type;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'i18n-rule-checkbox';
    cb.checked = true;

    const label = document.createElement('span');
    label.className = 'i18n-rule-label' + (type === 'inherited' ? ' inherited' : '');
    label.textContent = selector;
    label.title = selector;

    li.appendChild(cb);
    li.appendChild(label);

    if (type === 'picked') {
      const del = document.createElement('button');
      del.className = 'i18n-rule-delete';
      del.textContent = '✕';
      del.title = '删除此规则';
      li.appendChild(del);
    } else {
      const lock = document.createElement('span');
      lock.className = 'i18n-rule-lock';
      lock.textContent = '🔒';
      li.appendChild(lock);
    }

    return li;
  }

  function populateInheritedRules() {
    const ul = document.getElementById('i18n-panel-inherited');
    if (!ul) return;
    ul.innerHTML = '';
    SKIP_SELECTORS.forEach(selector => {
      if (!selector) return;
      ul.appendChild(makePanelRuleItem(selector, 'inherited'));
    });
  }

  function addPickedRule(selector) {
    if (pickedRules.has(selector)) return;
    pickedRules.set(selector, { active: true });
    panelSkipSelectors.add(selector);
    applyRedOverlay(selector);
    restoreOriginalInArea(selector);
    const ul = document.getElementById('i18n-panel-picked');
    if (ul) ul.appendChild(makePanelRuleItem(selector, 'picked'));
  }

  function removePickedRule(selector) {
    if (!pickedRules.has(selector)) return;
    pickedRules.delete(selector);
    panelSkipSelectors.delete(selector);
    removeRedOverlay(selector);
    retranslateArea(selector);
    const ul = document.getElementById('i18n-panel-picked');
    if (ul) {
      const li = ul.querySelector(`[data-selector="${CSS.escape(selector)}"]`);
      if (li) li.remove();
    }
  }

  function onRuleCheckboxChange(li, checked) {
    const selector = li.dataset.selector;
    const type = li.dataset.type;
    if (type === 'inherited') {
      if (checked) {
        panelBypassSelectors.delete(selector);
        applyRedOverlay(selector);
        restoreOriginalInArea(selector);
      } else {
        panelBypassSelectors.add(selector);
        removeRedOverlay(selector);
        retranslateArea(selector);
      }
    } else {
      if (checked) {
        pickedRules.set(selector, { active: true });
        panelSkipSelectors.add(selector);
        applyRedOverlay(selector);
        restoreOriginalInArea(selector);
      } else {
        pickedRules.set(selector, { active: false });
        panelSkipSelectors.delete(selector);
        removeRedOverlay(selector);
        retranslateArea(selector);
      }
    }
  }

  skipPanel.addEventListener('change', (e) => {
    if (e.target.classList.contains('i18n-rule-checkbox')) {
      const li = e.target.closest('.i18n-rule-item');
      if (li) onRuleCheckboxChange(li, e.target.checked);
    }
  });

  skipPanel.addEventListener('click', (e) => {
    if (e.target.id === 'i18n-panel-close') {
      skipPanel.style.display = 'none';
      document.querySelectorAll('.i18n-skip-preview').forEach(el => el.classList.remove('i18n-skip-preview'));
    } else if (e.target.id === 'i18n-panel-copy') {
      const lines = [];
      skipPanel.querySelectorAll('.i18n-rule-item').forEach(li => {
        const cb = li.querySelector('.i18n-rule-checkbox');
        if (cb && cb.checked) lines.push(li.dataset.selector);
      });
      const text = lines.join('\n');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
          .then(() => showPickToast(`已复制 ${lines.length} 条规则`))
          .catch(() => showPickToast('复制失败'));
      } else {
        try {
          const ta = document.createElement('textarea');
          Object.assign(ta.style, { position: 'fixed', opacity: '0' });
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          showPickToast(`已复制 ${lines.length} 条规则`);
        } catch (_) { showPickToast('复制失败'); }
      }
    } else if (e.target.id === 'i18n-panel-clear') {
      [...pickedRules.keys()].forEach(s => removePickedRule(s));
      showPickToast('已清除所有已拾取规则');
    } else if (e.target.classList.contains('i18n-rule-delete')) {
      const li = e.target.closest('.i18n-rule-item');
      if (li) removePickedRule(li.dataset.selector);
    }
  });

  window.addEventListener('keydown', (e) => {
    const isToggle = (e.metaKey || e.ctrlKey) && e.altKey && e.shiftKey && e.code === 'KeyB';
    if (isToggle) {
      const newState = !document.body.classList.contains('i18n-debug-active');
      document.body.classList.toggle('i18n-debug-active', newState);
      if (FEATURES.enableTranslationBridge) {
        if (IS_WORKBENCH) {
          broadcastMessage({ type: 'I18N_DEBUG_SYNC', state: newState });
        } else if (window.top && window.top !== window.self) {
          window.top.postMessage({ type: 'I18N_DEBUG_SYNC', state: newState }, '*');
        }
      }
      console.log('[I18N] 调试模式已同步切换:', newState);
      if (newState) {
        skipPanel.style.display = 'flex';
        populateInheritedRules();
        SKIP_SELECTORS.forEach(s => { if (s) applyRedOverlay(s); });
      } else {
        [...panelBypassSelectors].forEach(selector => applyRedOverlay(selector));
        panelBypassSelectors.clear();
        [...SKIP_SELECTORS].forEach(selector => {
          if (selector) restoreOriginalInArea(selector);
        });
        [...panelSkipSelectors].forEach(selector => retranslateArea(selector));
        panelSkipSelectors.clear();
        skipPanel.style.display = 'none';
        document.querySelectorAll('.i18n-skip-preview').forEach(el => el.classList.remove('i18n-skip-preview'));
        chooser.style.display = 'none';
        chooserPath = [];
        chooserIndex = 0;
        chooserSelectors = [];
        chooserSelectedIndex = 0;
      }
    }
  });

  function broadcastMessage(data) {
    const broadcast = (win) => {
      if (!win || !win.frames) return;
      for (let i = 0; i < win.frames.length; i++) {
        const frame = win.frames[i];
        try {
          frame.postMessage(data, '*');
          broadcast(frame);
        } catch (e) { }
      }
    };
    broadcast(window);
  }

  const chooser = document.createElement('div');
  chooser.id = 'i18n-selector-chooser';
  chooser.style.display = 'none';
  document.body.appendChild(chooser);

  let chooserPath = [];
  let chooserIndex = 0;
  let chooserSelectors = [];
  let chooserSelectedIndex = 0;
  let chooserDrag = null;
  let chooserPosition = null;

  function moveChooser(left, top) {
    chooser.style.left = `${Math.max(8, Math.min(left, window.innerWidth - chooser.offsetWidth - 8))}px`;
    chooser.style.top = `${Math.max(8, Math.min(top, window.innerHeight - chooser.offsetHeight - 8))}px`;
    chooserPosition = { left: chooser.offsetLeft, top: chooser.offsetTop };
  }

  document.addEventListener('pointermove', (ev) => {
    if (!chooserDrag) return;
    moveChooser(ev.clientX - chooserDrag.offsetX, ev.clientY - chooserDrag.offsetY);
  });

  function clearDrag() { chooserDrag = null; }
  document.addEventListener('pointerup', clearDrag);
  document.addEventListener('mouseup', clearDrag);

  function updateChooserPreview() {
    const activeEl = chooserPath[chooserIndex];
    if (!activeEl) return;
    syncRedOverlays();
    activeEl.classList.add('i18n-skip-preview');
  }

  function renderChooser() {
    const activeEl = chooserPath[chooserIndex];
    if (!activeEl) return;
    chooserSelectors = getPickSelectors(activeEl).slice(0, 5);
    if (!chooserSelectors.length) {
      chooser.style.display = 'none';
      return;
    }
    chooser.style.display = 'block';
    if (chooserSelectedIndex >= chooserSelectors.length) chooserSelectedIndex = 0;
    const ancestor = getAncestorChain(activeEl);
    chooser.innerHTML = '';

    const title = document.createElement('div');
    title.id = 'i18n-chooser-title';
    const closeBtn = document.createElement('span');
    closeBtn.id = 'i18n-ch-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      chooser.style.display = 'none';
      syncRedOverlays();
    });
    title.textContent = `${ancestor ? `祖先: ${ancestor} | ` : ''}当前: <${activeEl.tagName.toLowerCase()}${activeEl.id ? `#${activeEl.id}` : ''}>`;
    title.appendChild(closeBtn);
    title.addEventListener('pointerdown', (ev) => {
      chooserDrag = {
        offsetX: ev.clientX - chooser.offsetLeft,
        offsetY: ev.clientY - chooser.offsetTop,
      };
      ev.preventDefault();
      ev.stopPropagation();
    });
    chooser.appendChild(title);

    const nav = document.createElement('div');
    nav.id = 'i18n-chooser-nav';
    const upBtn = document.createElement('button');
    upBtn.id = 'i18n-chooser-up';
    upBtn.textContent = '选择父/祖';
    upBtn.disabled = chooserIndex >= chooserPath.length - 1;
    const downBtn = document.createElement('button');
    downBtn.id = 'i18n-chooser-down';
    downBtn.textContent = '选择子/孙';
    downBtn.disabled = chooserIndex === 0;
    nav.appendChild(upBtn);
    nav.appendChild(downBtn);
    chooser.appendChild(nav);

    chooserSelectors.forEach((s, i) => {
      const item = document.createElement('div');
      item.className = 'i18n-chooser-item' + (i === 0 ? ' i18n-chooser-item-best' : '') + (i === chooserSelectedIndex ? ' active' : '');
      item.textContent = s;
      item.addEventListener('click', (ev) => {
        ev.stopPropagation();
        chooserSelectedIndex = i;
        renderChooser();
      });
      chooser.appendChild(item);
    });

    const actions = document.createElement('div');
    actions.id = 'i18n-chooser-actions';
    const confirmBtn = document.createElement('button');
    confirmBtn.id = 'i18n-chooser-confirm';
    confirmBtn.textContent = '确定添加';
    actions.appendChild(confirmBtn);
    chooser.appendChild(actions);

    upBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (chooserIndex < chooserPath.length - 1) {
        chooserIndex++;
        chooserSelectedIndex = 0;
        renderChooser();
        updateChooserPreview();
      }
    });

    downBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (chooserIndex > 0) {
        chooserIndex--;
        chooserSelectedIndex = 0;
        renderChooser();
        updateChooserPreview();
      }
    });

    confirmBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const selector = chooserSelectors[chooserSelectedIndex];
      if (!selector) return;
      chooser.style.display = 'none';
      addPickedRule(selector);
      syncRedOverlays();
      showPickToast(`已添加: ${selector}`);
    });
  }

  function showChooser(el, cx, cy) {
    chooserPath = [];
    let cur = el.nodeType === Node.ELEMENT_NODE ? el : el.parentElement;
    while (cur && cur !== document.body && chooserPath.length < 6) {
      chooserPath.push(cur);
      cur = cur.parentElement;
    }
    chooserIndex = 0;
    chooserSelectedIndex = 0;
    renderChooser();
    if (chooser.style.display === 'none') return;
    chooser.style.display = 'block';
    if (chooserPosition) {
      moveChooser(chooserPosition.left, chooserPosition.top);
    } else {
      moveChooser(cx + 8, cy + 8);
    }
    updateChooserPreview();
  }

  document.body.addEventListener('click', (e) => {
    if (!document.body.classList.contains('i18n-debug-active') || !e.altKey) return;
    if (e.target === chooser || chooser.contains(e.target)) return;
    if (e.target === skipPanel || skipPanel.contains(e.target)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (chooser.style.display !== 'none') {
      showChooser(e.target, e.clientX, e.clientY);
      return;
    }
    showChooser(e.target, e.clientX, e.clientY);
  }, true);

  // chooser 不再自动关闭，用户通过 ✕ 或"确定添加"手动关闭

  // 拦截 chooser / 面板上的 mousedown 和 pointerdown，防止底层菜单
  // 因捕获到"外部点击"而自动关闭（排除标题栏，标题栏需要 pointerdown 做拖拽）
  function isDragHandle(el) {
    return el && (el.id === 'i18n-chooser-title' || el.closest('#i18n-chooser-title'));
  }
  document.addEventListener('mousedown', (e) => {
    if ((chooser.contains(e.target) || skipPanel.contains(e.target)) && !isDragHandle(e.target)) {
      e.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener('pointerdown', (e) => {
    if ((chooser.contains(e.target) || skipPanel.contains(e.target)) && !isDragHandle(e.target)) {
      e.stopImmediatePropagation();
    }
  }, true);

  document.body.addEventListener('mouseover', (e) => {
    if (!document.body.classList.contains('i18n-debug-active') || !e.altKey) return;
    const target = e.target.closest('.i18n-debug-highlight');
    if (target) {
      const original = target.getAttribute('data-i18n-original') || target.getAttribute('data-i18n-original-title');
      if (original) {
        tooltip.textContent = `原文：${original}`;
        tooltip.style.display = 'block';
        tooltip.style.left = `${Math.min(e.clientX + 10, window.innerWidth - tooltip.offsetWidth - 20)}px`;
        tooltip.style.top = `${Math.min(e.clientY + 10, window.innerHeight - tooltip.offsetHeight - 20)}px`;
      }
    }
  });
  document.body.addEventListener('mouseout', () => { tooltip.style.display = 'none'; });

  if (FEATURES.enableTranslationBridge) {
    window.addEventListener('message', (e) => {
      if (!e.data || typeof e.data !== 'object') return;

      if (e.data.type === 'I18N_DEBUG_SYNC') {
        const state = !!e.data.state;
        if (document.body.classList.contains('i18n-debug-active') !== state) {
          document.body.classList.toggle('i18n-debug-active', state);
          if (IS_WORKBENCH) broadcastMessage({ type: 'I18N_DEBUG_SYNC', state });
        }
        return;
      }

      if (IS_WORKBENCH && e.data.type === 'I18N_BRIDGE_REQ') {
        const text = e.data.text;
        const trans = getTranslation(text);
        if (trans && e.source) {
          e.source.postMessage({ type: 'I18N_BRIDGE_PUSH', newMap: { [text]: trans } }, '*');
        }
      } else if (!IS_WORKBENCH && e.data.type === 'I18N_BRIDGE_PUSH') {
        applyTranslations(e.data.newMap);
      }
    });
  }

  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['title'] });
  walkAndTranslate(document.body, true);
  logCacheStatus();
  if (IS_WORKBENCH) {
     console.log(`%c[Live-Translator-Core]%c ${CONFIG.name ? `[${CONFIG.name}] ` : ''}动力系统就绪 | V3 (Eng: ${CONFIG.engineId || CONFIG.apiType})`, 'color:#8b5cf6;font-weight:bold', '');
  }
  } catch(e) {
    console.error('[I18N] init() crashed:', e && (e.message || e), e && e.stack);
  }
}

console.log('[I18N] About to call init(), document.body:', !!document.body);

if (document.body) { console.log('[I18N] Calling init() immediately'); init(); }
else { console.log('[I18N] Waiting for DOMContentLoaded'); document.addEventListener('DOMContentLoaded', init); }
window.__LIVE_I18N_INJECTED__ = true;
