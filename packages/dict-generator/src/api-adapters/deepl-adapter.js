/**
 * DeepL API 适配器
 * DeepL 是专用翻译 API，无需选模型，直接按文本数组翻译
 */

'use strict';

const DEEPL_FREE_URL = 'https://api-free.deepl.com/v2/translate';
const DEEPL_PRO_URL = 'https://api.deepl.com/v2/translate';

/**
 * 调用 DeepL API 批量翻译
 * @param {string[]} texts         源文本数组
 * @param {string}   targetLang    目标语言代码，例 'ja-JP'（自动映射至 DeepL code）
 * @param {object}   config        { apiKey, baseURL?, deeplCode? }
 *   deeplCode: 由 generator.js 从 languages.js 查找，传入如 'JA'
 * @returns {Promise<string[]>}    译文数组
 */
async function translateBatch(texts, targetLang, config) {
  const { apiKey, baseURL, deeplCode } = config;

  if (!deeplCode) {
    throw new Error(`DeepL does not support language: ${targetLang}. Use an AI engine instead.`);
  }

  // baseURL: 用户自定义 > key 后缀自动检测 > 默认 Free
  const url = baseURL || (apiKey.endsWith(':fx') ? DEEPL_FREE_URL : DEEPL_PRO_URL);

  const body = new URLSearchParams();
  body.append('auth_key', apiKey);
  body.append('target_lang', deeplCode);
  body.append('preserve_formatting', '1');
  for (const t of texts) body.append('text', t);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepL API error ${res.status}: ${err}`);
  }

  const json = await res.json();
  const translations = json.translations;
  if (!Array.isArray(translations) || translations.length !== texts.length) {
    throw new Error(`DeepL returned ${translations?.length} items, expected ${texts.length}`);
  }

  return translations.map(t => t.text);
}

/**
 * 测试连接（翻译单条文本到中文）
 */
async function testConnection(config) {
  const result = await translateBatch(['Hello'], 'zh-CN', { ...config, deeplCode: 'ZH' });
  if (!result || result.length === 0) throw new Error('Empty response');
  return true;
}

module.exports = { translateBatch, testConnection };
