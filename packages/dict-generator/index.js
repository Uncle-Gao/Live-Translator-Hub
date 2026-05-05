/**
 * @live-translator/dict-generator
 * AI 驱动的字典自动生成引擎
 * 
 * 使用示例：
 *   const { DictGenerator, SUPPORTED_LANGUAGES } = require('@live-translator/dict-generator');
 *   const gen = new DictGenerator({ engine: 'openai', lang: 'ja-JP', batchSize: 40, apiConfig: { apiKey: '...' } });
 *   gen.on('progress', console.log);
 *   const result = await gen.generate('cursor');  // 或 'claude' / 'both'
 */

'use strict';

const { Generator } = require('./src/generator');
const { SUPPORTED_LANGUAGES, findLanguage } = require('./src/languages');

// API Adapters（直接暴露，方便 main.js 测试连接）
const openaiAdapter    = require('./src/api-adapters/openai-adapter');
const anthropicAdapter = require('./src/api-adapters/anthropic-adapter');
const geminiAdapter    = require('./src/api-adapters/gemini-adapter');
const deeplAdapter     = require('./src/api-adapters/deepl-adapter');

const ADAPTERS = { openai: openaiAdapter, anthropic: anthropicAdapter, gemini: geminiAdapter, deepl: deeplAdapter };

/**
 * DictGenerator — 顶层外观类
 * 简化调用，提供 generate(app) 统一入口
 */
class DictGenerator extends Generator {
  /**
   * 一键生成字典
   * @param {'cursor'|'claude'|'both'} app  目标应用
   * @returns {Promise<{ cursor?, claude?, strings? }>}
   */
  async generate(app, appPath) {
    const results = {};
    if (app === 'cursor' || app === 'both') {
      results.cursor = await this.generateCursor();
    }
    if (app === 'claude' || app === 'both') {
      results.claude  = await this.generateClaude(appPath);
      results.strings = await this.generateStrings();
    }
    return results;
  }

  /**
   * 静态方法：测试 API 连接
   * @param {{ engine: string, apiKey: string, model?: string, baseURL?: string }} opts
   * @returns {Promise<boolean>}
   */
  static async testConnection({ engine, apiKey, model, baseURL }) {
    const adapter = ADAPTERS[engine];
    if (!adapter) throw new Error(`Unknown engine: ${engine}`);
    return adapter.testConnection({ apiKey, model, baseURL });
  }
}

module.exports = { DictGenerator, SUPPORTED_LANGUAGES, findLanguage };
