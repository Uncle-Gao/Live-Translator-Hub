# Live Translator Hub 终极底层重构与架构演进方案

这份方案结合了所有的底层核心操作逻辑与详细的 Monorepo 工程目录结构，这是我们完整的实施蓝图。

---

## 核心蓝图：Monorepo 项目文件结构重组

```text
/Users/uncle/Developer/cursor-live-translator/ (主 Git 仓库根目录)
│
├── package.json                 <-- (Monorepo 根配置，开启 "workspaces": ["packages/*"])
├── README.md
│
└── packages/
    ├── core/                    【阶段一：纯净翻译内核】
    │   ├── package.json         (包名: "@live-translator/core")
    │   └── src/translator-engine.js
    │
    ├── patcher-cursor/          【阶段二：Cursor 底层逻辑重构】
    │   ├── package.json
    │   ├── index.js
    │   └── i18n/
    │
    ├── patcher-claude/          【阶段二：Claude 底层逻辑重构】
    │   ├── package.json
    │   ├── index.js
    │   └── i18n/
    │
    ├── dict-generator/          【阶段五：字典自动生成引擎（新增）】
    │   ├── package.json
    │   ├── index.js
    │   └── src/
    │
    └── desktop-app/             【阶段三：Live Translator Hub 桌面客户端】
        ├── package.json
        ├── electron/
        └── src/
```

---

## 阶段一：统一纯净内核抽离 (Core Kernel Extraction)

**目标**：消除环境差异，完成 `packages/core/src/translator-engine.js` 的提取。

### 核心技术细节
1. **全局变量向下兼容**：
   ```javascript
   const I18N_TERMS = window.__I18N_TERMS__ || window.__CURSOR_TERMS__ || window.__CLAUDE_TERMS__ || {};
   const CONFIG = window.__I18N_CONFIG__ || { apiType: 'none', skip: {}, features: {} };
   ```
2. **特性开关引擎 (Feature Flags)**：
   - `CONFIG.features.enableRegex`：控制正则模块
   - `CONFIG.features.enableNestedDict`：控制递归字典寻址
   - `CONFIG.features.enableTranslationBridge`：控制跨 Webview postMessage
   - `CONFIG.features.enableLoadingAnimation`：控制 DOM 转圈动画
3. **缓存沙盒化**：`const CACHE_KEY = 'live_i18n_cache_' + (CONFIG.name || 'default');`

---

## 阶段二：Patcher 的 Headless API 化

**目标**：剥离命令行菜单，改造为能被外部 UI 调用的纯异步接口。

```javascript
// 统一接口标准
PatcherAPI {
  detectStatus(): Promise<{ installed, version, isPatched }>;
  install(config, hooks: { onProgress, onRequestSudo }): Promise<void>;
  restore(hooks): Promise<void>;
}
```

`patcher-claude` 的提权机制：将所有 deploy 命令写入 `/tmp/claude-deploy.sh`，调用 `sudo-prompt.exec()` 一次性弹出系统授权框。

---

## 阶段三：桌面应用构建 (Live Translator Hub)

**技术栈**：Electron + Vite + React 18 + TailwindCSS v4

**设计美学**：Dark Mode 优先（`#0B0D10`）、Glassmorphism 毛玻璃面板、微动画体验

**IPC 接口**：
- `i18n:getCursorStatus` / `i18n:getClaudeStatus`
- `i18n:installCursor(config)` / `i18n:installClaude(config)`
- `i18n:restoreCursor()` / `i18n:restoreClaude()`

**持久化配置**：统一到 `~/.live_translator_hub/config.json`

---

## 阶段四：多语言架构演进 (Multi-language Support)

**目标**：从单一"英译中"升级为真正的国际化翻译中枢。

### 1. 翻译核心 (Core Engine) 的多语言扩展
- 向 `window.__I18N_CONFIG__` 新增 `targetLanguage` 字段
- 重构 patcher 字典加载逻辑，按需加载 `dictionary.{lang}.json`
- 动态语言切换：AI 接口根据 `targetLanguage` 构建对应 System Prompt

### 2. 桌面 UI 国际化 (UI Localization)
- 引入 `i18next` 和 `react-i18next`
- 新增下拉框：Interface Language（界面语言）+ Target Translation（目标翻译语言）

---

## 阶段五：AI 驱动的字典自动生成引擎 (Dictionary Auto-Generator)

**目标**：让用户通过 UI 配置 AI 密钥，一键生成任意横排语言的 Cursor/Claude 翻译字典。所有字段完整、格式原生，无需人工干预。

---

### 1. 技术前提：为什么不复用 `translator-engine.js`？

| 维度 | `translator-engine.js`（运行时引擎） | `dict-generator`（生成器） |
|------|--------------------------------------|------------------------------|
| **运行环境** | 注入进浏览器进程，使用 `window.fetch` | Node.js 主进程 |
| **工作模式** | 实时监听 DOM Mutation，延迟翻译 | 离线批量处理，一次性生成静态文件 |
| **输入** | 屏幕实时出现的 UI 文本 | 本地完整 JSON/strings 源文件 |
| **输出** | 实时修改 DOM 文本节点 | 写出对应语言的静态字典文件 |

**结论**：不应直接复用，但应抽取公共 **API 调用层** 到 `packages/core/src/api-client.js`，供运行时引擎和生成器共用。

---

### 2. 新增包：`packages/dict-generator/`

```
packages/dict-generator/
├── package.json
├── index.js                  (对外暴露 DictGenerator 类)
└── src/
    ├── api-adapters/
    │   ├── openai-adapter.js     (OpenAI/兼容接口，含自定义 Base URL)
    │   ├── anthropic-adapter.js  (Anthropic Claude 直接调用)
    │   ├── gemini-adapter.js     (Google Gemini API)
    │   └── deepl-adapter.js      (DeepL API)
    ├── source-extractors/
    │   ├── cursor-extractor.js   (从 dictionary.json 提取源字符串)
    │   ├── claude-extractor.js   (从 Claude.app asar 提取 en-US.json)
    │   └── strings-extractor.js  (从 Localizable.strings.en 提取源)
    ├── formatters/
    │   ├── cursor-formatter.js   (输出嵌套 JSON)
    │   ├── claude-formatter.js   (输出 hash:value flat JSON)
    │   └── strings-formatter.js  (输出 Apple .strings 格式)
    ├── languages.js              (支持的语言列表)
    └── generator.js              (核心批处理与完整性验证)
```

---

### 3. 支持的 AI 引擎

| 引擎 | 配置项 | 代表模型 |
|------|--------|----------|
| **OpenAI / 兼容接口** | apiKey + baseURL + model | gpt-4o, gpt-4o-mini, DeepSeek-V3, Groq/llama 等 |
| **Anthropic** | apiKey + model | claude-opus-4-5, claude-sonnet-4-5 |
| **Google Gemini** | apiKey + model | gemini-2.0-flash, gemini-2.5-pro |
| **DeepL** | apiKey | 专用翻译 API（无需选模型） |

> [!NOTE]
> OpenAI 兼容接口（自定义 Base URL）可覆盖 Ollama 本地模型、Azure OpenAI、DeepSeek、Groq 等几乎所有第三方服务，无需单独适配。

---

### 4. 支持的目标语言（横排书写系统，排除 RTL 语言）

共 **34 种**语言：

```js
// packages/dict-generator/src/languages.js
export const SUPPORTED_LANGUAGES = [
  // 东亚
  { code: 'zh-CN', name: '简体中文',        deepl: 'ZH'    },
  { code: 'zh-TW', name: '繁體中文',        deepl: 'ZH'    },
  { code: 'ja-JP', name: '日本語',           deepl: 'JA'    },
  { code: 'ko-KR', name: '한국어',           deepl: 'KO'    },
  // 西欧
  { code: 'fr-FR', name: 'Français',        deepl: 'FR'    },
  { code: 'de-DE', name: 'Deutsch',         deepl: 'DE'    },
  { code: 'es-ES', name: 'Español',         deepl: 'ES'    },
  { code: 'it-IT', name: 'Italiano',        deepl: 'IT'    },
  { code: 'pt-BR', name: 'Português (BR)',  deepl: 'PT-BR' },
  { code: 'pt-PT', name: 'Português (PT)',  deepl: 'PT-PT' },
  { code: 'nl-NL', name: 'Nederlands',      deepl: 'NL'    },
  { code: 'pl-PL', name: 'Polski',          deepl: 'PL'    },
  { code: 'sv-SE', name: 'Svenska',         deepl: 'SV'    },
  { code: 'da-DK', name: 'Dansk',           deepl: 'DA'    },
  { code: 'fi-FI', name: 'Suomi',           deepl: 'FI'    },
  { code: 'nb-NO', name: 'Norsk',           deepl: 'NB'    },
  // 东欧
  { code: 'cs-CZ', name: 'Čeština',         deepl: 'CS'    },
  { code: 'sk-SK', name: 'Slovenčina',      deepl: 'SK'    },
  { code: 'ro-RO', name: 'Română',          deepl: 'RO'    },
  { code: 'hu-HU', name: 'Magyar',          deepl: 'HU'    },
  { code: 'el-GR', name: 'Ελληνικά',       deepl: 'EL'    },
  { code: 'bg-BG', name: 'Български',      deepl: 'BG'    },
  { code: 'uk-UA', name: 'Українська',     deepl: 'UK'    },
  { code: 'ru-RU', name: 'Русский',        deepl: 'RU'    },
  { code: 'lt-LT', name: 'Lietuvių',       deepl: 'LT'    },
  { code: 'lv-LV', name: 'Latviešu',       deepl: 'LV'    },
  { code: 'et-EE', name: 'Eesti',          deepl: 'ET'    },
  // 其他横排语言
  { code: 'tr-TR', name: 'Türkçe',         deepl: 'TR'    },
  { code: 'vi-VN', name: 'Tiếng Việt',    deepl: null    },
  { code: 'th-TH', name: 'ภาษาไทย',       deepl: null    },
  { code: 'id-ID', name: 'Bahasa Indonesia', deepl: 'ID'  },
  { code: 'ms-MY', name: 'Bahasa Melayu',  deepl: null    },
  { code: 'hi-IN', name: 'हिन्दी',          deepl: null    },
  // 明确排除 RTL：ar, he, fa, ur
];
```

---

### 5. 三种字典格式的生成策略

#### 5.1 Cursor 字典 (`patcher-cursor/i18n/dictionary.{lang}.json`)

- **源文件**：`dictionary.json`（嵌套 JSON，英文 key → 中文 value）
- **提取策略**：递归遍历所有叶子 key，记录嵌套路径
- **输出格式**：与 `dictionary.json` **完全相同的嵌套结构**，只替换叶子 value
- **关键点**：regex 分组中含 `$1` 占位符，prompt 须告知 AI **严格保留**

```js
// 提取叶子 key + 嵌套路径
function extractLeaves(obj, path = []) {
  const leaves = [];
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') leaves.push({ path: [...path, k], en: k });
    else leaves.push(...extractLeaves(v, [...path, k]));
  }
  return leaves;
}
// 翻译后按 path 将译文回填进新 JSON 树
```

#### 5.2 Claude 主字典 (`patcher-claude/{lang}.json`)

- **核心难点**：key 是不可读的 hash（如 `"+/cwsayrqk"`），无英文原文无法翻译
- **解决方案**：
  1. **优先**：从 Claude.app 的 `app.asar` 内提取 `en-US.json`（使用 `@electron/asar` + `original-fs` 绕过 Electron 的 asar 文件系统拦截）
  2. **降级**：使用项目维护的 `patcher-claude/i18n/en-US.seed.json` 种子文件
- **流程**：`hash → 查英文原文 → AI 翻译 → 生成 {lang}.json`
- **原子写入**：先写 `{lang}.json.tmp`，校验通过后 rename

```js
// 从 asar 提取 en-US.json（绕过 Electron 拦截）
const originalFs = require('original-fs');
const asar = require('@electron/asar');
const enUS = JSON.parse(asar.extractFile(
  '/Applications/Claude.app/Contents/Resources/app.asar',
  'Contents/Resources/en-US.json',
  { fs: originalFs }
));
```

#### 5.3 Claude 原生字符串 (`Localizable.strings.{lang}`)

- **格式**：`"English original" = "Translation";`
- **流程**：提取所有左侧英文原文 → 批量翻译 → 按原格式重新组装
- **保留**：注释行（`/* ... */`）和空行原样保留

---

### 6. 字段完整性保障机制（核心）

```
① 提取源文件所有 key → sourceKeys Set（基准集合）
② 分批翻译（每批 40 条），记录成功/失败
③ 合并所有批次结果 → resultMap
④ 校验: missingKeys = sourceKeys - resultMap.keys()
⑤ 若 missingKeys 非空 → 自动重试最多 3 次（降批次至 10 条/批）
⑥ 仍有缺失 → 写入 "_missing" 标记字段 + 警告日志，询问是否强制写入
⑦ 断言通过 → 原子写文件（tmp → rename 最终路径）
```

> [!IMPORTANT]
> 永远不写入未完成的部分文件。只有全量翻译完成且 key 完整性断言通过，才执行文件原子替换。

---

### 7. UI 界面新增内容

#### AI 密钥管理面板（新增侧边栏项）

```
┌─ AI 引擎配置 ──────────────────────────────────────┐
│  ┌── OpenAI / 兼容接口 ──────────────────────────┐  │
│  │  API Key: [________________]  [显示] [测试]   │  │
│  │  Base URL: [https://api.openai.com/v1]        │  │
│  │  模型: [gpt-4o-mini ▼]                        │  │
│  └───────────────────────────────────────────────┘  │
│  ┌── Anthropic ──────────────────────────────────┐  │
│  │  API Key: [________________]  [测试]          │  │
│  │  模型: [claude-sonnet-4-5 ▼]                  │  │
│  └───────────────────────────────────────────────┘  │
│  ┌── Google Gemini ───────────────────────────────┐  │
│  │  API Key: [________________]  [测试]           │  │
│  │  模型: [gemini-2.0-flash ▼]                   │  │
│  └───────────────────────────────────────────────┘  │
│  ┌── DeepL ──────────────────────────────────────┐  │
│  │  API Key: [________________]  [测试]          │  │
│  └───────────────────────────────────────────────┘  │
│  [ 保存所有配置 ]                                    │
└────────────────────────────────────────────────────┘
```

#### 字典生成面板（新增侧边栏项）

```
┌─ 字典生成器 ──────────────────────────────────────────┐
│  目标应用:  ● Cursor   ○ Claude   ○ 两者都生成        │
│  目标语言:  [日本語 (ja-JP) ▼]  (34 种横排语言)       │
│  翻译引擎:  [OpenAI gpt-4o-mini ▼]                   │
│  批次大小:  [40 ▼]                                    │
│  ──────────────────────────────────────────────────   │
│  Cursor:  dictionary.ja-JP.json   [395 / 395 条] ✓   │
│  Claude:  ja-JP.json              [268 / 268 条] ✓   │
│  Claude:  Localizable.strings.ja-JP [46 / 46 条] ✓   │
│  ████████████████████░░░░░░  73%  正在翻译...         │
│  [ 开始生成 ]             [ 查看生成日志 ]              │
└────────────────────────────────────────────────────────┘
```

---

### 8. IPC 接口扩展（`electron/main.js`）

```js
// AI 配置管理
ipcMain.handle('config:saveApiKeys', (_, keys) => saveApiKeys(keys));  // safeStorage 加密
ipcMain.handle('config:loadApiKeys', () => loadApiKeys());
ipcMain.handle('config:testApiKey', (_, { engine, key, model, baseURL }) =>
  DictGenerator.testConnection({ engine, key, model, baseURL })
);

// 字典生成
ipcMain.handle('dict:generate', async (_, { app, lang, engine, batchSize }) => {
  const gen = new DictGenerator({ engine, lang, batchSize });
  gen.on('progress', msg => mainWindow.webContents.send('dict:progress', msg));
  return await gen.generate(app);  // => { success, missing, outputPath }
});
```

---

### 9. API 密钥安全存储

**关键约束**：`translator-engine.js` 被注入进 Cursor/Claude 的浏览器进程，无法访问我们 Electron 应用的 `safeStorage`。API Key 在安装时必须以**明文**形式写入注入脚本——这和用户在 Cursor Settings 里手动填写 OpenAI Key 的安全级别完全相同，不可绕过。

**两层安全策略**：

| 场景 | 方案 |
|------|------|
| **dict-generator 离线批量翻译** | `safeStorage` 加密存储（全程在主进程内，完美适用） |
| **translator-engine 运行时 key** | 安装时主进程解密 → patcher 写入注入脚本（明文，不可避免） |
| **config.json 本身** | 明文 + `chmod 600` 文件权限保护 |

```js
// 保存 config 时限制文件权限，阻止其他系统用户读取
fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });

// dict-generator 专用 key 使用 safeStorage（只在主进程中调用）
const { safeStorage } = require('electron');
const encryptedKey = safeStorage.encryptString(apiKey);
fs.writeFileSync(DICT_GEN_KEY_FILE, encryptedKey, { mode: 0o600 });
// 使用时解密（仅在主进程）
const apiKey = safeStorage.decryptString(fs.readFileSync(DICT_GEN_KEY_FILE));
```

---


### 10. 验证计划

- **单元**：每个 api-adapter mock HTTP 返回，验证解析逻辑
- **集成**：Cursor 字典生成后做 key 完整性断言（生成结果集 ⊇ 源文件 key 集）
- **边界**：Claude 未安装时降级到 seed 文件的路径正常工作
- **UI**：手动触发 ja-JP 字典生成，观察进度条与终端日志实时输出

> [!NOTE]
> 阶段五不修改运行时 `translator-engine.js` 的任何逻辑，是完全独立的「离线批处理工具」，生成的字典直接被安装器按需加载，无需改动任何现有流程。

---

## 阶段六：运行时高级配置与特性开关补全 (Runtime Advanced Config)

**背景与目标**：
目前的 Hub UI 已经完成了阶段五的字典离线生成，但在向目标应用（Cursor/Claude）执行“部署汉化”时，代码中仍硬编码了 `activeId: 'none'`，且缺失了重构前 CLI 工具拥有的诸多高阶运行时配置。
阶段六的目标是**补全 UI 层缺失的功能映射**，让用户能够在界面上全盘掌控 `translator-engine.js` 的所有运行时特性。

### 1. 运行时大模型翻译引擎配置 (Runtime AI Translation Toggle)
在目前的“全局配置”模块中，除了选择“目标注入语言”，需要增加**运行时引擎选择器**。
*   **选项**：`纯静态字典模式 (None)` / `OpenAI 兼容接口` / `DeepL` 等。
*   **逻辑机制**：
    *   读取阶段五配置在 `api_keys.enc` 中的密钥。
    *   在点击“部署”时，如果用户选择了运行时引擎，会将对应的 `activeId` 和 `apiKey` 注入到最终的 `window.__I18N_CONFIG__` 中。
    *   这使得翻译引擎遇到静态字典中不存在的新词条时，可以在后台调用接口进行实时补充翻译。

### 2. 翻译引擎特性开关 (Feature Flags Panel)
重构前的内核具有多个高级功能开关，需要暴露在 Hub UI 的“高级设置 (Advanced)”折叠面板中：
*   **`enableRegex` (正则匹配开关)**：允许使用正则规则匹配动态文本。
*   **`enableLoadingAnimation` (加载动画展示)**：在实时请求 API 时，是否在 DOM 元素后显示转圈动画 `[ 翻译中... ]`。
*   **`enableTranslationBridge` (跨域桥接通信)**：是否允许主窗口与 Webview 之间通过 postMessage 进行翻译缓存共享（针对 Claude 的内嵌网页）。
*   **`enableNestedDict` (嵌套字典寻址)**：是否开启点语法（`a.b.c`）去解析深层 JSON 字典结构。

### 3. 翻译缓存管理机制 (Cache Management)
*   **现状**：实时翻译结果会被缓存在 `localStorage` 的 `live_i18n_cache_*` 中，避免重复消耗 Token。
*   **新增功能**：
    1.  在“部署汉化”按钮旁增加一个复选框：`[x] 部署时强制清理旧缓存 (Reset Cache)`。
    2.  勾选后，会在注入代码中设置 `CONFIG.resetCache = true`，在应用下次启动时自动 `localStorage.removeItem(...)`。

### 4. 翻译黑名单可视编辑 (Skip Rules Configuration)
*   **现状**：目前 `skip._cursor_.selectors` 在 Patcher 中是硬编码的常量（如 `.monaco-breadcrumbs`, `.xterm-link-layer` 等）。
*   **新增功能**：
    *   在高级设置中增加一个文本域：**CSS 选择器排除列表 (Skip Selectors)**。
    *   允许高阶用户自定义添加诸如 `.composer-file-list-item` 这样的类名，指导 `translator-engine.js` 跳过特定代码块或敏感区块的翻译，防止 IDE 关键界面损坏。

### 5. Cursor 插件生态与 Webview 深度注入 (Extension & Webview Injection)
*   **现状**：目前 Patcher 仅向 `workbench.js` 和 `workbench.html` 注入了翻译内核，这只能覆盖 Cursor 的主界面（如菜单、侧边栏、命令面板等）。许多基于 Webview 渲染的插件界面（甚至包括 Cursor 的某些 AI 面板侧边栏）并未被拦截。
*   **新增功能**：
    *   在部署面板中提供 **"启用插件/Webview 汉化注入"** 的独立开关。
    *   底层 Patcher 需适配 VSCode 架构，扫描并向 `webviewPreload.js` 或相关 iframe 加载入口注入翻译内核引擎（利用 `enableTranslationBridge` 实现主从窗口缓存与配置同步）。
    *   针对第三方扩展（Extensions）的独立字典支持结构，方便用户为常用插件单独加载词库。

**阶段六交付标准**：
用户可以在 Hub UI 上完成 CLI 时代 100% 的操作，彻底补全「部署配置」，使得 Hub 真正成为一站式控制中心。
