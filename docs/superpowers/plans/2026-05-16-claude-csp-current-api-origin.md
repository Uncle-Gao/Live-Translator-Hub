# Claude 第三方推理模式 CSP 修改实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 只在 Hub 的 Claude 页面中提供“在第三方推理模式中启用”开关；开启后，Claude patcher 在部署 Claude 时只把当前 Claude 翻译引擎配置的 API `baseURL` origin 追加到 Claude 本地/第三方推理模式的 `connect-src` CSP 中，让 DeepSeek/OpenAI-compatible 等直连可用，不影响 Hub 的 Cursor 页面和 Cursor patcher。

**架构：** 新增 `@live-translator/patcher-claude` 内部的独立 CSP patch 模块，模块只负责“提取当前配置 API origin”和“patch Claude 解包后的主进程 bundle”。`ClaudePatcher.install()` 已经会解包 Claude `app.asar`，因此 CSP patch 不单独解包，只在现有解包后的 `TEMP_DIR` 上执行；部署配置中的 `enableThirdPartyInferenceMode` 为真时才调用该模块。Claude UI 的开关只写入 `config.claude`，不修改 `config.cursor`、Cursor 页面或 Cursor 部署流程。

**技术栈：** React 19、Zustand、i18next、Node.js CommonJS、`@electron/asar`、Electron app.asar patch 流程、Node 内置 `node:test` 与 `node:assert/strict`。

---

## 文件结构

- 创建：`packages/patcher-claude/csp-patcher.js`
  - 职责：独立 CSP patch 包。提供纯函数 `getActiveApiOrigin(config)`、`patchClaudeCspBundle(source, origin)`，以及文件级函数 `patchExtractedClaudeCsp(extractedAppDir, config)`。不依赖 UI，不触碰 Cursor。
- 创建：`packages/patcher-claude/csp-patcher.test.js`
  - 职责：用 Node 内置测试框架覆盖配置开关、origin 提取、CSP patch、解包目录文件 patch。
- 修改：`packages/patcher-claude/index.js:341-388`
  - 职责：在现有 Claude `install()` 的 `asar.extractAll(extractionSource, TEMP_DIR)` 之后、翻译引擎注入之前，按配置调用 `patchExtractedClaudeCsp(TEMP_DIR, config)`。
- 修改：`packages/desktop-app/src/store/configStore.js:43-76`
  - 职责：给 `config.claude` 增加默认值 `enableThirdPartyInferenceMode: false`；不向 `config.cursor` 添加该字段。
- 修改：`packages/desktop-app/src/components/ClaudePanel/DeployConfig.jsx:79-126`
  - 职责：只在 Claude 页面高级部署配置中添加“在第三方推理模式中启用”复选框和说明文案。
- 修改：`packages/desktop-app/src/locales/zh-CN.json`
  - 职责：新增 Claude 第三方推理模式开关中文文案。
- 修改：`packages/desktop-app/src/locales/en-US.json`
  - 职责：新增 Claude 第三方推理模式开关英文文案。
- 不修改：`packages/desktop-app/src/components/CursorPanel/DeployConfig.jsx`
  - 原因：该功能是 Claude 本地/第三方推理模式专有，不带入 Cursor 页面。
- 不修改：`packages/patcher-cursor/index.js`
  - 原因：Cursor 已有自己的 CSP 处理逻辑，本计划不改变 Cursor patch 行为。
- 不修改：`packages/core/src/translator-engine.js`
  - 原因：现有请求逻辑继续使用 `${baseURL}/chat/completions` 等路径，本计划只解决 Claude renderer CSP 拦截。

## 关键约束

- 默认关闭：旧用户升级后不改变部署行为。
- 只在 `config.claude.enableThirdPartyInferenceMode === true` 时 patch Claude CSP。
- 只追加当前 Claude 部署配置里的 active engine 域名，不写死 `api.deepseek.com`、`api.openai.com` 等全量白名单。
- 只允许 `https:` origin，以及本地调试 origin：`http://127.0.0.1:<port>`、`http://localhost:<port>`。
- 不允许普通公网 `http:`，避免 API Key 明文传输。
- `baseURL` 可能包含路径，例如 `https://api.deepseek.com/v1`，追加到 CSP 的只能是 `https://api.deepseek.com`。
- `deepl` 的默认 baseURL 可能是完整 endpoint：`https://api.deepl.com/v2/translate`，追加 origin 仍为 `https://api.deepl.com`。
- 如果开关关闭、`apiType` 为 `none`、active engine 缺失、baseURL 非法或不安全，则不 patch CSP。
- 如果开关开启且已提取到安全 origin，但 Claude bundle 结构变化导致模式不匹配，部署应抛出明确错误，提示无法应用第三方推理模式 CSP patch。

---

### 任务 1：创建独立 CSP patch 包的失败测试

**文件：**
- 创建：`packages/patcher-claude/csp-patcher.js`
- 创建：`packages/patcher-claude/csp-patcher.test.js`

- [ ] **步骤 1：创建最小空模块**

创建 `packages/patcher-claude/csp-patcher.js`，内容如下，使测试文件可以加载模块但功能尚未实现：

```js
function getActiveApiOrigin() {
  return null;
}

function patchClaudeCspBundle(source) {
  return { changed: false, content: source };
}

function patchExtractedClaudeCsp() {
  return { enabled: false, changed: false, origin: null };
}

module.exports = {
  getActiveApiOrigin,
  patchClaudeCspBundle,
  patchExtractedClaudeCsp,
};
```

- [ ] **步骤 2：编写失败测试**

创建 `packages/patcher-claude/csp-patcher.test.js`，内容如下：

```js
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
    engines: {
      openai: { baseURL: 'https://api.deepseek.com/v1' },
    },
  });

  assert.equal(origin, null);
});

test('getActiveApiOrigin extracts HTTPS origin only when Claude third-party inference mode is enabled', () => {
  const origin = getActiveApiOrigin({
    enableThirdPartyInferenceMode: true,
    activeId: 'openai',
    engines: {
      openai: { baseURL: 'https://api.deepseek.com/v1' },
    },
  });

  assert.equal(origin, 'https://api.deepseek.com');
});

test('getActiveApiOrigin supports safe localhost HTTP origins when enabled', () => {
  const origin = getActiveApiOrigin({
    enableThirdPartyInferenceMode: true,
    activeId: 'openai',
    engines: {
      openai: { baseURL: 'http://127.0.0.1:3456/v1' },
    },
  });

  assert.equal(origin, 'http://127.0.0.1:3456');
});

test('getActiveApiOrigin rejects public plain HTTP origins', () => {
  const origin = getActiveApiOrigin({
    enableThirdPartyInferenceMode: true,
    activeId: 'openai',
    engines: {
      openai: { baseURL: 'http://api.deepseek.com/v1' },
    },
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
```

- [ ] **步骤 3：运行测试验证失败**

运行：

```bash
node --test packages/patcher-claude/csp-patcher.test.js
```

预期：测试失败，至少包含类似输出：

```text
not ok 2 - getActiveApiOrigin extracts HTTPS origin only when Claude third-party inference mode is enabled
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal
+ actual - expected

+ null
- 'https://api.deepseek.com'
```

---

### 任务 2：实现独立 CSP patch 包

**文件：**
- 修改：`packages/patcher-claude/csp-patcher.js`
- 测试：`packages/patcher-claude/csp-patcher.test.js`

- [ ] **步骤 1：实现 `csp-patcher.js`**

将 `packages/patcher-claude/csp-patcher.js` 替换为：

```js
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

  const pattern = '...i.map(s=>[s,"\'self\'",...SRe[s],...r.get(s)])';
  if (!source.includes(pattern)) {
    throw new Error('Unable to locate Claude CSP builder pattern in .vite/build/index.js');
  }

  const replacement = `...i.map(s=>[s,"'self'",...SRe[s],...r.get(s),...(s==="connect-src"?[${JSON.stringify(origin)}]:[])])`;
  return {
    changed: true,
    content: source.replace(pattern, replacement),
  };
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

module.exports = {
  getActiveApiOrigin,
  patchClaudeCspBundle,
  patchExtractedClaudeCsp,
};
```

- [ ] **步骤 2：运行测试验证通过**

运行：

```bash
node --test packages/patcher-claude/csp-patcher.test.js
```

预期：全部通过，输出包含：

```text
# pass 11
# fail 0
```

- [ ] **步骤 3：重复运行确认幂等测试稳定**

运行：

```bash
node --test packages/patcher-claude/csp-patcher.test.js
```

预期：全部通过，重复运行不会改变测试结论。

- [ ] **步骤 4：Commit**

```bash
git add packages/patcher-claude/csp-patcher.js packages/patcher-claude/csp-patcher.test.js
git commit -m "feat: add Claude third-party CSP patcher"
```

---

### 任务 3：把 CSP patch 包融入 Claude 现有部署解包流程

**文件：**
- 修改：`packages/patcher-claude/index.js:7-8`
- 修改：`packages/patcher-claude/index.js:341-389`
- 测试：`packages/patcher-claude/csp-patcher.test.js`

- [ ] **步骤 1：导入独立 CSP patch 包**

在 `packages/patcher-claude/index.js` 顶部依赖区，当前内容附近为：

```js
const sudo = require('sudo-prompt');
const asar = require('@electron/asar');
```

修改为：

```js
const sudo = require('sudo-prompt');
const asar = require('@electron/asar');
const { patchExtractedClaudeCsp } = require('./csp-patcher');
```

- [ ] **步骤 2：在现有解包后调用 CSP patch 包**

在 `packages/patcher-claude/index.js` 中找到：

```js
        onProgress(`从 ${path.basename(extractionSource)} 提取应用包...`);
        asar.extractAll(extractionSource, TEMP_DIR);

        onProgress('编译并组装引擎代码...');
        const engineCode = fs.readFileSync(ENGINE_SOURCE, 'utf8');
```

替换为：

```js
        onProgress(`从 ${path.basename(extractionSource)} 提取应用包...`);
        asar.extractAll(extractionSource, TEMP_DIR);

        const cspResult = patchExtractedClaudeCsp(TEMP_DIR, config);
        if (cspResult.enabled && cspResult.origin) {
            onProgress(cspResult.changed
                ? `已启用第三方推理模式，允许 Claude 页面访问: ${cspResult.origin}`
                : `第三方推理模式已存在允许项: ${cspResult.origin}`);
        } else if (cspResult.enabled) {
            onProgress('第三方推理模式已启用，但未检测到可追加到 CSP 的安全 API 域名。');
        }

        onProgress('编译并组装引擎代码...');
        const engineCode = fs.readFileSync(ENGINE_SOURCE, 'utf8');
```

- [ ] **步骤 3：运行 CSP patch 包测试**

运行：

```bash
node --test packages/patcher-claude/csp-patcher.test.js
```

预期：全部通过，输出包含：

```text
# fail 0
```

- [ ] **步骤 4：验证关闭开关时部署流程不输出 CSP 文案**

运行静态检查：

```bash
node - <<'NODE'
const { patchExtractedClaudeCsp } = require('./packages/patcher-claude/csp-patcher');
const result = patchExtractedClaudeCsp('/tmp/nonexistent-claude-dir', { enableThirdPartyInferenceMode: false });
console.log(JSON.stringify(result));
NODE
```

预期输出：

```text
{"enabled":false,"changed":false,"origin":null}
```

该验证证明关闭开关时不会读取不存在的解包目录，也不会进入 CSP patch。

- [ ] **步骤 5：Commit**

```bash
git add packages/patcher-claude/index.js
git commit -m "feat: enable Claude CSP patch during deploy"
```

---

### 任务 4：只在 Claude 页面添加“在第三方推理模式中启用”配置

**文件：**
- 修改：`packages/desktop-app/src/store/configStore.js:43-76`
- 修改：`packages/desktop-app/src/components/ClaudePanel/DeployConfig.jsx:79-126`
- 修改：`packages/desktop-app/src/locales/zh-CN.json`
- 修改：`packages/desktop-app/src/locales/en-US.json`
- 不修改：`packages/desktop-app/src/components/CursorPanel/DeployConfig.jsx`

- [ ] **步骤 1：给 Claude 配置增加默认值**

在 `packages/desktop-app/src/store/configStore.js` 的 `config.claude` 默认配置中，当前结尾附近为：

```js
      },
      cacheVersion: 0,
    },
```

修改为：

```js
      },
      cacheVersion: 0,
      enableThirdPartyInferenceMode: false,
    },
```

- [ ] **步骤 2：在 Claude 高级部署配置中添加复选框**

在 `packages/desktop-app/src/components/ClaudePanel/DeployConfig.jsx` 中，找到清空缓存复选框结束处：

```jsx
              <label className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/[0.08] transition-all group">
                <div>
                  <span className="text-sm font-medium text-white/60 group-hover:text-white/90">{t('resetCacheOnDeploy', '清空 AI 翻译缓存（仅一次）')}</span>
                  <p className="text-[10px] text-white/30 mt-0.5">{t('resetCacheDesc', '清除 localStorage 中的 AI 翻译缓存，下次启动时重新翻译')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!claude.cacheVersion}
                  onChange={e => updateClaudeConfig({ cacheVersion: e.target.checked ? Date.now() : 0 })}
                  className="w-5 h-5 rounded-lg bg-black/40 border-white/10 text-purple-500 focus:ring-purple-500/20 shrink-0 ml-3"
                />
              </label>
```

在它后面插入：

```jsx
              <label className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/[0.08] transition-all group">
                <div>
                  <span className="text-sm font-medium text-white/60 group-hover:text-white/90">{t('enableThirdPartyInferenceMode', '在第三方推理模式中启用')}</span>
                  <p className="text-[10px] text-white/30 mt-0.5">{t('enableThirdPartyInferenceModeDesc', '为 Claude 本地/第三方推理模式追加当前翻译 API 域名到 CSP，仅影响 Claude 部署')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!claude.enableThirdPartyInferenceMode}
                  onChange={e => updateClaudeConfig({ enableThirdPartyInferenceMode: e.target.checked })}
                  className="w-5 h-5 rounded-lg bg-black/40 border-white/10 text-purple-500 focus:ring-purple-500/20 shrink-0 ml-3"
                />
              </label>
```

- [ ] **步骤 3：新增中文 i18n 文案**

在 `packages/desktop-app/src/locales/zh-CN.json` 中新增或确认存在以下 key：

```json
{
  "enableThirdPartyInferenceMode": "在第三方推理模式中启用",
  "enableThirdPartyInferenceModeDesc": "为 Claude 本地/第三方推理模式追加当前翻译 API 域名到 CSP，仅影响 Claude 部署"
}
```

如果文件已有这些 key，不重复添加。

- [ ] **步骤 4：新增英文 i18n 文案**

在 `packages/desktop-app/src/locales/en-US.json` 中新增或确认存在以下 key：

```json
{
  "enableThirdPartyInferenceMode": "Enable in third-party inference mode",
  "enableThirdPartyInferenceModeDesc": "Add the current translation API domain to Claude CSP for local/third-party inference mode. Claude deployment only."
}
```

如果文件已有这些 key，不重复添加。

- [ ] **步骤 5：确认 Cursor 页面未出现该配置**

运行：

```bash
grep -R "enableThirdPartyInferenceMode\|第三方推理模式" -n packages/desktop-app/src/components/CursorPanel packages/patcher-cursor || true
```

预期：无输出。

- [ ] **步骤 6：运行 i18n 提取**

运行：

```bash
npm run i18n:extract -w desktop-app
```

预期：命令完成，`zh-CN.json` 和 `en-US.json` 保留上述 key，没有新增 `__STRING_NOT_TRANSLATED__`。

- [ ] **步骤 7：Commit**

```bash
git add packages/desktop-app/src/store/configStore.js packages/desktop-app/src/components/ClaudePanel/DeployConfig.jsx packages/desktop-app/src/locales/zh-CN.json packages/desktop-app/src/locales/en-US.json
git commit -m "feat: add Claude third-party inference toggle"
```

---

### 任务 5：真实 Claude bundle 模式验证与构建验证

**文件：**
- 测试：`packages/patcher-claude/csp-patcher.test.js`
- 不创建长期脚本文件

- [ ] **步骤 1：用当前安装的 Claude app.asar 验证 patch 模式仍命中**

运行：

```bash
node - <<'NODE'
const asar = require('@electron/asar');
const { patchClaudeCspBundle } = require('./packages/patcher-claude/csp-patcher');
const source = asar.extractFile('/Applications/Claude.app/Contents/Resources/app.asar', '.vite/build/index.js').toString('utf8');
const result = patchClaudeCspBundle(source, 'https://api.deepseek.com');
console.log(JSON.stringify({ changed: result.changed, hasDeepSeek: result.content.includes('https://api.deepseek.com') }));
NODE
```

预期输出：

```text
{"changed":true,"hasDeepSeek":true}
```

- [ ] **步骤 2：验证重复 patch 不会重复插入**

运行：

```bash
node - <<'NODE'
const asar = require('@electron/asar');
const { patchClaudeCspBundle } = require('./packages/patcher-claude/csp-patcher');
const source = asar.extractFile('/Applications/Claude.app/Contents/Resources/app.asar', '.vite/build/index.js').toString('utf8');
const once = patchClaudeCspBundle(source, 'https://api.deepseek.com');
const twice = patchClaudeCspBundle(once.content, 'https://api.deepseek.com');
console.log(JSON.stringify({ firstChanged: once.changed, secondChanged: twice.changed }));
NODE
```

预期输出：

```text
{"firstChanged":true,"secondChanged":false}
```

- [ ] **步骤 3：运行单元测试**

运行：

```bash
node --test packages/patcher-claude/csp-patcher.test.js
```

预期：全部通过，输出包含：

```text
# fail 0
```

- [ ] **步骤 4：运行桌面端 lint**

运行：

```bash
npm run lint -w desktop-app
```

预期：命令完成。若出现既有 warning，可记录；若出现本次新增 error，修复后重跑。

- [ ] **步骤 5：运行前端 dist 构建，不做 release 构建**

运行：

```bash
npm run dist -w desktop-app
```

预期：Vite 前端和 Electron 打包前的 dist 构建完成。不要运行 release 构建命令。

- [ ] **步骤 6：Commit 验证相关修复**

如果任务 5 没有产生文件变更，跳过 commit。若为了修复验证失败修改了文件，则运行：

```bash
git add packages/patcher-claude/csp-patcher.js packages/patcher-claude/csp-patcher.test.js packages/patcher-claude/index.js packages/desktop-app/src/components/ClaudePanel/DeployConfig.jsx packages/desktop-app/src/store/configStore.js packages/desktop-app/src/locales/zh-CN.json packages/desktop-app/src/locales/en-US.json
git commit -m "test: verify Claude third-party CSP patch"
```

---

### 任务 6：手动 UI 与部署验证

**文件：**
- 修改：无
- 验证对象：Live Translator Hub 开发模式、Claude 桌面客户端

- [ ] **步骤 1：启动开发版 Live Translator Hub**

运行：

```bash
npm run dev
```

预期：Electron + Vite 开发版启动，终端无启动失败错误。

- [ ] **步骤 2：确认开关只出现在 Claude 页面**

在 Hub 中打开 Claude 页面 → 部署配置 → 高级设置。

预期：可以看到：

```text
在第三方推理模式中启用
```

打开 Cursor 页面 → 部署配置 → 高级设置。

预期：看不到“第三方推理模式”相关配置。

- [ ] **步骤 3：关闭开关部署一次，确认不会 patch CSP**

在 Claude 页面保持“在第三方推理模式中启用”未勾选，执行部署。

预期：部署日志不出现：

```text
已启用第三方推理模式
第三方推理模式已存在允许项
第三方推理模式已启用，但未检测到可追加到 CSP 的安全 API 域名
```

- [ ] **步骤 4：开启开关并配置 DeepSeek/OpenAI-compatible 直连**

在 Claude 页面配置：

```text
运行时引擎：OpenAI-compatible 对应的引擎
Base URL：https://api.deepseek.com/v1
Model：deepseek-chat
API Key：使用用户自己的有效 key
在第三方推理模式中启用：勾选
```

预期：配置保存成功。不要把 API Key 写入日志、截图或提交。

- [ ] **步骤 5：开启开关后部署 Claude 补丁**

在开发版 Live Translator Hub UI 中对 Claude 执行部署。

预期进度中出现：

```text
已启用第三方推理模式，允许 Claude 页面访问: https://api.deepseek.com
```

如果显示：

```text
第三方推理模式已启用，但未检测到可追加到 CSP 的安全 API 域名。
```

则检查 UI 中 Claude active engine 是否选中 OpenAI-compatible，以及 `baseURL` 是否保存到 `config.claude.engines.openai.baseURL`。

- [ ] **步骤 6：重启 Claude 桌面客户端并检查注入配置**

打开 Claude DevTools，执行：

```js
window.__I18N_CONFIG__?.openai?.baseURL
```

预期输出：

```text
https://api.deepseek.com/v1
```

- [ ] **步骤 7：验证 CSP 中包含当前 API origin**

在 Claude DevTools Console 执行：

```js
fetch('https://api.deepseek.com/v1/models', { headers: { Authorization: 'Bearer invalid' } })
  .then(r => console.log('network allowed', r.status))
  .catch(e => console.error('network blocked', e.message));
```

预期：不再出现 `violates the following Content Security Policy directive`。请求可能返回 `401`、`403`、`404` 或 provider-specific 错误，这些都说明 CSP 已放行；若仍出现 CSP violation，则回到任务 3 检查 `index.js` patch 是否写入 app.asar。

- [ ] **步骤 8：验证翻译请求走 DeepSeek 直连**

在 Claude 中触发一段需要在线翻译的中文 UI 文本，观察 DevTools Console。

预期：不再出现：

```text
Fetch API cannot load https://api.deepseek.com/chat/completions. Refused to connect because it violates the document's Content Security Policy.
```

如果 API Key 或模型配置错误，可以出现 HTTP 401/403/404 等业务错误；这不属于 CSP 问题。

---

## 自检

- 规格覆盖：当前计划覆盖独立 CSP patch 包、Claude 现有解包流程接入、Claude 专属 UI 开关、i18n、真实 Claude bundle 模式验证、手动端到端验证。
- Cursor 隔离：计划明确不修改 Cursor 页面和 `patcher-cursor`，并包含 grep 验证确保第三方推理模式文案未进入 Cursor 代码路径。
- 解包约束：计划不新增第二套解包流程，CSP patch 只在 `ClaudePatcher.install()` 已经完成 `asar.extractAll(extractionSource, TEMP_DIR)` 后对 `TEMP_DIR` 执行。
- 占位符扫描：没有 `TODO`、`待定`、`后续实现`；每个代码变更步骤都有具体代码块。
- 类型一致性：统一使用 `getActiveApiOrigin(config)`、`patchClaudeCspBundle(source, origin)`、`patchExtractedClaudeCsp(extractedAppDir, config)` 三个 CommonJS 导出函数。
- 范围控制：不实现 Hub 内置代理，不改 translator-engine 请求协议，不引入新运行时依赖，不改变 Cursor 行为。
