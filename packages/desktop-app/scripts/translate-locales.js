/**
 * Batch UI locale translator.
 *
 * Supports both Anthropic Messages API and OpenAI-compatible APIs (DeepSeek, OpenAI, etc.)
 *
 * Usage:
 *   # DeepSeek (auto-detected from base URL)
 *   node scripts/translate-locales.js --api-key sk-xxx --base-url https://api.deepseek.com --model deepseek-chat
 *
 *   # Anthropic
 *   node scripts/translate-locales.js --api-key sk-xxx --model claude-sonnet-4-6
 *
 *   # Only specific languages:
 *   node scripts/translate-locales.js --api-key sk-xxx --base-url https://api.deepseek.com --model deepseek-chat --lang ja-JP,ko-KR
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const MAX_CONCURRENCY = 5;

const LANG_NAMES = {
  'zh-TW': 'Traditional Chinese (繁體中文)',
  'ja-JP': 'Japanese (日本語)',
  'ko-KR': 'Korean (한국어)',
  'fr-FR': 'French (Français)',
  'de-DE': 'German (Deutsch)',
  'es-ES': 'Spanish (Español)',
  'it-IT': 'Italian (Italiano)',
  'pt-BR': 'Brazilian Portuguese (Português Brasileiro)',
  'pt-PT': 'European Portuguese (Português Europeu)',
  'nl-NL': 'Dutch (Nederlands)',
  'pl-PL': 'Polish (Polski)',
  'sv-SE': 'Swedish (Svenska)',
  'da-DK': 'Danish (Dansk)',
  'fi-FI': 'Finnish (Suomi)',
  'nb-NO': 'Norwegian Bokmål (Norsk)',
  'cs-CZ': 'Czech (Čeština)',
  'sk-SK': 'Slovak (Slovenčina)',
  'ro-RO': 'Romanian (Română)',
  'hu-HU': 'Hungarian (Magyar)',
  'el-GR': 'Greek (Ελληνικά)',
  'bg-BG': 'Bulgarian (Български)',
  'uk-UA': 'Ukrainian (Українська)',
  'ru-RU': 'Russian (Русский)',
  'lt-LT': 'Lithuanian (Lietuvių)',
  'lv-LV': 'Latvian (Latviešu)',
  'et-EE': 'Estonian (Eesti)',
  'tr-TR': 'Turkish (Türkçe)',
  'vi-VN': 'Vietnamese (Tiếng Việt)',
  'th-TH': 'Thai (ภาษาไทย)',
  'id-ID': 'Indonesian (Bahasa Indonesia)',
  'ms-MY': 'Malay (Bahasa Melayu)',
  'hi-IN': 'Hindi (हिन्दी)',
};

function parseArgs() {
  const args = { langs: [], apiKey: '', baseUrl: '', model: '', apiType: '' };
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--lang' && process.argv[i + 1]) {
      args.langs = process.argv[++i].split(',').map(s => s.trim());
    } else if (arg === '--api-key' && process.argv[i + 1]) {
      args.apiKey = process.argv[++i];
    } else if (arg === '--base-url' && process.argv[i + 1]) {
      args.baseUrl = process.argv[++i];
    } else if (arg === '--model' && process.argv[i + 1]) {
      args.model = process.argv[++i];
    } else if (arg === '--api-type' && process.argv[i + 1]) {
      args.apiType = process.argv[++i];
    }
  }
  args.apiKey = args.apiKey || process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY || '';
  return args;
}

function detectApiType(baseUrl) {
  if (baseUrl.includes('anthropic')) return 'anthropic';
  return 'openai'; // DeepSeek, OpenAI, and compatible APIs
}

function buildSystemPrompt(targetLang) {
  const langName = LANG_NAMES[targetLang] || targetLang;
  return `You are a professional UI translator. Translate the JSON values into ${langName}.
Rules:
1. Preserve ALL {{variable}} placeholders exactly as-is
2. Preserve HTML/XML tags like <emStrong>, <highlight>, <br/> exactly as-is
3. Translate only the human-readable text, not variables or tags
4. Keep the same tone and style as the English source
5. Return a JSON object with the EXACT same keys, only translate the values
6. Output ONLY valid JSON, no markdown, no explanation`;
}

async function callAnthropicAPI(texts, config) {
  const userContent = JSON.stringify(texts, null, 2);
  const res = await fetch(`${config.baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 8192,
      system: config.systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.content[0].text;
}

async function callOpenAIAPI(texts, config) {
  const userContent = JSON.stringify(texts, null, 2);
  const res = await fetch(`${config.baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 8192,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: userContent },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function translateBatch(texts, targetLang, config) {
  config.systemPrompt = buildSystemPrompt(targetLang);
  const reply = config.apiType === 'anthropic'
    ? await callAnthropicAPI(texts, config)
    : await callOpenAIAPI(texts, config);

  const jsonMatch = reply.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON found in response: ${reply.slice(0, 200)}`);
  }
  return JSON.parse(jsonMatch[0]);
}

async function translateOneLanguage(langCode, source, config) {
  const filePath = path.join(LOCALES_DIR, `${langCode}.json`);
  const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const toTranslate = {};
  for (const [key, value] of Object.entries(source)) {
    if (existing[key] === source[key] || !existing[key] || existing[key] === '__STRING_NOT_TRANSLATED__') {
      toTranslate[key] = value;
    }
  }

  if (Object.keys(toTranslate).length === 0) {
    console.log(`  ${langCode}: already translated, skipping`);
    return;
  }

  console.log(`  ${langCode}: translating ${Object.keys(toTranslate).length} keys...`);

  const translated = await translateBatch(toTranslate, langCode, config);

  const merged = { ...existing };
  let count = 0;
  for (const [key, value] of Object.entries(translated)) {
    if (value && value !== source[key] && key in existing) {
      merged[key] = value;
      count++;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n');
  console.log(`  ${langCode}: saved (${count} new translations)`);
}

async function main() {
  const args = parseArgs();

  if (!args.apiKey) {
    console.error('Error: API key required.');
    console.error('  Set DEEPSEEK_API_KEY or ANTHROPIC_API_KEY env var, or use --api-key');
    process.exit(1);
  }

  if (!args.baseUrl) {
    args.baseUrl = 'https://api.deepseek.com';
  }
  if (!args.model) {
    args.model = 'deepseek-chat';
  }
  if (!args.apiType) {
    args.apiType = detectApiType(args.baseUrl);
  }

  const source = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en-US.json'), 'utf8'));
  console.log(`Source: en-US.json (${Object.keys(source).length} keys)`);

  let langs = args.langs;
  if (langs.length === 0) {
    langs = fs.readdirSync(LOCALES_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
      .filter(code => code !== 'en-US' && code !== 'zh-CN');
  }

  console.log(`Targets: ${langs.length} languages`);
  console.log(`API: ${args.apiType} | ${args.baseUrl} | ${args.model}`);
  console.log('');

  const config = { apiKey: args.apiKey, baseUrl: args.baseUrl, model: args.model, apiType: args.apiType };

  for (let i = 0; i < langs.length; i += MAX_CONCURRENCY) {
    const batch = langs.slice(i, i + MAX_CONCURRENCY);
    console.log(`Batch ${Math.floor(i / MAX_CONCURRENCY) + 1}/${Math.ceil(langs.length / MAX_CONCURRENCY)}`);
    await Promise.all(batch.map(lang => translateOneLanguage(lang, source, config)));
    console.log('');
  }

  console.log('Done!');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
