# 功能清单

已识别 9 个功能，按面向用户的能力分组。

| # | 功能 | 入口点 | 核心文件 | 依赖 |
|---|---|---|---|---|
| 1 | Cursor 运行时注入 | `patcher-cursor/index.js:115`, `CursorPanel/index.jsx:55` | patcher-cursor/index.js, CursorPanel/ | 5, 6, 3, 4, 8 |
| 2 | Claude 运行时注入 | `patcher-claude/index.js:209`, `ClaudePanel/index.jsx:21` | patcher-claude/index.js, ClaudePanel/ | 5, 6, 3, 4, 8 |
| 3 | API 密钥管理 | `main.js:36 saveApiKeys()`, `ApiKeysPanel.jsx:61` | main.js, ApiKeysPanel.jsx | 4 (testConnection) |
| 4 | 字典生成 | `dict-generator/index.js:29`, `main.js:430` | generator.js, extractors/, adapters/, formatters/ | 1, 2 (源路径), 3 |
| 5 | 翻译运行时内核 | `core/translator-engine.js:1` | translator-engine.js, language-names.js | 无（自包含） |
| 6 | 配置持久化与迁移 | `main.js:26 loadConfig()`, `configStore.js:3` | main.js, configStore.js | 无（基础层） |
| 7 | 自动更新 | `main.js:203 setupAutoUpdater()`, `UpdateNotification.jsx:19` | main.js, UpdateNotification.jsx | 无 |
| 8 | 跳过规则配置 | `SkipRulesCard.jsx:1`, `BlacklistCard.jsx:1` | SkipRules/ (6 个文件), BlacklistCard.jsx | 6 |
| 9 | 桌面应用外壳与 i18n | `main.js:175 createWindow()`, `App.jsx:15` | App.jsx, Sidebar.jsx, i18n.js, 34 个语言文件 | 6 |

## 功能边界

功能 1 和 2 保持独立：尽管具有相同的模式（面板 → 注入器 → 内核），但注入策略有根本性差异——Cursor 修改原始 JS 文件，Claude 进行 ASAR 解包/重新打包。两者不共享任何注入代码。

功能 4（字典生成）既可以独立调用（DictGeneratorPanel），也可以在部署流程中内联调用（CursorPanel index.jsx:170, ClaudePanel index.jsx:115）。内联调用属于部署编排，而非独立功能。

功能 5（运行时内核）没有任何 import——它是一个自包含的 IIFE，以原始形式追加到第三方应用包中。其唯一接口是 `window.__I18N_CONFIG__` 和 `window.__I18N_TERMS__` 全局变量。

功能 6（配置持久化）是基础数据层。所有功能面板都从中读取数据。旧版本迁移（`main.js:62-133`）属于此功能的一部分，而非独立功能。
