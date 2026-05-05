/**
 * Anthropic Claude 适配器
 * 使用 Anthropic Messages API 批量翻译 UI 字符串
 */

'use strict';

const DEFAULT_BASE_URL = 'https://api.anthropic.com';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 4096;

/**
 * 调用 Anthropic API 批量翻译
 * @param {string[]} texts        源文本数组
 * @param {string}   targetLang   目标语言代码，例 'ja-JP'
 * @param {object}   config       { apiKey, baseURL?, model? }
 * @returns {Promise<string[]>}   译文数组
 */
async function translateBatch(texts, targetLang, config) {
  const { apiKey, baseURL = DEFAULT_BASE_URL, model = DEFAULT_MODEL } = config;

  const systemPrompt = buildSystemPrompt(targetLang);
  const userContent = buildUserContent(texts);

  const res = await fetch(`${baseURL}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const json = await res.json();
  const raw = json.content?.[0]?.text;
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

function buildSystemPrompt(targetLang) {
  return `You are a professional software UI translator. Translate the given UI strings to ${targetLang}.

CRITICAL RULES:
1. Return ONLY a valid JSON object: {"translations": ["t1", "t2", ...]}
2. The array length MUST exactly match the number of input strings.
3. Preserve ALL placeholders: $1, $2, {name}, {{count}}, %s, %d, etc.
4. Keep technical terms, brand names, and code snippets unchanged.
5. Preserve leading/trailing whitespace and newlines.
6. Do NOT add explanations or comments outside the JSON.`;
}

function buildUserContent(texts) {
  const list = texts.map((t, i) => `${i + 1}. ${JSON.stringify(t)}`).join('\n');
  return `Translate these ${texts.length} UI strings:\n${list}\n\nReturn JSON only.`;
}

function parseResponse(raw, expectedCount) {
  try {
    // Claude may wrap JSON in markdown code blocks
    const cleaned = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    const arr = parsed.translations;
    if (!Array.isArray(arr)) throw new Error('Missing translations array');
    if (arr.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} translations, got ${arr.length}`);
    }
    return arr;
  } catch (e) {
    throw new Error(`Failed to parse Anthropic response: ${e.message}\nRaw: ${String(raw).slice(0, 200)}`);
  }
}

module.exports = { translateBatch, testConnection };
