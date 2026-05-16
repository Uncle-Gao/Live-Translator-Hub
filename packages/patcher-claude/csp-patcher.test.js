const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  getActiveApiOrigin,
  patchClaudeCspBundle,
  patchExtractedClaudeCsp,
} = require('./csp-patcher');

const BUNDLE = `function CBr(e,A,t=[]){const i=Object.keys(SRe),r=new Map(i.map(s=>[s,new Set])),n=r.get("script-src");for(const s of t)n.add(\`'sha256-\${s}'\`);for(const s of e)for(const a of WFA(gF[s].endpoints,A)){if(a.origin!=="renderer")continue;const g=[].concat(a.cspDirective??"connect-src");for(const c of g)r.get(c).add(\`https://\${a.host}\`)}return[["default-src","'self'"],["style-src","'self'","'unsafe-inline'"],["object-src","'none'"],["base-uri","'none'"],["font-src","'self'"],["form-action","'self'"],["media-src","'self'"],["worker-src","'self'","blob:"],["frame-ancestors","'self'"],["block-all-mixed-content"],["upgrade-insecure-requests"],...i.map(s=>[s,"'self'",...SRe[s],...r.get(s)])].map(s=>s.join(" ")).join("; ")}`;

test('getActiveApiOrigin returns null when Claude third-party inference mode is disabled', () => {
  const origin = getActiveApiOrigin({
    enableThirdPartyInferenceMode: false,
    activeId: 'openai',
    engines: { openai: { baseURL: 'https://api.deepseek.com/v1' } },
  });
  assert.equal(origin, null);
});

test('getActiveApiOrigin extracts HTTPS origin only when Claude third-party inference mode is enabled', () => {
  const origin = getActiveApiOrigin({
    enableThirdPartyInferenceMode: true,
    activeId: 'openai',
    engines: { openai: { baseURL: 'https://api.deepseek.com/v1' } },
  });
  assert.equal(origin, 'https://api.deepseek.com');
});

test('getActiveApiOrigin supports safe localhost HTTP origins when enabled', () => {
  const origin = getActiveApiOrigin({
    enableThirdPartyInferenceMode: true,
    activeId: 'openai',
    engines: { openai: { baseURL: 'http://127.0.0.1:3456/v1' } },
  });
  assert.equal(origin, 'http://127.0.0.1:3456');
});

test('getActiveApiOrigin rejects public plain HTTP origins', () => {
  const origin = getActiveApiOrigin({
    enableThirdPartyInferenceMode: true,
    activeId: 'openai',
    engines: { openai: { baseURL: 'http://api.deepseek.com/v1' } },
  });
  assert.equal(origin, null);
});

test('getActiveApiOrigin uses provider defaults when enabled and baseURL is missing', () => {
  assert.equal(
    getActiveApiOrigin({ enableThirdPartyInferenceMode: true, activeId: 'openai', engines: { openai: {} } }),
    'https://api.openai.com'
  );
  assert.equal(
    getActiveApiOrigin({ enableThirdPartyInferenceMode: true, activeId: 'anthropic', engines: { anthropic: {} } }),
    'https://api.anthropic.com'
  );
  assert.equal(
    getActiveApiOrigin({ enableThirdPartyInferenceMode: true, activeId: 'gemini', engines: { gemini: {} } }),
    'https://generativelanguage.googleapis.com'
  );
  assert.equal(
    getActiveApiOrigin({ enableThirdPartyInferenceMode: true, activeId: 'deepl', engines: { deepl: { apiKey: 'abc' } } }),
    'https://api.deepl.com'
  );
  assert.equal(
    getActiveApiOrigin({ enableThirdPartyInferenceMode: true, activeId: 'deepl', engines: { deepl: { apiKey: 'abc:fx' } } }),
    'https://api-free.deepl.com'
  );
});

test('getActiveApiOrigin returns null for disabled or missing active engine', () => {
  assert.equal(getActiveApiOrigin({ enableThirdPartyInferenceMode: true, activeId: 'none', engines: {} }), null);
  assert.equal(getActiveApiOrigin({ enableThirdPartyInferenceMode: true, activeId: 'openai', engines: {} }), null);
  assert.equal(getActiveApiOrigin({ enableThirdPartyInferenceMode: true, activeId: null, engines: {} }), null);
});

test('patchClaudeCspBundle appends origin only to connect-src arrays', () => {
  const result = patchClaudeCspBundle(BUNDLE, 'https://api.deepseek.com');
  assert.equal(result.changed, true);
  assert.match(result.content, /\.map\(s=>s\.join\(" "\)\)/);
  assert.match(result.content, /s==="connect-src"\?\["https:\/\/api\.deepseek\.com"\]:\[\]/);
  assert.doesNotMatch(result.content, /script-src[^\n]+api\.deepseek\.com/);
});

test('patchClaudeCspBundle is idempotent for the same origin', () => {
  const once = patchClaudeCspBundle(BUNDLE, 'https://api.deepseek.com');
  const twice = patchClaudeCspBundle(once.content, 'https://api.deepseek.com');
  assert.equal(once.changed, true);
  assert.equal(twice.changed, false);
  assert.equal(twice.content, once.content);
});

test('patchClaudeCspBundle throws when Claude CSP builder pattern is missing', () => {
  assert.throws(
    () => patchClaudeCspBundle('const unrelated = true;', 'https://api.deepseek.com'),
    /Unable to locate Claude CSP builder/
  );
});

test('patchExtractedClaudeCsp skips file changes when mode is disabled', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-csp-test-'));
  const bundlePath = path.join(dir, '.vite', 'build', 'index.js');
  fs.mkdirSync(path.dirname(bundlePath), { recursive: true });
  fs.writeFileSync(bundlePath, BUNDLE, 'utf8');

  const result = patchExtractedClaudeCsp(dir, {
    enableThirdPartyInferenceMode: false,
    activeId: 'openai',
    engines: { openai: { baseURL: 'https://api.deepseek.com/v1' } },
  });
  const unchanged = fs.readFileSync(bundlePath, 'utf8');

  assert.deepEqual(result, { enabled: false, changed: false, origin: null });
  assert.equal(unchanged, BUNDLE);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('patchExtractedClaudeCsp updates .vite/build/index.js under extracted app directory when mode is enabled', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-csp-test-'));
  const bundlePath = path.join(dir, '.vite', 'build', 'index.js');
  fs.mkdirSync(path.dirname(bundlePath), { recursive: true });
  fs.writeFileSync(bundlePath, BUNDLE, 'utf8');

  const result = patchExtractedClaudeCsp(dir, {
    enableThirdPartyInferenceMode: true,
    activeId: 'openai',
    engines: { openai: { baseURL: 'https://api.deepseek.com/v1' } },
  });
  const updated = fs.readFileSync(bundlePath, 'utf8');

  assert.deepEqual(result, { enabled: true, changed: true, origin: 'https://api.deepseek.com' });
  assert.match(updated, /api\.deepseek\.com/);
  fs.rmSync(dir, { recursive: true, force: true });
});
