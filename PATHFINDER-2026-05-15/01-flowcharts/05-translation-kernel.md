# 翻译运行时内核流程图

```mermaid
flowchart TD
  subgraph INIT["初始化"]
    I1["读取 window.__I18N_CONFIG__ + window.__I18N_TERMS__<br/>translator-engine.js:8-16"]
    I2["从 localStorage 加载缓存 + 检查 cacheVersion 不匹配<br/>translator-engine.js:26-38"]
    I3["从 I18N_TERMS.regex 初始化 initRegexRules()<br/>translator-engine.js:334-339"]
    I4["注入 DEBUG_STYLE + tooltip div<br/>translator-engine.js:476-482"]
    I5["添加监听器：keydown（调试）、mouseover（悬停提示）、message（桥接）<br/>translator-engine.js:484-554"]
    I6["observer.observe(document.body) + walkAndTranslate(document.body)<br/>translator-engine.js:554-556"]
  end

  subgraph STATIC["静态翻译路径"]
    S1["MutationObserver：childList + attributes(title)<br/>translator-engine.js:455-464"]
    S2["requestAnimationFrame → walkAndTranslate 缓冲节点<br/>translator-engine.js:449-452"]
    S3["getTranslation：尝试字典（直接 + 嵌套）→ 正则规则 → 缓存<br/>translator-engine.js:352-374"]
    S4{"找到翻译？"}
    S5["替换 textContent + 添加 debug-highlight 类<br/>translator-engine.js:404-410"]
    S6{"包含中文字符？"}
    S7["scheduleTranslation → AI 管道<br/>translator-engine.js:375"]
  end

  subgraph AI_PIPE["AI 翻译管道"]
    A1["scheduleTranslation：添加到 PENDING_JOBS<br/>translator-engine.js:310"]
    A2["globalBatchTimer：等待 2000ms，收集批次<br/>translator-engine.js:313-314"]
    A3["按 30 条分块，每块调用 callOnlineAPI<br/>translator-engine.js:322-326"]
    A4["callOnlineAPI 分发到 callOpenAI/Anthropic/Gemini/DeepL<br/>translator-engine.js:111-117"]
    A5["fetch POST 到 AI 提供商端点<br/>translator-engine.js:131/166/214/251"]
    A6["解析响应 → applyTranslations(map)<br/>translator-engine.js:269-298"]
    A7["localStorage.setItem(CACHE_KEY) 持久化<br/>translator-engine.js:276"]
    A8["requestAnimationFrame → walkAndTranslate 处理新文本<br/>translator-engine.js:297"]
  end

  subgraph BRIDGE["翻译桥接"]
    B1["iframe/webview：postMessage I18N_BRIDGE_REQ 到顶层窗口<br/>translator-engine.js:304-306"]
    B2["顶层窗口：getTranslation → postMessage I18N_BRIDGE_PUSH 返回<br/>translator-engine.js:542-546"]
    B3["顶层窗口：applyTranslations → 广播到所有子框架<br/>translator-engine.js:282-294"]
  end

  subgraph DEBUG["调试模式"]
    D1["Cmd+Option+Shift+B 切换 .i18n-debug-active<br/>translator-engine.js:484-496"]
    D2["Alt + 悬停 .i18n-debug-highlight 显示原文 tooltip<br/>translator-engine.js:514-527"]
  end

  I1 --> I2 --> I3 --> I4 --> I5 --> I6
  I6 --> S1 --> S2 --> S3 --> S4
  S4 -- 是 --> S5
  S4 -- 否 --> S6
  S6 -- 是 --> S7
  S6 -- 否 --> S7
  S7 --> A1 --> A2 --> A3 --> A4 --> A5 --> A6 --> A7 --> A8
  A8 --> S2
  B1 --> B2 --> B3
  D1 --> D2
```

## 可配置常量

| 常量 | 行号 | 值 | 描述 |
|---|---|---|---|
| `REQUEST_INTERVAL` | 68 | 2000ms | 收集批次前的防抖时间 |
| `chunkSize` | 322 | 30 | 每次 API 调用的文本数 |
| `HAS_CHINESE` | 109 | `/[一-龥]/` | 中文字符检测正则 |
| `SKIP_TAGS` | 18 | SCRIPT, STYLE, TEXTAREA 等 | 永不翻译的 HTML 标签 |
| 缓存限制 | 46 | 5120 KB | 仅警告阈值（不驱逐） |
| OpenAI `model` | 138 | `gpt-4o-mini` | 默认模型 |
| OpenAI `temperature` | 142 | 0.3 | 补全随机性 |
| OpenAI `max_tokens` | 141 | 4096 | 响应 token 限制 |
| Anthropic `model` | 174 | `claude-sonnet-4-6` | 默认模型 |
| Gemini `model` | 211 | `gemini-2.0-flash` | 默认模型 |
| Gemini `temperature` | 219 | 0.1 | 生成温度 |
| `enableDictionary` | 11 | true | 静态字典查找 |
| `enableNestedDict` | 12 | true | 递归字典搜索 |
| `enableRegex` | 13 | true | 正则模式规则 |
| `enableTranslationBridge` | 14 | true | iframe↔top postMessage 桥接 |
| `enableLoadingAnimation` | 15 | true | 待翻译文本的 CSS 加载动画 |
