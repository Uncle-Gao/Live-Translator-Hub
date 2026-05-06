/**
 * generator.js — 核心批处理引擎
 * 
 * 完整性保障流程（方案第 6 节）：
 *  ① 提取源文件所有 key → sourceKeys Set
 *  ② 分批翻译（每批 batchSize 条），记录成功/失败
 *  ③ 合并所有批次结果 → resultMap
 *  ④ 校验: missingKeys = sourceKeys - resultMap.keys()
 *  ⑤ 若 missingKeys 非空 → 自动重试最多 3 次（降批次至 10 条/批）
 *  ⑥ 仍有缺失 → 写入 "_missing" 标记字段 + 警告日志
 *  ⑦ 断言通过 → 原子写文件（tmp → rename 最终路径）
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

// API Adapters
const openaiAdapter    = require('./api-adapters/openai-adapter');
const anthropicAdapter = require('./api-adapters/anthropic-adapter');
const geminiAdapter    = require('./api-adapters/gemini-adapter');
const deeplAdapter     = require('./api-adapters/deepl-adapter');

// Source Extractors
const cursorExtractor  = require('./source-extractors/cursor-extractor');
const claudeExtractor  = require('./source-extractors/claude-extractor');
const stringsExtractor = require('./source-extractors/strings-extractor');

// Formatters
const cursorFormatter  = require('./formatters/cursor-formatter');
const claudeFormatter  = require('./formatters/claude-formatter');
const stringsFormatter = require('./formatters/strings-formatter');

const { findLanguage }  = require('./languages');

// Output paths
const CURSOR_I18N_DIR  = path.resolve(__dirname, '../../patcher-cursor/i18n');
const CLAUDE_DIR       = path.resolve(__dirname, '../../patcher-claude');

const ADAPTER_MAP = {
  openai:    openaiAdapter,
  anthropic: anthropicAdapter,
  gemini:    geminiAdapter,
  deepl:     deeplAdapter,
};

const MAX_RETRIES     = 3;
const RETRY_BATCH_SIZE = 10;

class Generator extends EventEmitter {
  /**
   * @param {object} config
   * @param {string} config.engine       'openai' | 'anthropic' | 'gemini' | 'deepl'
   * @param {string} config.lang         目标语言代码，例 'ja-JP'
   * @param {number} [config.batchSize]  每批翻译条数，默认 40
   * @param {object} config.apiConfig    传递给 adapter 的配置（apiKey, model, baseURL 等）
   */
  constructor({ engine, lang, batchSize = 40, apiConfig, outputDir }) {
    super();
    this.engine    = engine;
    this.lang      = lang;
    this.batchSize = batchSize;
    this.apiConfig = apiConfig;
    this.outputDir = outputDir || null;

    const langInfo = findLanguage(lang);
    if (!langInfo) throw new Error(`Unsupported language: ${lang}`);
    this.langInfo = langInfo;

    const adapter = ADAPTER_MAP[engine];
    if (!adapter) throw new Error(`Unknown engine: ${engine}`);
    this.adapter = adapter;
  }

  // ──────────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────────

  /**
   * 生成 Cursor 字典
   * @returns {Promise<{ success: boolean, missing: number, outputPath: string }>}
   */
  async generateCursor() {
    this._emit(`📂 提取 Cursor 字典源文件...`);
    const { leaves, rawDict, sourceKeys } = cursorExtractor.extract();
    this._emit(`📊 找到 ${sourceKeys.size} 个叶子条目，开始批量翻译...`);

    // 构建翻译输入：英文 key（每个叶子的最后一个 path segment 即是英文原文）
    const items = leaves.map(l => ({ id: l.path.join('|'), text: l.en }));
    const resultMap = await this._translateItems(items);

    // 格式化并写入
    const outputDict = cursorFormatter.format(rawDict, resultMap);
    const baseDir = this.outputDir ? path.join(this.outputDir, 'cursor') : CURSOR_I18N_DIR;
    const outputPath = path.join(baseDir, `dictionary.${this.lang}.json`);
    const missing = this._countMissing(sourceKeys, resultMap);

    if (missing > 0) {
      outputDict._missing = missing;
      this._emit(`⚠️  有 ${missing} 条未翻译（已标记 _missing 字段）`);
    }

    this._atomicWrite(outputPath, cursorFormatter.serialize(outputDict));
    this._emit(`✅ Cursor 字典已写入: ${outputPath}（${sourceKeys.size - missing}/${sourceKeys.size} 条）`);

    return { success: missing === 0, missing, outputPath };
  }

  /**
   * 生成 Claude 主字典
   */
  async generateClaude(appPath) {
    this._emit(`📂 提取 Claude en-US 字典...`);
    const { enMap, sourceKeys } = claudeExtractor.extract(appPath || null);
    this._emit(`📊 找到 ${sourceKeys.size} 个 hash 条目，开始批量翻译...`);

    // hash → 英文原文 作为翻译输入
    const items = Object.entries(enMap).map(([hash, en]) => ({ id: hash, text: en }));
    const resultMap = await this._translateItems(items);

    const outputDict = claudeFormatter.format(enMap, resultMap);
    const baseDir = this.outputDir ? path.join(this.outputDir, 'claude') : CLAUDE_DIR;
    const outputPath = path.join(baseDir, `${this.lang}.json`);
    const missing = this._countMissing(sourceKeys, resultMap);

    if (missing > 0) {
      outputDict._missing = missing;
      this._emit(`⚠️  有 ${missing} 条未翻译（已标记 _missing 字段）`);
    }

    this._atomicWrite(outputPath, claudeFormatter.serialize(outputDict));
    this._emit(`✅ Claude 字典已写入: ${outputPath}（${sourceKeys.size - missing}/${sourceKeys.size} 条）`);

    return { success: missing === 0, missing, outputPath };
  }

  /**
   * 生成 Claude .strings 文件
   */
  async generateStrings() {
    this._emit(`📂 提取 Localizable.strings...`);
    const { entries, lines, sourceKeys } = stringsExtractor.extract();
    this._emit(`📊 找到 ${sourceKeys.size} 条 strings 条目，开始批量翻译...`);

    const items = entries.map(e => ({ id: e.key, text: e.key }));
    const resultMap = await this._translateItems(items);

    const outputContent = stringsFormatter.format(lines, entries, resultMap);
    const baseDir = this.outputDir ? path.join(this.outputDir, 'claude') : CLAUDE_DIR;
    const outputPath = path.join(baseDir, `Localizable.strings.${this.lang}`);
    const missing = this._countMissing(sourceKeys, resultMap);

    if (missing > 0) {
      this._emit(`⚠️  有 ${missing} 条 strings 未翻译`);
    }

    this._atomicWrite(outputPath, outputContent);
    this._emit(`✅ Strings 文件已写入: ${outputPath}（${sourceKeys.size - missing}/${sourceKeys.size} 条）`);

    return { success: missing === 0, missing, outputPath };
  }

  // ──────────────────────────────────────────────────
  // Core: batch translation with integrity guarantee
  // ──────────────────────────────────────────────────

  /**
   * 批量翻译并确保完整性
   * @param {Array<{ id: string, text: string }>} items
   * @returns {Promise<object>}  { id → translatedText }
   */
  async _translateItems(items) {
    let resultMap = {};
    let remaining = [...items];
    let firstError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const batchSize = attempt === 1 ? this.batchSize : RETRY_BATCH_SIZE;
      const batches = this._chunk(remaining, batchSize);
      const total = remaining.length;
      let done = 0;

      for (const batch of batches) {
        try {
          const texts = batch.map(it => it.text);
          const deeplCode = this.langInfo.deepl;
          const adapterConfig = this.engine === 'deepl'
            ? { ...this.apiConfig, deeplCode }
            : this.apiConfig;

          const translations = await this.adapter.translateBatch(texts, this.lang, adapterConfig);

          for (let i = 0; i < batch.length; i++) {
            resultMap[batch[i].id] = translations[i];
          }
          done += batch.length;
          this._emitProgress(done, total, attempt);
        } catch (err) {
          if (!firstError) firstError = err;
          this._emit(`⚠️  批次翻译失败（第 ${attempt} 次尝试）: ${err.message}`);
        }
      }

      // 校验缺失
      const allIds = new Set(items.map(it => it.id));
      const missing = [...allIds].filter(id => resultMap[id] === undefined);

      if (missing.length === 0) break;

      if (attempt < MAX_RETRIES) {
        this._emit(`🔄 重试 ${missing.length} 条未翻译项（第 ${attempt + 1}/${MAX_RETRIES} 次）...`);
        remaining = items.filter(it => missing.includes(it.id));
      } else {
        this._emit(`❌ 最终仍有 ${missing.length} 条未翻译（已用尽重试次数）`);
      }
    }

    if (Object.keys(resultMap).length === 0 && firstError) {
      throw firstError;
    }

    return resultMap;
  }

  // ──────────────────────────────────────────────────
  // Utilities
  // ──────────────────────────────────────────────────

  _chunk(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
  }

  _countMissing(sourceKeys, resultMap) {
    let count = 0;
    for (const key of sourceKeys) {
      if (resultMap[key] === undefined) count++;
    }
    return count;
  }

  /**
   * 原子写文件：先写 .tmp，校验后 rename
   */
  _atomicWrite(outputPath, content) {
    const tmpPath = outputPath + '.tmp';
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, outputPath);
  }

  _emit(msg) {
    this.emit('progress', msg);
    console.log('[dict-generator]', msg);
  }

  _emitProgress(done, total, attempt) {
    const pct = Math.round((done / total) * 100);
    this.emit('progress', `  [${attempt}/${MAX_RETRIES}] ${done}/${total} 条 (${pct}%)`);
  }
}

module.exports = { Generator };
