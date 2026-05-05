# UI 重构计划：Live Translator Hub（终稿）

## 核心设计原则

1. **AI 密钥管理** — 唯一的全局功能，两个引擎共享
2. **Cursor / Claude** — 完全独立的配置空间，互不干扰
3. **字典生成** — 作为"部署"操作的二级引导流程（Guided Flow），不再是独立顶级页面
4. **流程驱动 UI** — 用户意图 → 自动检测 → 引导生成 → 一键部署
5. **黑名单完全独立** — 所有层级的黑名单互不共享，每层各自配置
6. **插件选择驱动规则同步** — 用户勾选要汉化的插件 → 对应黑名单规则项自动出现/消失

## 已确认的设计决策

| 问题 | 决策 |
|------|------|
| 无 API 密钥时如何引导 | 在字典生成向导区显示"前往配置 🔑" 跳转按钮 |
| 日志终端共用还是分开 | **共用一个终端**，两阶段打印分隔线区分 |
| 插件 Webview 黑名单与勾选同步 | 用户勾选插件 → 黑名单规则项自动联动出现/消失 |

---

## 整体布局结构

```
┌─────────────────────────────────────────────────────────────────┐
│  ●●●   Live Translator Hub               [界面语言 ▼] [⚡️AI翻译] │
├──────────────┬──────────────────────────────────────────────────┤
│  侧边栏      │  主内容区（随内容纵向滚动）                        │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## 侧边栏导航（重构后，3 项）

```
┌──────────────────────┐
│  Live Translator Hub │
├──────────────────────┤
│  ── 汉化引擎 ──      │
│  ● Cursor 汉化引擎   │
│  ● Claude 汉化引擎   │
│  ── 工具 ──          │
│  🔑 AI 密钥管理      │  <- 全局唯一
└──────────────────────┘
```

> [!IMPORTANT]
> 字典生成器从顶级导航中移除，改为部署流程中的内嵌向导步骤。

---

## Cursor 汉化引擎页面（完整草图）

### 卡片 1：状态总览（重构后，包含备份状态）

```
┌─ 状态总览 ──────────────────────────────────────────────────────┐
│                                                                  │
│  安装状态   ● v1.5354.0   已安装                                 │
│                                                                  │
│  汉化状态   ● 已汉化 (v3)  · 目标语言：日本語                    │
│             ○ 原生未汉化                                         │
│                                                                  │
│  备份状态  ─────────────────────────────────────────────────  │
│                                                                  │
│  情形一（首次，无备份）：                                         │
│  ⚠️  主界面  未备份   [  📦 立即创建备份  ]                      │
│                                                                  │
│  情形二（已备份，版本匹配）：                                     │
│  ✅  主界面  workbench.js.bak-v1.5354.0   (匹配当前版本)         │
│  ✅  Webview  index.html.bak-v1.5354.0   (匹配当前版本)          │
│                                                                  │
│  情形三（备份版本不匹配，Cursor 已更新）：                        │
│  ⚠️  主界面  备份版本 v1.5300.0 ≠ 当前 v1.5354.0               │
│      旧备份已无法用于恢复，建议重新备份后再部署                   │
│      [  🗑️ 删除旧备份并重新备份  ]                               │
│                                                                  │
│  情形四（已汉化但无备份，危险状态）：                             │
│  ❌  主界面  已汉化但找不到备份文件！                             │
│      无法安全恢复，请手动重装 Cursor 或提供原始文件               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 卡片 2：部署配置

```
┌─ 部署配置 ──────────────────────────────────────────────────────┐
│  目标语言      [日本語 (ja-JP)                    ▼]             │
│                (全部 34 种语言可选)                               │
│                                                                  │
│  运行时引擎    [无 (仅静态字典)                   ▼]             │
│                (OpenAI / Anthropic / Gemini / DeepL)             │
│                                                                  │
│  ▶ 高级设置 (Cursor 专有)                          [折叠/展开]   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [x] 启用正则匹配      [x] 嵌套字典寻址                   │  │
│  │  [x] 显示加载动画      [ ] 部署时重置缓存                  │  │
│  │  [x] 跨Webview桥接     [ ] 注入插件Webview层（深度汉化）   │  │
│  │                                                           │  │
│  │  ┌─ 主界面黑名单 (workbench 专属，与所有Webview规则无关) ─┐ │  │
│  │  │  .monaco-breadcrumbs, .xterm-link-layer,              │ │  │
│  │  │  .monaco-list-row, .pane-header.expanded,             │ │  │
│  │  │  .aislash-editor-input, .composer-file-list-item, ... │ │  │
│  │  └───────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │  ── 以下仅在「注入插件 Webview」勾选后显示 ─────────────── │  │
│  │                                                           │  │
│  │  ┌─ 已安装插件列表 (扫描自 ~/.cursor/extensions/) ───────┐ │  │
│  │  │  勾选要汉化的插件：                                   │ │  │
│  │  │                                                       │ │  │
│  │  │  [x]  anysphere.remote-ssh   Remote SSH    v1.0.48   │ │  │
│  │  │  [ ]  eamodio.gitlens        GitLens        v15.x    │ │  │
│  │  │  [x]  github.copilot         Copilot        v1.2x    │ │  │
│  │  │  [ ]  ms-python.python       Python          v2024   │ │  │
│  │  │  ...  (更多已安装插件)                                │ │  │
│  │  │                                           [🔄刷新列表] │ │  │
│  │  └───────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │  ┌─ 全局 Webview 规则 (对所有已勾选插件生效，独立配置) ───┐ │  │
│  │  │  .webview-find-widget, .result-count, ...             │ │  │
│  │  └───────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │  ┌─ 插件专属规则 (与勾选列表同步) ───────────────────────┐ │  │
│  │  │                                                       │ │  │
│  │  │  ┌ anysphere.remote-ssh (已勾选，自动出现) ─────────┐ │ │  │
│  │  │  │ Remote SSH                          [✏️编辑] [🗑️] │ │ │  │
│  │  │  │ .terminal-wrapper, .remote-status, ...            │ │ │  │
│  │  │  └───────────────────────────────────────────────────┘ │ │  │
│  │  │                                                       │ │  │
│  │  │  ┌ github.copilot (已勾选，自动出现) ──────────────┐  │ │  │
│  │  │  │ GitHub Copilot                      [✏️编辑] [🗑️] │  │ │  │
│  │  │  │ .copilot-suggestion, .ghost-text               │  │ │  │
│  │  │  └────────────────────────────────────────────────┘  │ │  │
│  │  │                                                       │ │  │
│  │  │  (eamodio.gitlens 未勾选 → 规则项不显示)             │ │  │
│  │  │  (ms-python.python 未勾选 → 规则项不显示)            │ │  │
│  │  │                                                       │ │  │
│  │  └───────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 卡片 3：字典状态检查（含内嵌生成向导）

```
┌─ 字典状态检查 ──────────────────────────────────────────────────┐
│  目标语言：日本語 (ja-JP)                                        │
│                                                                  │
│  ✅  dictionary.ja-JP.json   395 / 395 条   [查看文件]          │
│                                                                  │
│  ─ 或，字典不存在时 ─────────────────────────────────────────── │
│                                                                  │
│  ⚠️  dictionary.ja-JP.json  不存在                               │
│  ┌─ 字典生成向导 ─────────────────────────────────────────────┐ │
│  │  📦 需要先生成字典才能部署                                  │ │
│  │                                                             │ │
│  │  ─ 无可用 API 密钥时 ─────────────────────────────────── │ │
│  │  │ ⚠️ 尚未配置 AI 引擎密钥                               │ │
│  │  │ [  🔑 前往 AI 密钥管理页配置  ]                        │ │
│  │                                                             │ │
│  │  ─ 有可用密钥时 ──────────────────────────────────────── │ │
│  │  │ 使用引擎  [OpenAI gpt-4o-mini        ▼]               │ │
│  │  │ 批次大小  [40                         ▼]               │ │
│  │  │                                                        │ │
│  │  │ ████████████░░░░░░  63%  正在翻译批次 3/5 ...          │ │
│  │  │                                                        │ │
│  │  │ [       🚀 开始生成字典       ]                        │ │
│  │  └─────────────────────────────────────────────────────────── ┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 卡片 4：操作按钮 + 共用日志终端

部署前状态机（增加备份前置检查）：

```
点击「部署汉化」
        │
        ▼
  ┌─────────────────┐  无备份  ┌──────────────────────────────┐
  │ 检查备份是否存在  │ ──────▶ │ 弹出确认框：                  │
  └─────────────────┘          │ 「首次部署需要先创建备份，     │
        │ 有备份                │  是否立即备份并继续部署？」    │
        │                      │  [取消]  [📦 备份并继续部署]  │
        ▼                      └──────────────────────────────┘
  ┌─────────────────┐                    │
  │ 检查版本是否匹配  │          用户确认 ▼
  └─────────────────┘          ┌──────────────────┐
        │ 匹配                  │ 执行备份，然后继续 │
        ▼                      └──────────────────┘
  ┌──────────────────────────────────────┐
  │ 执行部署注入流程                       │
  └──────────────────────────────────────┘
```

```
┌─ 操作 ──────────────────────────────────────────────────────────┐
│  [    🚀 部署汉化    ]          [   🔄 恢复官方原版   ]         │
│  (字典不存在时灰显)              (无备份时灰显，不可用)           │
└─────────────────────────────────────────────────────────────────┘

┌─ 共用日志终端 ──────────────────────────────────────────────────┐
│  ● ● ●  任务日志                                                │
│  [10:23:00] 检查备份状态...                                     │
│  [10:23:00] 📦 创建备份: workbench.html.bak-v1.5354.0          │
│  [10:23:01] 📦 创建备份: workbench.js.bak-v1.5354.0            │
│  [10:23:01] ✅ 备份完成                                         │
│  [10:23:01] ─────────── 开始部署 ─────────────                  │
│  [10:23:01] 开始生成 ja-JP 字典...                              │
│  [10:23:15] ✅ 字典生成完成 (395 / 395 条)                      │
│  [10:23:15] ─────────── 字典生成完成，开始注入 ─────────────    │
│  [10:23:16] 编译并组装引擎代码...                               │
│  [10:23:16] 向主程序注入翻译核心...                             │
│  [10:23:17] ✅ 安装成功！                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 插件列表扫描逻辑（后端实现）

```
扫描来源（按优先级合并）：
  1. ~/.cursor/extensions/extensions.json  → 包含 identifier.id 和 displayName
  2. ~/.cursor/extensions/ 目录列举       → 目录名格式: publisher.name-version

IPC 接口（新增）：
  cursor:getInstalledExtensions()
  → 返回 [{ id: 'eamodio.gitlens', displayName: 'GitLens', version: '15.x' }, ...]

扫描规则：
  - 排除以下内置扩展（Cursor 自带，无 Webview 界面，没必要处理）：
    bat, clojure, coffeescript, configuration-editing, cpp, csharp, css,
    css-language-features, cursor-agent-exec, cursor-always-local, ...
  - 仅保留 publisher.extensionName 格式的目录（即用户安装的第三方扩展）
```

---

## 插件勾选与黑名单联动规则

```
用户行为                        → UI 响应
─────────────────────────────────────────────────────────
勾选 eamodio.gitlens           → 在插件专属规则区新增 GitLens 规则项
                                  (初始黑名单为空，等待用户填写)
取消勾选 eamodio.gitlens       → 规则项从列表中隐藏（数据保留，不删除）
再次勾选 eamodio.gitlens       → 规则项重新出现，之前填写的黑名单数据恢复

点击规则项 [✏️编辑]             → 弹出编辑弹窗（填写该插件的 Skip CSS 选择器）
点击规则项 [🗑️删除]             → 仅删除黑名单数据，不影响勾选状态
```

---

## 「编辑插件规则」弹窗草图

```
╔═══════════════════════════════════════════════╗
║  配置插件汉化规则                              ║
╠═══════════════════════════════════════════════╣
║  插件        anysphere.remote-ssh             ║
║  名称        Remote SSH                        ║
║                                               ║
║  跳过 CSS 选择器（不翻译的元素类名）            ║
║  ┌─────────────────────────────────────────┐ ║
║  │ .terminal-wrapper,                      │ ║
║  │ .remote-status-bar,                     │ ║
║  │ .server-name-label                      │ ║
║  └─────────────────────────────────────────┘ ║
║  (留空 = 不跳过任何元素，全部尝试翻译)          ║
║                                               ║
║              [取消]   [✅ 保存]               ║
╚═══════════════════════════════════════════════╝
```

---

## Claude 汉化引擎页面（完整草图）

```
┌─ 汉化状态 ────────┐   ┌─ 部署配置 ──────────────────────────────┐
│  安装 ● v0.44.1  │   │  目标语言  [简体中文 (zh-CN)          ▼] │
│  汉化 ○ 原生     │   │  运行引擎  [无 (仅静态字典)           ▼] │
└───────────────────┘   │                                         │
                        │  ▶ 高级设置 (Claude 专有)               │
                        │  ┌───────────────────────────────────┐  │
                        │  │ [x] 显示加载动画  [ ] 重置缓存     │  │
                        │  │ ⚠️ ASAR 注入：不支持正则/嵌套字典  │  │
                        │  │                                   │  │
                        │  │ ┌─ JSON 跳过 Keys (Claude 独立) ─┐ │  │
                        │  │ │ (不翻译的 hash key，可留空)     │ │  │
                        │  │ └─────────────────────────────── ┘ │  │
                        │  └───────────────────────────────────┘  │
                        └─────────────────────────────────────────┘

┌─ 字典状态检查 ──────────────────────────────────────────────────┐
│  主 JSON 字典   ✅  zh-CN.json             (268 / 268 条)       │
│  原生 Strings   ✅  Localizable.strings.zh-CN  (46 / 46 条)    │
└─────────────────────────────────────────────────────────────────┘

┌─ 操作 ──────────────────┐   ┌─ 共用日志终端 ───────────────────┐
│ [🚀 部署 (需管理员权限)] │   │  等待任务执行...                 │
│ [🔄 恢复官方原版]        │   └─────────────────────────────────┘
└─────────────────────────┘
```

---

## 黑名单架构总览（最终版）

```
Cursor 配置（所有层完全独立，不共享）
│
├── 主界面黑名单 (workbench)      ← 与 Webview 无关，互不影响
│   .monaco-breadcrumbs, ...
│
└── Webview 黑名单（仅注入插件时生效）
    ├── 全局 Webview 兜底规则     ← 对所有已勾选插件 Webview 叠加
    │   .webview-find-widget, ...
    ├── anysphere.remote-ssh      ← 只对 Remote SSH Webview 生效
    │   .terminal-wrapper, ...
    └── github.copilot            ← 只对 Copilot Webview 生效
        .copilot-suggestion, ...

注入时合并公式：
  某插件最终 skipSelectors = 全局Webview规则 + 该插件专属规则

Claude 配置（与 Cursor 完全无关）
└── JSON Keys 黑名单             ← 独立，不与任何 Cursor 规则共享
```

---

## 底层配置数据结构（config.json）

```json
{
  "cursor": {
    "targetLanguage": "ja-JP",
    "runtimeEngine": "openai",
    "features": {
      "enableRegex": true,
      "enableNestedDict": true,
      "enableLoadingAnimation": true,
      "enableTranslationBridge": true,
      "resetCache": false,
      "injectWebview": true
    },
    "skipRules": {
      "workbench": ".monaco-breadcrumbs, .xterm-link-layer, .monaco-list-row",
      "webview": {
        "_global_": ".webview-find-widget, .result-count",
        "anysphere.remote-ssh": {
          "label": "Remote SSH",
          "enabled": true,
          "selectors": ".terminal-wrapper, .remote-status-bar"
        },
        "github.copilot": {
          "label": "GitHub Copilot",
          "enabled": true,
          "selectors": ".copilot-suggestion, .ghost-text"
        },
        "eamodio.gitlens": {
          "label": "GitLens",
          "enabled": false,
          "selectors": ".blame-info"
        }
      }
    }
  },
  "claude": {
    "targetLanguage": "zh-CN",
    "runtimeEngine": "none",
    "features": {
      "enableLoadingAnimation": true,
      "resetCache": false
    },
    "skipRules": {
      "jsonKeys": ""
    }
  }
}
```

> [!NOTE]
> `enabled: false` 表示插件未被勾选，其黑名单数据保留（不显示在 UI 中，但不丢失），以便用户下次重新勾选时恢复历史配置。

---

## 组件文件结构

```
packages/desktop-app/src/
├── App.jsx                            ← 顶层路由，极度精简
├── i18n.js
├── index.css
├── store/
│   └── configStore.js                 ← [新] 全局配置状态 (读/写 config.json)
└── components/
    ├── Sidebar.jsx                    ← [新] 侧边栏导航
    ├── Header.jsx                     ← [新] 标题栏含语言切换
    ├── ApiKeysPanel.jsx               ← 已有，维持不变
    ├── CursorPanel/
    │   ├── index.jsx                      主面板入口
    │   ├── StatusCard.jsx
    │   ├── DeployConfig.jsx               语言/引擎/高级开关
    │   ├── SkipRules/
    │   │   ├── WorkbenchSkips.jsx         主界面黑名单编辑器
    │   │   ├── WebviewGlobalSkips.jsx     全局Webview黑名单编辑器
    │   │   ├── PluginSelector.jsx         ← [新] 插件勾选列表（扫描+渲染）
    │   │   ├── PluginRuleList.jsx         与勾选同步的规则列表
    │   │   └── PluginRuleModal.jsx        编辑规则弹窗
    │   ├── DictStatus.jsx                 字典状态 + 内嵌生成向导
    │   └── ActionBar.jsx                  操作按钮 + 共用日志终端
    └── ClaudePanel/
        ├── index.jsx
        ├── StatusCard.jsx
        ├── DeployConfig.jsx
        ├── DictStatus.jsx
        └── ActionBar.jsx
```

---

## 新增 IPC 接口（main.js）

| 接口名 | 说明 |
|--------|------|
| `cursor:getInstalledExtensions` | 扫描 `~/.cursor/extensions/` 返回已安装第三方插件列表 |
| `cursor:createBackup` | 已实现：独立备份接口 |
| `config:load` | 加载 `~/.live_translator_hub/config.json` |
| `config:save` | 保存完整 config 对象到文件 |

---

## 缺陷修复计划（原项目对比分析后新增）

> [!CAUTION]
> 以下两个 **P0 级严重缺陷**会导致 Cursor 无法正常启动，必须在 UI 重构的同时一并修复，否则新版安装器不可用。

### 🔴 P0-1：`product.json` Checksum 哈希重写（patcher-cursor 完全缺失）

Cursor 启动时会校验 `product.json` 中 `checksums` 字段里 `workbench.js` 和 `workbench.html` 的 SHA-256 哈希值。原版在安装/恢复时都会重新计算并写回。新版完全没有这一步。

**影响**：Cursor 启动时显示"安装已损坏"警告，或直接拒绝加载注入后的 JS。

**修复位置**：`packages/patcher-cursor/index.js` 的 `install()` 和 `restore()` 末尾

**需新增的逻辑**：
```js
// 安装后重写 product.json checksum
const crypto = require('crypto');
const jsHash  = crypto.createHash('sha256').update(fs.readFileSync(paths.workbenchJs)).digest('base64').replace(/=+$/, '');
const htmlHash = crypto.createHash('sha256').update(fs.readFileSync(paths.workbenchHtml)).digest('base64').replace(/=+$/, '');
const product  = JSON.parse(fs.readFileSync(paths.productJson, 'utf8'));
product.checksums['vs/code/electron-sandbox/workbench/workbench.js']   = jsHash;
product.checksums['vs/code/electron-sandbox/workbench/workbench.html'] = htmlHash;
fs.writeFileSync(paths.productJson, JSON.stringify(product, null, '\t'), 'utf8');
```

---

### 🔴 P0-2：macOS 代码签名重置（patcher-cursor 完全缺失）

macOS 13+ 的 Gatekeeper 和 SIP 会在文件被修改后使 app bundle 签名失效，导致 Cursor 启动时被系统阻止。

**修复位置**：`packages/patcher-cursor/index.js` 的 `install()` 和 `restore()` 末尾

**需新增的逻辑**（仅 macOS）：
```js
if (process.platform === 'darwin') {
  const { execSync } = require('child_process');
  const appBundle = paths.root.replace('/Contents/Resources/app', '');
  execSync(`xattr -cr "${appBundle}"`);
  execSync(`codesign --force --deep --sign - "${appBundle}"`);
}
```

> [!NOTE]
> 这两个操作需要写文件权限（macOS 上 Cursor 在 `/Applications` 下，通常需要 sudo）。应在 UI 层已有的 sudo 提权流程中统一处理，不需要单独再弹权限框。

---

### 🟠 P1：插件 Webview 注入方式需完全重构

**当前新版方案（错误）**：注入 Cursor 全局的 `workbench/contrib/webview/browser/pre/index.html`（HTML 文件）

**原版正确方案**：扫描 `~/.cursor/extensions/*/webview/index.js`，对**每个插件的 JS 文件末尾追加注入**

两种方案的本质区别：

| 对比项 | 当前新版（HTML注入）| 原版（JS追加注入）|
|--------|-------------------|-----------------|
| 注入目标 | Cursor 全局 Webview 框架 | 每个插件自己的 JS |
| 备份粒度 | 一个全局备份 | 每个插件独立备份 |
| 版本感知 | 无 | 每个插件独立检测版本更新 |
| Skip 规则 | 共用主界面规则 | 每个插件独立 skip 配置 |
| 风险 | 影响所有插件 Webview | 精确到单个插件 |

**修复策略（后端）**：
1. 在 `patcher-cursor/index.js` 中新增 `patchPlugin(plugin, config, hooks)` 方法
2. `getPluginPaths()` 扫描 `~/.cursor/extensions/*/webview/index.js`（存在此文件才算含 Webview 的插件）
3. 每个插件有独立的 `index.js.bak-v{version}` 备份
4. 插件更新检测：若旧备份版本 ≠ 当前插件版本，自动删旧备份重新注入
5. 每个插件注入时的 `engineConfig.skip` 取 `config.skipRules.webview['插件ID']` + `_global_` 合并

**UI 层面同步需要修改（4 处）**：

**① IPC 接口返回格式更新**：`cursor:getInstalledExtensions` 需返回每个插件的 Webview 状态和备份信息：
```js
// 新返回格式
{
  id: 'eamodio.gitlens',    displayName: 'GitLens',
  version: '15.x',          hasWebview: true,       // 无则灰显不可勾选
  isPatched: true,           backupVersion: '15.0',  // null = 未注入
  versionMismatch: true      // 插件已更新，需重新汉化
}
```

**② 插件列表每行新增状态标签**：
```
[x]  anysphere.remote-ssh   Remote SSH   v1.0.48   🟢 已注入 v1.0.48
[x]  github.copilot         Copilot      v1.2x     🟡 插件已更新 v1.1x→v1.2x，建议重新汉化
[ ]  eamodio.gitlens        GitLens      v15.x     ⚪ 未汉化
     ms-python.python       Python       v2024     ─  无 Webview（灰显，不可勾选）
```

**③ 状态卡片 Webview 备份改为摘要行**：
```
插件汉化  🟢 2 个已注入 / 4 个含 Webview（1 个版本不匹配）
          [查看详情 ▼]  ← 点击展开插件列表
```

**④ 术语微调**：
- "注入插件 Webview 层（深度）" → "汉化插件 Webview"
- "全局 Webview 规则（兜底）" → "插件通用跳过规则（兜底）"

**UI 不需要改动的部分**：主开关位置与行为、插件列表整体布局、黑名单编辑弹窗、字典卡片、日志终端。



### 🟡 P2-1：Skip 黑名单补全 `titles` 和 `urls` 两种类型

原版运行时在 `init()` 入口处检查：
```js
if (SKIP_URLS.some(u => location.href.includes(u)) || 
    SKIP_TITLES.some(t => document.title.includes(t))) return;
```
**效果**：对于某些特殊窗口（如设置页、欢迎页），可以整窗口跳过翻译。

**修复**：在各插件/主窗口的 `skipRules` 结构中增加 `titles` 和 `urls` 字段，UI 中在每个黑名单编辑区增加对应 textarea。

数据结构调整：
```json
"skipRules": {
  "workbench": {
    "selectors": ".monaco-breadcrumbs, ...",
    "titles": ["Output", "Terminal"],
    "urls": ["vscode-extension://"]
  },
  "webview": {
    "_global_": {
      "selectors": ".webview-find-widget",
      "titles": [],
      "urls": []
    }
  }
}
```

---

### 🟡 P2-2：全局变量名兼容性处理（已确认策略）

**确认方向**：`window.__I18N_TERMS__` 为新的规范主变量，`window.__CURSOR_TERMS__` 保留为向后兼容别名（指向同一对象）。

**注入代码（injection snippet）**：
```js
// 新主变量优先赋值
window.__I18N_TERMS__  = Object.assign(window.__I18N_TERMS__ || {}, I18N_DICT);
// 旧变量作为别名，指向同一对象，兼容旧版 CLI 残留的引擎代码
window.__CURSOR_TERMS__ = window.__I18N_TERMS__;
```

**运行时引擎读取（translator-engine.js）**：
```js
// 优先读新变量，旧变量作为 fallback
const I18N_TERMS = window.__I18N_TERMS__ || window.__CURSOR_TERMS__ || {};
```

**兼容性覆盖的三个场景**：
- 旧版 CLI 残留引擎读 `__CURSOR_TERMS__` → 拿到最新字典（别名同步）
- 主窗口 postMessage 桥接下发数据 → 新旧引擎都能从各自变量读到同一份缓存
- 用户从 CLI 升级后 → 无需清理旧注入，新注入覆盖别名，字典自动合并



---

### 🟡 P2-3：跨版本旧备份自动清理

**场景**：Cursor 更新后（如 v1.53 → v1.54），旧的 `workbench.js.bak-v1.53xx` 已无意义，但会残留占用空间且产生误导。

**修复**：在 `install()` 成功后扫描 workbenchDir，删除所有版本号与当前不符的 `.bak-v*` 文件，打印日志告知用户。

---

### 🟡 P2-4：缓存占用监控

原版运行时在启动和每次写缓存后都会计算 `localStorage` 占用并输出彩色预警日志（5MB 限制，超 80% 变红）。新版缺失，用户无法感知缓存即将满的风险（满了会静默写入失败，导致 AI 翻译结果无法持久化）。

**修复**：在 `packages/core/src/translator-engine.js` 中补全 `logCacheStatus()` 函数。

---

## 修复任务分解（追加到 UI 重构实施阶段）

| 任务 | 文件 | 优先级 |
|------|------|--------|
| 新增 checksum 重写逻辑 | `patcher-cursor/index.js` | 🔴 P0 |
| 新增 macOS 签名重置 | `patcher-cursor/index.js` | 🔴 P0 |
| 重构插件注入为 JS 追加方式 | `patcher-cursor/index.js` | 🟠 P1 |
| `getPluginPaths()` 扫描 webview/index.js | `patcher-cursor/index.js` | 🟠 P1 |
| 插件独立备份与版本检测 | `patcher-cursor/index.js` | 🟠 P1 |
| UI 插件列表只展示含 webview/index.js 的插件 | `CursorPanel/SkipRules/PluginSelector.jsx` | 🟠 P1 |
| 补全 skipRules titles/urls 字段 | UI + patcher-cursor + translator-engine | 🟡 P2 |
| 修复全局变量名兼容性 | `patcher-cursor/index.js` + `translator-engine.js` | 🟡 P2 |
| 跨版本旧备份自动清理 | `patcher-cursor/index.js` | 🟡 P2 |
| 补全缓存占用监控日志 | `core/src/translator-engine.js` | 🟡 P2 |

---

## Claude Patcher 缺陷修复计划（原项目对比分析后新增）

> [!CAUTION]
> 以下缺陷直接导致 Claude 汉化功能部分或完全失效，需在 UI 重构阶段同步修复。

### 🔴 P0-1：`skip` 读取 key 错误导致黑名单完全失效

**问题**：新版代码直接复制了 Cursor 的配置结构 `config.skip._cursor_`，但在 Claude 专属配置中，`_cursor_` 节点是不存在的，导致 Claude 的黑名单数组永远为空。

**修复位置**：`packages/patcher-claude/index.js` 的 `install()`

**修复方案**：
将 `config.skip?._cursor_` 修正为正确的层级，例如使用根级 `skip` 或者专属的 `_claude_`：
```js
// 修改前（错误）
skip: { ...(config.skip?._cursor_ || {}), selectors: config.skip?._cursor_?.selectors || [] }

// 修改后（建议统一读取 _claude_ 并透传 titles/urls）
skip: { 
  selectors: config.skip?._claude_?.selectors || [],
  titles: config.skip?._claude_?.titles || [],
  urls: config.skip?._claude_?.urls || []
}
```

### 🔴 P0-2：「已注入无备份」检测逻辑过于激进

**问题**：当遇到 ASAR 已被修改但本地无备份文件时，原版逻辑是“警告但尝试继续或提取当前 ASAR”，新版逻辑是直接 `throw new Error` 终止部署，导致老用户升级后无法直接使用，必须重装 Claude。

**修复位置**：`packages/patcher-claude/index.js` 的 `install()`

**修复方案**：降级为警告，并尝试 fallback 到现有 ASAR。
```js
// 修改前
} else if (isAlreadyLocalized) {
    throw new Error('Current ASAR is already modified but no backup exists. Please reinstall Claude.');
}

// 修改后
} else if (isAlreadyLocalized) {
    onProgress('⚠️ 警告：当前包已被修改且无纯净备份，本次操作将基于已修改版本进行（不建议）。如遇异常，请重装 Claude。');
    extractionSource = ASAR_FILE;
}
```

### 🔴 P0-3：`detectStatus` 缺少关键备份字段（UI 联动必须）

**问题**：返回的数据结构过于简单，导致前端状态卡片无法正确显示“备份状态”和“版本匹配提示”。

**修复方案**：在 `patcher-claude/index.js` 的 `detectStatus` 中补全字段：
```js
return {
  installed: true,
  version,
  isPatched,
  hasBackup: fs.existsSync(ASAR_BAK), // 补全：是否拥有当前版本的备份
  backupVersion: extractBackupVersion(RESOURCES_PATH) || null, // 补全：系统现存备份的版本号
  versionMismatch: checkVersionMismatch() // 补全：备份版本与当前安装版本是否脱节
};
```

### 🟠 P1-1：恢复（Restore）操作遗漏资源文件回滚

**问题**：部署时不仅修改了 ASAR，还将 `zh-CN.json` 和 `Localizable.strings` 复制到了应用的资源目录（如 `en-US.json`, `zh-Hans.lproj`）。原版和现版新代码在 `restore()` 时都忘记了把这些资源文件删除或回滚，导致恢复原版后，界面的部分硬编码多语言文本依然是中文。

**修复方案**：在 `patcher-claude/index.js` 的 `restore()` 脚本中追加清理命令：
```sh
# 恢复默认的英文 json (可选: 提前备份原 en-US.json)
# 清理部署时生成的 .lproj 汉化资源
rm -rf "${path.join(RESOURCES_PATH, 'zh-Hans.lproj')}"
rm -rf "${path.join(RESOURCES_PATH, 'ja.lproj')}"
```

### 🟠 P1-2：跨版本旧备份自动清理缺失

**问题**：Claude 自动更新后，旧版本的 `.bak` 和 `.unpacked` 备份堆积，占用大量空间且影响版本检测。

**修复方案**：在 `install()` 流程中增加清理逻辑（与 Cursor 补齐）：
```js
const allFiles = fs.readdirSync(RESOURCES_PATH);
allFiles.forEach(f => {
    if (f.includes('.bak') && !f.includes(currentVersion)) {
        deployScript += `rm -rf "${path.join(RESOURCES_PATH, f)}"\n`;
    }
});
```

### 🟠 P1-3：`ja-JP.json` 资源部署遗漏

**问题**：原版防回退策略中，除了覆盖 `en-US.json` 外，同时覆盖了 `ja-JP.json`，防止特定环境下的多语言自动回退。新版部署脚本漏掉了这一步。

**修复方案**：在 `install()` 部署脚本中补全：
```sh
deployScript += `cp "${ZH_CN_SOURCE}" "${path.join(RESOURCES_PATH, 'ja-JP.json')}"\n`;
```

---

## 修复任务分解 (Claude 篇)

| 任务 | 文件 | 优先级 |
|------|------|--------|
| 修复 `skip` 读取的 key (`_cursor_` -> `_claude_`) 并透传 titles/urls | `patcher-claude/index.js` | 🔴 P0 |
| 「已注入无备份」检测逻辑从 `throw` 降级为警告 | `patcher-claude/index.js` | 🔴 P0 |
| 完善 `detectStatus` 返回的备份状态结构 | `patcher-claude/index.js` | 🔴 P0 |
| `restore()` 新增汉化资源文件（json/.lproj）清理 | `patcher-claude/index.js` | 🟠 P1 |
| 增加跨版本旧备份文件自动删除逻辑 | `patcher-claude/index.js` | 🟠 P1 |
| 部署脚本补全 `ja-JP.json` 覆盖 | `patcher-claude/index.js` | 🟠 P1 |
| （已完成）注入时补全 `__CLAUDE_TERMS__` 兼容别名 | `patcher-claude/index.js` | 🟡 P2 |

### 🖥️ Claude UI 层面同步需要修改（3 处）

**① Claude 状态卡片升级**：
随着 `detectStatus` 返回完整备份状态（P0-3），`ClaudePanel/StatusCard.jsx` 需要和 Cursor 一样展示丰富的备份摘要和版本脱节警告。
```
状态显示示例：
  🟢 已注入 (版本 1.12.x)
  ✅ 备份已锁定 (1.12.x)
  或
  🟡 核心已升级，建议重新部署
```

**② 黑名单编辑器数据结构绑定**：
Claude 的黑名单编辑组件需严格绑定到全局配置的 `config.skip._claude_` 节点下（修复 P0-1 带来的数据层变化），而不能再与 Cursor 混用或指向错误的 `_cursor_`。

**③ 补全 titles/urls 编辑区**：
在 Claude 的黑名单编辑弹窗/面板中，与 Cursor 一样，补充 "窗口标题 (Titles)" 和 "匹配网址 (URLs)" 的多行文本输入框，以支持整窗口级屏蔽。
