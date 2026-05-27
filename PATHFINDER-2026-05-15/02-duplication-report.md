# 重复代码报告

## 跨功能重复

### 1. 部署编排辅助函数（应统一）

**位置：**
- `CursorPanel/index.jsx:12` — `PROGRESS_RE` 正则表达式
- `ClaudePanel/index.jsx:12` — 完全相同的 `PROGRESS_RE` 正则表达式
- `CursorPanel/index.jsx:66-78` — `steps`、`showDeployModal`、`setStep`、`appendLog`
- `ClaudePanel/index.jsx:28-40` — 完全相同的实现
- `CursorPanel/index.jsx:350-351` — `hasErrorInSteps`、`allDone`
- `ClaudePanel/index.jsx:221-222` — 完全相同

**原因：** 两个面板基于同一模板构建，之后各自演进。辅助函数从未被提取出来。

**结论：** 提取为共享的 `useDeploySteps()` hook。

### 2. 字典状态与生成流程（应统一）

**位置：**
- `CursorPanel/index.jsx:119-190` — 带 fallback 处理的字典检查
- `ClaudePanel/index.jsx:70-130` — 无 fallback 处理的字典检查

**原因：** fallback 处理被添加到 CursorPanel，但从未移植到 ClaudePanel。AI 生成内部代码块（注册进度监听器、调用 `generateDict`、错误处理）结构完全相同。

**结论：** 将 fallback 处理移植到 ClaudePanel。提取共享的字典生成流程。

### 3. DeployConfig 共享 UI（应部分统一）

**位置：**
- `CursorPanel/DeployConfig.jsx`（189 行）
- `ClaudePanel/DeployConfig.jsx`（134 行）

**相同部分：** 语言选择器、引擎选择器、功能开关（enableDictionary、enableRegex、enableNestedDict、enableTranslationBridge）、缓存重置复选框、高级切换按钮——全部仅在 CSS 强调色上不同（蓝色 vs 紫色）。

**不同部分：** Cursor 额外添加了 `injectWebview` 开关、插件选择器 UI、加载动画开关以及 `enableLoadingAnimation` 功能开关，采用不同的网格布局。Claude 仅有加载动画开关 + 功能开关。

**结论：** 提取 `BaseDeployConfig` 组件，接受 `accentColor` 属性和一个用于额外控件的插槽。两个面板的差异纯粹是表现层的。

### 4. engineConfig 构建（应统一）

**位置：**
- `patcher-cursor/index.js:260-272`
- `patcher-claude/index.js:350-372`

**完全相同：** `apiType`、`engineId`、`targetLanguage`、`targetLanguageCode`、4 个引擎空值检查、`cacheVersion`、`features` 默认值——逐行完全相同。

**不同：** `skip` 字段结构。Cursor 将 `DEFAULT_SKIPS` 与自定义选择器合并；Claude 直接从 `_claude_` 命名空间读取 selectors/titles/urls。

**结论：** 提取共享的 `buildEngineConfig()` 函数，接受命名空间前缀。在配置层标准化 `skip` 数据结构。

### 5. 功能开关默认值（应统一）

**位置：**
- `configStore.js:9-15` — `cursor.features` 默认值
- `configStore.js:47-53` — `claude.features` 默认值
- `patcher-cursor/index.js:271` — `Object.assign` 默认值
- `patcher-claude/index.js:365-371` — 完全相同的 `Object.assign` 默认值

所有四个位置列出了相同的 5 个开关和相同的默认值。逐字节完全相同。

**结论：** 定义一次 `DEFAULT_FEATURES` 常量，在所有地方引用。

### 6. API 适配器接口（合理差异）

所有 4 个适配器一致导出 `{ translateBatch, testConnection }`。`config` 结构因提供商而异（DeepL 需要 `deeplCode`，OpenAI 需要 `model`），这是不同 API 需求的固有差异。无需处理。

---

## 功能内部重复

### W1. 4 个 AI 提供商函数——相同管道，不同端点

**位置：** `translator-engine.js:122-267` — `callOpenAI`、`callAnthropic`、`callGemini`、`callDeepL`

所有四个都遵循 `构建提示词 → fetch → 解析 → 提取 → 构建结果映射 → applyTranslations`。解析/验证/映射逻辑在 OpenAI、Anthropic、Gemini 中重复出现。代码围栏剥离（`stripCodeFence`）在第 185 行和第 227 行完全相同。

**结论：** 提取共享的 `processAIResponse(raw, texts, provider)` + `stripCodeFence()`。

### W2. `testConnection` — 4 处完全相同

**位置：** `openai-adapter.js:54-58`、`anthropic-adapter.js:57-60`、`gemini-adapter.js:50-54`、`deepl-adapter.js:58-62`

所有四个适配器的 `testConnection` 函数体完全相同：翻译 `['Hello']` 到 `'zh-CN'`，检查结果，返回 true。

**结论：** 提取到共享的 `api-adapters/shared.js`。

### W3. `parseResponse` — 3 处重复

**位置：** `openai-adapter.js:79-91`、`anthropic-adapter.js:81-95`、`gemini-adapter.js:73-86`

相同的 JSON 解析 + translations 数组验证 + 长度检查。Anthropic 和 Gemini 都剥离代码围栏；OpenAI 不需要。

**结论：** 提取 `parseJsonTranslations(raw, expectedCount, { stripFences })`。

### W4. 3 个 `generate*` 方法——相同的 7 步工作流

**位置：** `generator.js:85-109`、`generator.js:114-137`、`generator.js:142-163`

`generateCursor`、`generateClaude`、`generateStrings` 全部执行：提取 → 映射条目 → 翻译 → 格式化 → 统计缺失 → 原子写入。结构相同，提取器和格式化器不同。

**结论：** 提取 `_generate(extractor, formatter, getItemsFn, baseDir)`。

### W5. Patcher-Claude 备份脚本——3 处重复

**位置：** `patcher-claude/index.js:272-286`（createBackup）、`patcher-claude/index.js:404-434`（install）、`patcher-claude/index.js:497-513`（restore）

同样的 `cp asar → asar.bak` 逻辑在三个方法中被构建为 shell/PowerShell 字符串。

**结论：** 提取 `_backupScriptLines(platform)` 辅助函数。

### W6. Patcher-Cursor 注入代码模板——2 处

**位置：** `patcher-cursor/index.js:274-277`（workbench）、`patcher-cursor/index.js:319-322`（webview）

完全相同的 IIFE 包裹代码模板，仅配置变量名不同。

**结论：** 提取 `_buildInjectCode(dict, config, engineCode)`。

### W7. Patcher-Cursor 校验和 + 代码签名——各 2 处

**位置：**
- 校验和：`patcher-cursor/index.js:361-366`（install）、`patcher-cursor/index.js:432-438`（restore）
- 代码签名：`patcher-cursor/index.js:368-378`（install）、`patcher-cursor/index.js:440-449`（restore）

**结论：** 提取 `_updateChecksums(paths)` 和 `_reSignMacOS(appBundle)`。

### W8. ActionBar.jsx — 完整文件重复

**位置：** `ClaudePanel/ActionBar.jsx:1-52`、`CursorPanel/ActionBar.jsx:1-52`

完全相同的 52 行文件，仅在 Tailwind 类名上不同（`purple-*` vs `blue-*`）。

**结论：** 单一 `ActionBar` 组件配合 `theme` 属性。

### W9. 版本不匹配 useEffect — 2 处

**位置：** `ClaudePanel/index.jsx:43-54`、`CursorPanel/index.jsx:96-101`

相同的版本不匹配时备份逻辑，仅 API 名称和可选的 sudo 遮罩不同。

**结论：** 提取 `useVersionMismatchBackup(status, createBackupFn, callbacks)`。

---

## 总结

| # | 关注点 | 位置 | 结论 |
|---|---|---|---|
| 1 | 部署辅助函数 | 2 个面板 × 5 个函数 | 提取共享 hook |
| 2 | 字典状态/fallback | 2 个面板 | 统一 + 移植 fallback |
| 3 | DeployConfig UI | 2 个面板 | 提取 BaseDeployConfig |
| 4 | engineConfig 构建 | 2 个注入器 | 提取 buildEngineConfig() |
| 5 | 功能默认值 | 4 个位置 | 定义 DEFAULT_FEATURES |
| 6 | API 适配器 | 4 个适配器 | 合理差异——无需处理 |
| W1 | AI 提供商管道 | translator-engine.js 122-267 | 提取 processAIResponse |
| W2 | testConnection | 4 个适配器 | 提取到共享模块 |
| W3 | parseResponse | 3 个适配器 | 提取 parseJsonTranslations |
| W4 | generate* 方法 | generator.js 85-163 | 提取 _generate() |
| W5 | 备份脚本生成 | patcher-claude 3 个方法 | 提取 _backupScriptLines |
| W6 | 注入代码模板 | patcher-cursor 2 处 | 提取 _buildInjectCode |
| W7 | 校验和 + 代码签名 | patcher-cursor 各 2 处 | 提取辅助函数 |
| W8 | ActionBar.jsx | 完整文件重复 | 单一组件 + theme 属性 |
| W9 | 版本不匹配 effect | 2 个面板 | 提取 useVersionMismatchBackup |
