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
  enableLoadingAnimation: true
}, CONFIG.features || {});

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE', 'KBD', 'SAMP']);
const SKIP_TITLES = CONFIG.skip?.titles || [];
const SKIP_URLS = CONFIG.skip?.urls || [];
const SKIP_SELECTORS = CONFIG.skip?.selectors || [];
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

async function callOnlineAPI(texts) {
  if (CONFIG.apiType === 'none') return;
  const engine = CONFIG[CONFIG.apiType];
  if (!engine?.apiKey) return;

  if (CONFIG.apiType === 'openai')    await callOpenAI(texts);
  else if (CONFIG.apiType === 'anthropic') await callAnthropic(texts);
  else if (CONFIG.apiType === 'gemini')    await callGemini(texts);
  else if (CONFIG.apiType === 'deepl')     await callDeepL(texts);
}

async function callOpenAI(texts) {
  const langName = CONFIG.targetLanguage || 'Simplified Chinese';
  const prompt = `Translate software UI strings to ${langName} (Faithful, Expressive, Elegant).
Return JSON ONLY with keys as original strings and values as translated strings.
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
    applyTranslations(result);
  } catch (err) {
    console.error('[I18N] OpenAI Error:', err.message || err);
  }
}

async function callAnthropic(texts) {
  const langName = CONFIG.targetLanguage || 'Simplified Chinese';
  const prompt = `Translate software UI strings to ${langName} (Faithful, Expressive, Elegant).
Return JSON ONLY: {"translations": ["t1", "t2", ...]} with exactly ${texts.length} items.
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
    const result = {};
    texts.forEach((t, i) => { result[t] = translations[i]; });
    applyTranslations(result);
  } catch (err) {
    console.error('[I18N] Anthropic Error:', err.message || err);
  }
}

async function callGemini(texts) {
  const langName = CONFIG.targetLanguage || 'Simplified Chinese';
  const prompt = `You are a professional software UI translator. Translate these ${texts.length} UI strings to ${langName}.

CRITICAL RULES:
1. Return ONLY a valid JSON object: {"translations": ["t1", "t2", ...]}
2. The array length MUST exactly match the number of input strings (${texts.length}).
3. Preserve ALL placeholders: $1, $2, {name}, {{count}}, %s, %d, etc.
4. Do NOT add explanations or comments.

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
    const result = {};
    texts.forEach((t, i) => { result[t] = translations[i]; });
    applyTranslations(result);
  } catch (err) {
    console.error('[I18N] Gemini Error:', err.message || err);
  }
}

async function callDeepL(texts) {
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
      data.translations.forEach((t, i) => { results[texts[i]] = t.text; });
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

  if (FEATURES.enableDictionary) {
      const direct = FEATURES.enableNestedDict ? findInNestedDict(I18N_TERMS, t) : I18N_TERMS[t];
      if (direct) return direct;
  }

  if (CACHE[t]) return CACHE[t];

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

  for (const selector of SKIP_SELECTORS) {
    if (!selector || typeof selector !== 'string') continue;
    try {
      if (el.closest(selector)) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          console.warn(`[Live-Translator] 屏蔽区域匹配成功: ${selector}`, node);
        }
        return true;
      }
    } catch (e) { }
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
  nodes.forEach(n => { if (n.isConnected) walkAndTranslate(n); });
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

function init() {
  if (SKIP_URLS.some(u => location.href.includes(u)) || SKIP_TITLES.some(t => document.title.includes(t))) return;
  
  if (window.__LIVE_I18N_INIT_DONE__) return;
  window.__LIVE_I18N_INIT_DONE__ = true;

  window.addEventListener('beforeunload', () => { flushCache(); });

  initRegexRules();

  const style = document.createElement('style');
  style.textContent = DEBUG_STYLE;
  document.head.appendChild(style);

  const tooltip = document.createElement('div');
  tooltip.id = 'i18n-hover-tooltip';
  document.body.appendChild(tooltip);

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
}

if (document.body) init();
else document.addEventListener('DOMContentLoaded', init);
window.__LIVE_I18N_INJECTED__ = true;
