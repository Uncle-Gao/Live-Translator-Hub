# Changelog / 更新日志
## [3.0.1] - 2026-05-05


### Download / 下载指引

| Platform / 平台 | Arch / 架构 | Download / 下载 |
|:---|:---|:---|
| macOS | x64 (Intel) | [Live Translator Hub-3.0.1-mac-x64.dmg](https://github.com/Uncle-Gao/Live-Translator-Hub/releases/download/v3.0.1/Live%20Translator%20Hub-3.0.1-mac-x64.dmg) |
| macOS | arm64 (Apple Silicon) | [Live Translator Hub-3.0.1-mac-arm64.dmg](https://github.com/Uncle-Gao/Live-Translator-Hub/releases/download/v3.0.1/Live%20Translator%20Hub-3.0.1-mac-arm64.dmg) |
| Windows | x64 | [Live Translator Hub-3.0.1-win-x64.exe](https://github.com/Uncle-Gao/Live-Translator-Hub/releases/download/v3.0.1/Live%20Translator%20Hub-3.0.1-win-x64.exe) |
| Linux | x64 | [Live Translator Hub-3.0.1-linux-x64.AppImage](https://github.com/Uncle-Gao/Live-Translator-Hub/releases/download/v3.0.1/Live%20Translator%20Hub-3.0.1-linux-x64.AppImage) |

> **macOS**: If prompted that the developer cannot be verified, go to **System Settings → Privacy & Security** and click "Open Anyway".
> **Windows**: If SmartScreen blocks the app, click "More info" → "Run anyway".
> **Linux**: Run `chmod +x` on the AppImage before executing.

### Changelog


#### Bug Fixes

- restore publish config for electron-updater, keep GH_TOKEN removed

- make titleBarStyle hidden macOS-only to restore window controls on Windows

- hide native menu bar on Windows/Linux

- move electron-updater publish config from builder yml to code



#### Documentation

- add release/publishing workflow to CLAUDE.md

- add bilingual download table and dual-language changelog to cliff.toml

- simplify changelog — download table in header, one file per platform



#### Features

- add minimal macOS application menu with keyboard shortcuts

- split app icon into platform-specific variants and fix Windows/Linux window chrome



#### Releases

- bump version to 3.0.1



### 更新日志


#### Bug 修复

- restore publish config for electron-updater, keep GH_TOKEN removed

- make titleBarStyle hidden macOS-only to restore window controls on Windows

- hide native menu bar on Windows/Linux

- move electron-updater publish config from builder yml to code



#### 文档

- add release/publishing workflow to CLAUDE.md

- add bilingual download table and dual-language changelog to cliff.toml

- simplify changelog — download table in header, one file per platform



#### 新功能

- add minimal macOS application menu with keyboard shortcuts

- split app icon into platform-specific variants and fix Windows/Linux window chrome



#### 发布

- bump version to 3.0.1



## [2.5.0] - 2026-04-02

### 核心突破：Webview 插件深度汉化与全局同步架构
- **插件汉化支持**：正式支持 Cursor 内部 Webview 插件（如 Claude Code）的自动化注入与汉化。
- **跨窗口翻译代理桥 (Translation Bridge)**：通过 `postMessage` 解决了插件 Webview 的 CSP 联网限制问题。
- **通讯穿透增强**：采用 `window.top` 直连与递归广播机制，确保在多层嵌套 iframe 下依然能 100% 触达插件内部。
- **交互升级：全局调试状态同步**：主窗口与所有插件 Webview 的调试高亮（蓝色虚线框）状态现在实时同步，一键联动。
- **分域屏蔽体系**：主窗口与各插件支持独立的屏蔽规则（CSS 选择器、标题、URL）。
- **交互流优化**：
    - 一键汉化后自动询问是否继续汉化插件。
    - 恢复官方流程加入插件联动恢复询问。
- **视觉增强**：翻译中的字段自动追加 Loading 动画，大小与文字高度一致。
- **日志精细化**：在控制台中清晰标注 `[Workbench]` 或 `[Plugin Name]` 的运行状态。
- **多平台构建**：发布 macOS、Windows、Linux 的原生二进制执行文件。

## [2.4.3] - 2026-03-29

### 交互演进：二级触发与全平台适配
- **二级触发交互**：引入冷门快捷键（Mac: `Cmd+Opt+Shift+B` | Win: `Ctrl+Alt+Shift+B`）动态切换高亮。
- **悬停显示原文 (Alt+Hover)**：按住 `Alt/Option` 悬停于中文上可弹出带"原文："前缀的浮窗。
- **常态化溯源**：`data-i18n-original` 标签始终注入。
- **一键缓存清理**：安装器新增选项 `5` 支持物理级重置 AI 翻译缓存。
- **彻底卸载引导**：恢复官方流程现允许同时删除本地配置。
- **智能规则合并**：自动将最新屏蔽规则合并至旧版用户配置中。
