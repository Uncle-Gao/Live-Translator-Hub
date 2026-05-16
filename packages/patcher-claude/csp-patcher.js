const fs = require('fs');
const path = require('path');

const DEFAULT_BASE_URLS = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com',
  gemini: 'https://generativelanguage.googleapis.com',
};

function isSafeHttpLocalhost(url) {
  return url.protocol === 'http:' && (url.hostname === '127.0.0.1' || url.hostname === 'localhost');
}

function normalizeOrigin(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  try {
    const url = new URL(rawUrl.trim());
    if (url.protocol === 'https:' || isSafeHttpLocalhost(url)) {
      return url.origin;
    }
  } catch {}
  return null;
}

function getDefaultBaseURL(apiType, engine) {
  if (apiType === 'deepl') {
    const apiKey = engine?.apiKey || '';
    return apiKey.endsWith(':fx') ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate';
  }
  return DEFAULT_BASE_URLS[apiType] || null;
}

function getActiveApiOrigin(config = {}) {
  if (!config.enableThirdPartyInferenceMode) return null;
  const apiType = config.activeId === 'none' || !config.activeId ? 'none' : config.activeId;
  if (apiType === 'none') return null;
  const engine = config.engines?.[apiType];
  if (!engine) return null;
  const baseURL = engine.baseURL || getDefaultBaseURL(apiType, engine);
  return normalizeOrigin(baseURL);
}

function patchClaudeCspBundle(source, origin) {
  if (!origin) return { changed: false, content: source };
  if (source.includes(`s==="connect-src"?["${origin}"]:[]`)) {
    return { changed: false, content: source };
  }
  const pattern = `...i.map(s=>[s,"'self'",...SRe[s],...r.get(s)])`;
  if (!source.includes(pattern)) {
    throw new Error('Unable to locate Claude CSP builder pattern in .vite/build/index.js');
  }
  const replacement = `...i.map(s=>[s,"'self'",...SRe[s],...r.get(s),...(\n/* live-translator-csp: ${origin} */\ns==="connect-src"?[${JSON.stringify(origin)}]:[])])`;
  return { changed: true, content: source.replace(pattern, replacement) };
}

function patchExtractedClaudeCsp(extractedAppDir, config = {}) {
  if (!config.enableThirdPartyInferenceMode) {
    return { enabled: false, changed: false, origin: null };
  }
  const origin = getActiveApiOrigin(config);
  if (!origin) {
    return { enabled: true, changed: false, origin: null };
  }
  const bundlePath = path.join(extractedAppDir, '.vite', 'build', 'index.js');
  const source = fs.readFileSync(bundlePath, 'utf8');
  const result = patchClaudeCspBundle(source, origin);
  if (result.changed) {
    fs.writeFileSync(bundlePath, result.content, 'utf8');
  }
  return { enabled: true, changed: result.changed, origin };
}

module.exports = { getActiveApiOrigin, patchClaudeCspBundle, patchExtractedClaudeCsp };
