/**
 * OpenAI / 兼容接口适配器
 * 支持 gpt-4o, gpt-4o-mini, DeepSeek, Groq, Azure OpenAI, Ollama 等所有 OpenAI 兼容服务
 */

'use strict';

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * 调用 OpenAI 兼容接口批量翻译
 * @param {string[]} texts          源文本数组
 * @param {string}   targetLang     目标语言代码，例 'ja-JP'
 * @param {object}   config         { apiKey, baseURL?, model? }
 * @returns {Promise<string[]>}     译文数组，顺序与 texts 完全对应
 */
async function translateBatch(texts, targetLang, config) {
  const { apiKey, baseURL = DEFAULT_BASE_URL, model = DEFAULT_MODEL } = config;

  const systemPrompt = buildSystemPrompt(targetLang);
  const userContent = buildUserContent(texts);

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content;
  return parseResponse(raw, texts.length);
}

/**
 * 测试连接（发送单条文本）
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
6. Do NOT add explanations or comments.`;
}

function buildUserContent(texts) {
  const list = texts.map((t, i) => `${i + 1}. ${JSON.stringify(t)}`).join('\n');
  return `Translate these ${texts.length} UI strings:\n${list}`;
}

function parseResponse(raw, expectedCount) {
  try {
    const parsed = JSON.parse(raw);
    const arr = parsed.translations;
    if (!Array.isArray(arr)) throw new Error('Missing translations array');
    if (arr.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} translations, got ${arr.length}`);
    }
    return arr;
  } catch (e) {
    throw new Error(`Failed to parse OpenAI response: ${e.message}\nRaw: ${String(raw).slice(0, 200)}`);
  }
}

module.exports = { translateBatch, testConnection };
