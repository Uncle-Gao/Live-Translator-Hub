# 字典生成流程图

```mermaid
flowchart TD
  subgraph UI["UI 层"]
    A1["独立生成器<br/>DictGeneratorPanel.jsx:8"]
    A2["内联生成：Cursor 部署<br/>CursorPanel/index.jsx:170"]
    A3["内联生成：Claude 部署<br/>ClaudePanel/index.jsx:115"]
  end

  subgraph IPC["IPC 桥接"]
    B1["generateDict → ipcRenderer.invoke('dict:generate')<br/>preload.js:27"]
    B2["dict:generate 处理器：new DictGenerator + 转发进度<br/>main.js:430"]
  end

  subgraph Entry["DictGenerator 入口"]
    C1["new DictGenerator({engine, lang, batchSize, apiConfig})<br/>index.js:29"]
    C2["generate(app, appPath) 分发到 generateCursor/Claude/Strings<br/>index.js:35"]
  end

  subgraph Extract["源字符串提取"]
    D1["cursorExtractor.extract()<br/>cursor-extractor.js:47"]
    D2["从 Cursor 包中解析嵌套 dictionary.json<br/>cursor-extractor.js:48-58"]
    D3["claudeExtractor.extract(appPath)<br/>claude-extractor.js:55"]
    D4["尝试 asar 备份 → 当前 asar → en-US.json 种子<br/>claude-extractor.js:60-95"]
    D5["stringsExtractor.extract()<br/>strings-extractor.js:55"]
    D6["解析 Localizable.strings key=value 格式<br/>strings-extractor.js:60-67"]
  end

  subgraph Translate["批量翻译与重试"]
    E1["_translateItems(items)<br/>generator.js:174"]
    E2["循环 attempt=1..3：batchSize=40 然后 RETRY_BATCH_SIZE=10<br/>generator.js:179-180"]
    E3["每批：adapter.translateBatch(texts, lang, apiConfig)<br/>generator.js:187-193"]
    E4["fetch() 调用 AI API 端点<br/>openai-adapter.js:24"]
    E5["解析 JSON，验证 translations 数组<br/>openai-adapter.js:79-91"]
    E6{"missing.length === 0？"}
    E7["是：跳出重试循环<br/>generator.js:210"]
    E8["否 且 attempt < MAX_RETRIES：用缺失项重试<br/>generator.js:212-214"]
    E9["发送进度：_emitProgress(done, total, attempt)<br/>generator.js:199"]
  end

  subgraph Format["格式化与原子写入"]
    F1["cursorFormatter.format(rawDict, resultMap)<br/>cursor-formatter.js:14"]
    F2["用翻译后的叶子值重建嵌套 JSON<br/>cursor-formatter.js:21"]
    F3["claudeFormatter.format(enMap, resultMap)<br/>claude-formatter.js:15"]
    F4["构建扁平 JSON {hash: translatedText}<br/>claude-formatter.js:16-19"]
    F5["_atomicWrite：fs.writeFileSync tmp + fs.renameSync<br/>generator.js:248-253"]
  end

  A1 --> B1
  A2 --> B1
  A3 --> B1
  B1 --> B2 --> C1 --> C2
  C2 --> D1 --> D2 --> E1
  C2 --> D3 --> D4 --> E1
  C2 --> D5 --> D6 --> E1
  E1 --> E2 --> E3 --> E4 --> E5 --> E6
  E6 -->|是| E7
  E6 -->|否，重试| E8 --> E2
  E6 -->|否，已达上限| E9
  E7 --> F1 --> F2 --> F5
  E7 --> F3 --> F4 --> F5
```

## 外部依赖

| 依赖 | 文件:行号 | 用途 |
|---|---|---|
| `@live-translator/patcher-cursor` | `cursor-extractor.js:11` | Cursor dictionary.json 路径 |
| `@live-translator/patcher-claude` | `claude-extractor.js:17` | Claude 应用资源路径与版本 |
| `@electron/asar` | `claude-extractor.js:32` | 从 app.asar 提取文件 |
| `openai-adapter.js` | `generator.js:21` | OpenAI 兼容的批量翻译 |
| `anthropic-adapter.js` | `generator.js:22` | Anthropic 批量翻译 |
| `gemini-adapter.js` | `generator.js:23` | Gemini 批量翻译 |
| `deepl-adapter.js` | `generator.js:24` | DeepL 批量翻译 |
| `cursor-formatter.js` | `generator.js:32` | 嵌套 JSON 输出 |
| `claude-formatter.js` | `generator.js:33` | 扁平 hash-JSON 输出 |
| `strings-formatter.js` | `generator.js:34` | Apple .strings 输出 |
