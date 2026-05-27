# `/make-plan` 交接提示词

以下每个提示词可直接复制粘贴到 `/make-plan` 中使用。它们针对 `03-unified-proposal.md` 中提出的统一系统。

---

## 系统 1：共享部署 Hook

```
制定计划，将共享的部署状态管理提取为自定义 React hook。

目标文件：packages/desktop-app/src/hooks/useDeploySteps.js

需要重写的调用点：
- CursorPanel/index.jsx:66-78 — setStep、appendLog、PROGRESS_RE、hasErrorInSteps、allDone、部署弹窗状态
- ClaudePanel/index.jsx:28-40 — 完全相同的副本
- CursorPanel/index.jsx:350-351 — hasErrorInSteps/allDone
- ClaudePanel/index.jsx:221-222 — 完全相同的副本

流程图参考：01-flowcharts/01-cursor-injection.md、01-flowcharts/02-claude-injection.md

反模式警戒：
- 不要创建类或 context provider——一个普通 hook（useState + useCallback）就足够了
- 不要改变 setStep 或 appendLog 的签名
- 不要引入通用的"步骤引擎"——这个 hook 只为两个消费者服务
```

---

## 系统 2：共享 buildEngineConfig()

```
制定计划，提取共享的引擎配置构建函数。

目标文件：packages/core/src/build-config.js

需要重写的调用点：
- patcher-cursor/index.js:260-272 — 9 个相同的键值对加上 skip 字段
- patcher-claude/index.js:350-372 — 相同的 9 个字段，不同的 skip 结构

流程图参考：01-flowcharts/01-cursor-injection.md、01-flowcharts/02-claude-injection.md

反模式警戒：
- 不要创建配置类或构建器模式——一个返回对象的单一函数即可
- 'skip' 字段是 Cursor 和 Claude 之间唯一的结构性差异——将其参数化，而不是抽象掉
- 用单一的共享常量替换 DEFAULT_FEATURES（来自系统 3）
```

---

## 系统 3：DEFAULT_FEATURES 常量

```
制定计划，定义单一的 DEFAULT_FEATURES 常量并在所有地方引用它。

目标文件：packages/core/src/build-config.js（与 buildEngineConfig 放在一起）

需要重写的调用点：
- configStore.js:9-15 — cursor.features 默认值
- configStore.js:47-53 — claude.features 默认值
- patcher-cursor/index.js:271 — Object.assign 默认值
- patcher-claude/index.js:365-371 — 完全相同的 Object.assign 默认值

常量值：
{
  enableDictionary: true,
  enableNestedDict: true,
  enableRegex: true,
  enableTranslationBridge: true,
  enableLoadingAnimation: true
}

反模式警戒：
- 不要使其在运行时可配置——它就是一个共享默认值
- 导出为普通 const，而非函数
```

---

## 系统 4：BaseDeployConfig 组件

```
制定计划，将共享的 DeployConfig UI 提取为通用组件。

目标文件：packages/desktop-app/src/components/shared/BaseDeployConfig.jsx

需要重写的调用点：
- CursorPanel/DeployConfig.jsx — 189 行，约 70% 与 Claude 共享
- ClaudePanel/DeployConfig.jsx — 134 行，是 Cursor UI 的严格子集

共享元素（除 CSS 强调色外完全相同）：
- 目标语言选择器
- 运行时引擎选择器
- 缓存重置复选框
- enableDictionary 开关（含禁用逻辑）
- enableRegex、enableNestedDict、enableTranslationBridge 开关
- 高级设置切换按钮

需要参数化的差异元素：
- accent：'blue' | 'purple'
- extraToggles：ReactNode（Cursor 额外添加 injectWebview 开关和插件选择器）
- extraAdvanced：ReactNode 插槽，用于额外的高级复选框

流程图参考：06-combined.md C-D 部分

反模式警戒：
- 不要添加插件系统或 render props——children/slots 就足够了
- 不要与 Claude 共享 Cursor 插件扫描器
- DeployConfig 函数保留为外层包装器；BaseDeployConfig 只处理共享的 JSX
```

---

## 系统 5：将 Fallback 字典逻辑移植到 ClaudePanel

```
制定计划，为 ClaudePanel 添加 fallback 字典处理，匹配 CursorPanel 的行为。

目标位置：ClaudePanel/index.jsx:70-130（字典检查部分）

需要修改的内容：
- 第 76 行：将 `if (dictInfo?.exists)` 替换为 `const needGenerate = !dictInfo?.exists || dictInfo?.fallback`
- 添加 fallback 处理分支（参考 CursorPanel 第 128-136 行的模式）：
  - 如果 fallback 字典存在但没有 AI 引擎：使用内置字典，警告用户
  - 如果无 fallback 且无引擎：警告仅运行时翻译

流程图参考：01-flowcharts/02-claude-injection.md

反模式警戒：
- 不要触碰 AI 生成内部代码块——它已经完全相同了
- 不要修改 CursorPanel 的 fallback 逻辑
```

---

## 系统 6：ActionBar 组件统一

```
制定计划，将两个完全相同的 ActionBar 组件合并为一个带 theme 属性的组件。

目标文件：packages/desktop-app/src/components/shared/ActionBar.jsx

调用点：
- CursorPanel/ActionBar.jsx（52 行）— 蓝色主题
- ClaudePanel/ActionBar.jsx（52 行）— 紫色主题

两个组件除了 4 个 CSS 类字符串外逐字节完全相同：
- rgba(59,130,246,0.3) vs rgba(147,51,234,0.3)
- from-blue-600 to-blue-400 vs from-purple-600 to-purple-400

添加 `theme` 属性（'blue' | 'purple'），映射到 Tailwind 类名查找表。

流程图参考：06-combined.md

反模式警戒：
- 不要"为未来"添加更多颜色——只有 'blue' 和 'purple' 存在
- 保持相同的导出接口（相同的 props，相同的默认导出）
```

---

## 系统 7：Patcher-Cursor 内部辅助函数

```
制定计划，提取 patcher-cursor 中重复的内部辅助函数。

目标文件：patcher-cursor/index.js

需要消除的重复：
1. _buildInjectCode(dict, config, engineCode) 替换第 274-277 行和第 319-322 行
   （完全相同的 IIFE 包裹模板）
2. _updateChecksums(paths) 替换第 361-366 行和第 432-438 行
   （完全相同的 product.json SHA-256 更新）
3. _reSignMacOS(appBundle) 替换第 368-378 行和第 440-449 行
   （完全相同的 macOS codesign + xattr 代码块）
4. _cleanBackups(directory, pattern, currentVersion) 替换第 294-299、330-335、411-425 行
   （备份清理的 3 个变体）

流程图参考：01-flowcharts/01-cursor-injection.md

反模式警戒：
- 这些只是内部辅助函数——不要从模块中导出它们
- 不要创建单独的文件——将它们作为私有函数保留在同一模块中
- 以下划线开头的名称表示私有
```

---

## 系统 8：Patcher-Claude 备份脚本统一

```
制定计划，提取 patcher-claude 中重复的备份脚本命令行生成逻辑。

目标文件：patcher-claude/index.js

重复内容：备份/恢复/安装方法都为以下操作生成完全相同的 cp 命令：
- 复制 app.asar → app.asar.{version}.bak
- 复制 app.asar.unpacked → app.asar.unpacked.bak
- 清理其他版本的过期 .bak 文件

这些出现在：
- createBackup：第 272-286 行
- install：第 404-434 行
- restore：第 497-513 行

提取 _backupScriptLines(asarFile, ASAR_BAK, UNPACKED_BAK, platform) → string[]
提取 _cleanStaleBackupsCommand(platform) → string[]

流程图参考：01-flowcharts/02-claude-injection.md

反模式警戒：
- 不要试图将 PowerShell 和 Shell 统一为单一 DSL——将它们保留为独立的分支，只提取决定"生成什么命令"的逻辑
- 不要改变脚本执行模型（仍然是 execSync 或 sudo）
```

---

## 系统 9：翻译引擎 AI 提供商管道

```
制定计划，从 4 个 AI 调用函数中提取共享的"提取-解析-应用"管道。

目标文件：packages/core/src/translator-engine.js

重复内容：
- callOpenAI（第 122-155 行）、callAnthropic（157-195）、callGemini（197-237）、callDeepL（239-267）
- 全部遵循：构建提示词 → fetch → 解析 JSON → 提取内容 → 构建结果映射 → applyTranslations → 捕获错误
- stripCodeFence 正则在第 185 行和第 227 行重复
- 空响应检查在 Anthropic 和 Gemini 中重复
- 结果映射组装（texts.forEach）在第 189-190 行和第 231-232 行重复

提取：
1. stripCodeFence(raw) — 被 Anthropic 和 Gemini 使用
2. processAIResponse(raw, texts, provider) — fetch 之后：解析、验证、映射、应用、错误日志

流程图参考：01-flowcharts/05-translation-kernel.md

反模式警戒：
- 引擎必须保持为自包含的 IIFE，没有任何 import
- 保持每个提供商的 fetch 调用独立——只有 fetch 之后的管道是重复的
- 不要抽象提示词构建——每个 API 需要不同的格式
- DeepL 使用根本不同的响应格式（{text, detected_source_language} 数组）——它可能不会从共享管道中受益
```

---

## 系统 10：字典生成器适配器共享工具

```
制定计划，从 dict-generator API 适配器中提取共享工具函数。

目标文件：packages/dict-generator/src/api-adapters/shared.js

重复内容：
1. testConnection — 4 处完全相同（openai-adapter:54-58、anthropic-adapter:57-60、gemini-adapter:50-54、deepl-adapter:58-62）
2. parseJsonTranslations(raw, expectedCount, { stripFences }) 替换 openai-adapter:79-91、anthropic-adapter:81-95、gemini-adapter:73-86 中的 parseResponse
3. buildTranslationPrompt(texts, targetLang) 替换 openai-adapter:62-72、anthropic-adapter:64-74、gemini-adapter:58-71 中的 buildSystemPrompt/buildPrompt
4. serialize(dict) 在 claude-formatter:28-30 和 cursor-formatter:43-45 之间共享

流程图参考：01-flowcharts/03-dict-generation.md

反模式警戒：
- 不要创建基类——shared.js 导出普通函数
- 每个适配器模块仍然拥有自己的 fetch 逻辑（不同的端点、认证、请求结构）
- prompt 函数应该接受提供商特定的选项（例如 Gemini 以内联方式包含输入字符串）
```

---

## 系统 11：字典生成器 `_generate()` 合并

```
制定计划，合并 Generator 类中的 3 个 generate* 方法。

目标文件：packages/dict-generator/src/generator.js

重复内容：generateCursor（第 85-109 行）、generateClaude（114-137）、generateStrings（142-163）
全部遵循相同的 7 个步骤：提取 → 映射条目 → _translateItems → 格式化 → 统计缺失 → 标记 _missing → 原子写入

提取：_generate(extractorFn, formatterFn, getItemsFn, baseDir, outputFilename)

每个方法变为配置参数的薄包装器。

流程图参考：01-flowcharts/03-dict-generation.md

反模式警戒：
- 不要改变公共 API（generate('cursor'|'claude'|'strings') 签名保持不变）
- 'missing' 统计适用于 cursor/claude 但不适用于 strings——用布尔标志处理
- 保持相同的进度事件发送格式
```
