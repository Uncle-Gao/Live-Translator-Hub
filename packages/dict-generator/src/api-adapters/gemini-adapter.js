/**
 * Google Gemini API 适配器
 * 使用 Gemini generateContent 接口批量翻译 UI 字符串
 */

'use strict';

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com';
const DEFAULT_MODEL = 'gemini-2.0-flash';

/**
 * 调用 Gemini API 批量翻译
 * @param {string[]} texts        源文本数组
 * @param {string}   targetLang   目标语言代码，例 'ja-JP'
 * @param {object}   config       { apiKey, baseURL?, model? }
 * @returns {Promise<string[]>}   译文数组
 */
async function translateBatch(texts, targetLang, config) {
  const { apiKey, baseURL = DEFAULT_BASE_URL, model = DEFAULT_MODEL } = config;

  const prompt = buildPrompt(texts, targetLang);
  const url = `${baseURL}/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const json = await res.json();
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Empty Gemini response');
  return parseResponse(raw, texts.length);
}

/**
 * 测试连接
 */
async function testConnection(config) {
  const result = await translateBatch(['Hello'], 'zh-CN', config);
  if (!result || result.length === 0) throw new Error('Empty response');
  return true;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function buildPrompt(texts, targetLang) {
  const list = texts.map((t, i) => `${i + 1}. ${JSON.stringify(t)}`).join('\n');
  return `You are a professional software UI translator. Translate these ${texts.length} UI strings to ${targetLang}.

CRITICAL RULES:
1. Return ONLY a valid JSON object: {"translations": ["t1", "t2", ...]}
2. The array length MUST exactly match the number of input strings (${texts.length}).
3. Preserve ALL placeholders: $1, $2, {name}, {{count}}, %s, %d, etc.
4. Keep technical terms, brand names, and code snippets unchanged.
5. Do NOT add explanations or comments.

Input strings:
${list}`;
}

function parseResponse(raw, expectedCount) {
  try {
    const cleaned = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    const arr = parsed.translations;
    if (!Array.isArray(arr)) throw new Error('Missing translations array');
    if (arr.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} translations, got ${arr.length}`);
    }
    return arr;
  } catch (e) {
    throw new Error(`Failed to parse Gemini response: ${e.message}\nRaw: ${String(raw).slice(0, 200)}`);
  }
}

module.exports = { translateBatch, testConnection };
