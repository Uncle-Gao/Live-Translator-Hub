# Claude 运行时注入流程图

```mermaid
flowchart TD
  subgraph P0["预部署：自动备份"]
    Z0["检测到 versionMismatch<br/>ClaudePanel/index.jsx:44"]
    Z1["setShowSudoOverlay(true)<br/>ClaudePanel/index.jsx:46"]
    Z2["IPC: claude:createBackup<br/>main.js:356-365"]
    Z3["ClaudePatcher.createBackup<br/>patcher-claude/index.js:245"]
    Z4{"备份已存在？<br/>patcher-claude/index.js:261"}
    Z5["sudo.exec：cp asar 到 .bak<br/>patcher-claude/index.js:293"]
    Z6["refreshStatus()<br/>ClaudePanel/index.jsx:49"]
  end

  subgraph P1["UI：部署初始化"]
    A1["点击部署<br/>ClaudePanel/index.jsx:167"]
    A2{"引擎已配置？<br/>ClaudePanel/index.jsx:168-173"}
    A3["显示 EngineWarningModal<br/>ClaudePanel/index.jsx:226-235"]
    A4["executeDeploy()<br/>ClaudePanel/index.jsx:56"]
  end

  subgraph P2["字典检查与生成"]
    B1["IPC getDictStatus<br/>ClaudePanel/index.jsx:74"]
    B2{"字典存在？"}
    B3["通过 IPC dict:generate 生成字典<br/>ClaudePanel/index.jsx:115"]
  end

  subgraph P3["保存配置与 IPC 桥接"]
    C1["saveConfig()<br/>ClaudePanel/index.jsx:141"]
    C2["IPC i18n:installClaude<br/>main.js:341-345"]
    C3["loadApiKeys + buildHooks<br/>main.js:342-344"]
  end

  subgraph P4["注入器：ASAR 解包"]
    D1["resolveResourcesPath<br/>patcher-claude/index.js:307"]
    D2["rm -rf TEMP_DIR + mkdir<br/>patcher-claude/index.js:329-330"]
    D3["asar.extractAll(source, TEMP_DIR)<br/>patcher-claude/index.js:342"]
  end

  subgraph P5["注入器：注入引擎"]
    E1["fs.readFileSync：translator-engine.js<br/>patcher-claude/index.js:345"]
    E2["构建 engineConfig JSON + 注入代码<br/>patcher-claude/index.js:350-375"]
    E3["对每个 preload 文件（mainView.js, mainWindow.js）：<br/>fs.writeFileSync 追加注入代码<br/>patcher-claude/index.js:377-388"]
  end

  subgraph P6["注入器：重新打包 ASAR"]
    F1["asar.createPackageWithOptions<br/>patcher-claude/index.js:393"]
    F2["crypto.createHash('sha256') headerHash<br/>patcher-claude/index.js:395-397"]
  end

  subgraph P7["部署脚本与提权执行"]
    G1["平台判断：构建 PowerShell/shell 脚本<br/>patcher-claude/index.js:402-455"]
    G2["macOS：PlistBuddy + xattr + codesign<br/>patcher-claude/index.js:65-71"]
    G3["_execScript 带 TCC 重试循环（40 次 × 3 秒）<br/>patcher-claude/index.js:22-45"]
    G4["cp asar, mv new asar, cp dicts<br/>生成的脚本命令"]
  end

  subgraph P8["UI 完成"]
    H1["setStep('patch', success)<br/>ClaudePanel/index.jsx:150"]
    H2["refreshStatus()<br/>ClaudePanel/index.jsx:152"]
  end

  Z0 --> Z1 --> Z2 --> Z3 --> Z4 --> Z5 --> Z6
  A1 --> A2 -->|否| A3
  A2 -->|是| A4 --> B1 --> B2 -->|否| B3
  B2 -->|是| C1
  B3 --> C1 --> C2 --> C3 --> D1 --> D2 --> D3 --> E1 --> E2 --> E3 --> F1 --> F2 --> G1 --> G2 --> G3 --> G4 --> H1 --> H2
```

## 外部依赖

| 依赖 | 文件:行号 | 用途 |
|---|---|---|
| `@electron/asar` | `patcher-claude/index.js:342,393` | ASAR 解包与重新打包 |
| `sudo-prompt` | `patcher-claude/index.js:293` | 仅用于备份的提权 cp |
| `@live-translator/core/translator-engine.js` | `patcher-claude/index.js:345` | 运行时内核 |
| `@live-translator/core/language-names` | `patcher-claude/index.js:349` | 语言代码映射 |
| macOS PlistBuddy | `patcher-claude/index.js:67-68` | 更新 Info.plist 哈希 |
| macOS xattr | `patcher-claude/index.js:69-70` | 移除隔离属性 |
| macOS codesign | `patcher-claude/index.js:71` | 重新签名 .app 包 |
| `crypto.createHash` | `patcher-claude/index.js:397` | ASAR 头部 SHA-256 |
| `child_process.execSync` | `patcher-claude/index.js:22` | 提权脚本执行 |
| `shell.openExternal` | `main.js:333` | 打开 macOS TCC 偏好设置 |
