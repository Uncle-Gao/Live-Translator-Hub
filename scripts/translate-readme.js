#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
if (!DEEPSEEK_KEY) {
  console.error('Set DEEPSEEK_API_KEY environment variable');
  process.exit(1);
}

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'docs/readme/zh-CN.md');
const OUT_DIR = path.join(ROOT, 'docs/readme');

const TITLE = '# Live Translator Hub';

const TAGLINES = {
  en: '> A GUI-powered real-time localization engine for Cursor and Claude desktop apps — with Webview plugin penetration and AI-powered async translation.',
  'ja-JP': '> Cursor と Claude デスクトップアプリ向け GUI リアルタイムローカライゼーションエンジン — Webview プラグインの透過と AI 非同期翻訳対応。',
  'ko-KR': '> Cursor 및 Claude 데스크톱 앱을 위한 GUI 실시간 로컬라이제이션 엔진 — Webview 플러그인 침투 및 AI 비동기 번역 지원.',
  'fr-FR': '> Un moteur de localisation en temps réel avec GUI pour les applications de bureau Cursor et Claude — avec pénétration des plugins Webview et traduction asynchrone par IA.',
  'de-DE': '> Eine GUI-gestützte Echtzeit-Lokalisierungs-Engine für Cursor- und Claude-Desktop-Apps — mit Webview-Plug-in-Durchdringung und KI-gestützter asynchroner Übersetzung.',
  'es-ES': '> Un motor de localización en tiempo real con GUI para las aplicaciones de escritorio Cursor y Claude — con penetración de plugins Webview y traducción asíncrona por IA.',
  'it-IT': '> Un motore di localizzazione in tempo reale con GUI per le app desktop Cursor e Claude — con penetrazione dei plugin Webview e traduzione asincrona AI.',
  'pt-BR': '> Um mecanismo de localização em tempo real com GUI para os aplicativos desktop Cursor e Claude — com penetração de plugins Webview e tradução assíncrona por IA.',
  'pt-PT': '> Um motor de localização em tempo real com GUI para as aplicações de desktop Cursor e Claude — com penetração de plugins Webview e tradução assíncrona por IA.',
  'nl-NL': '> Een GUI-aangedreven real-time lokalisatie-engine voor Cursor- en Claude-desktopapps — met Webview-plug-in-penetratie en AI-ondersteunde asynchrone vertaling.',
  'pl-PL': '> Silnik lokalizacji w czasie rzeczywistym z GUI dla aplikacji desktopowych Cursor i Claude — z penetracją wtyczek Webview i asynchronicznym tłumaczeniem AI.',
  'sv-SE': '> En GUI-driven lokaliseringsmotor i realtid för Cursor- och Claude-skrivbordsappar — med Webview-plugin-penetrering och AI-driven asynkron översättning.',
  'da-DK': '> En GUI-drevet lokaliseringsmotor i realtid til Cursor- og Claude-desktopapps — med Webview-plugin-penetrering og AI-drevet asynkron oversættelse.',
  'fi-FI': '> GUI-pohjainen reaaliaikainen lokalisointimoottori Cursor- ja Claude-työpöytäsovelluksille — Webview-liitännäisten läpäisy ja AI-pohjainen asynkroninen käännös.',
  'nb-NO': '> En GUI-drevet lokaliseringsmotor i sanntid for Cursor- og Claude-skrivebordsapper — med Webview-plugin-penetrering og AI-drevet asynkron oversettelse.',
  'cs-CZ': '> GUI lokalizační engine v reálném čase pro desktopové aplikace Cursor a Claude — s penetrací pluginů Webview a asynchronním překladem pomocí AI.',
  'sk-SK': '> GUI lokalizačný engine v reálnom čase pre desktopové aplikácie Cursor a Claude — s penetráciou pluginov Webview a asynchrónnym prekladom pomocou AI.',
  'ro-RO': '> Un motor de localizare în timp real cu GUI pentru aplicațiile desktop Cursor și Claude — cu penetrare a pluginurilor Webview și traducere asincronă AI.',
  'hu-HU': '> GUI-alapú valós idejű lokalizációs motor Cursor és Claude asztali alkalmazásokhoz — Webview bővítmények áthatolásával és AI-alapú aszinkron fordítással.',
  'el-GR': '> Μια μηχανή εντοπισμού σε πραγματικό χρόνο με GUI για τις εφαρμογές επιφάνειας εργασίας Cursor και Claude — με διείσδυση προσθηκών Webview και ασύγχρονη μετάφραση AI.',
  'bg-BG': '> GUI-базиран двигател за локализация в реално време за настолните приложения Cursor и Claude — с проникване на Webview плъгини и асинхронен превод с изкуствен интелект.',
  'uk-UA': '> GUI-движок локалізації в реальному часі для настільних додатків Cursor і Claude — з проникненням плагінів Webview та асинхронним перекладом за допомогою ШІ.',
  'ru-RU': '> GUI-движок локализации в реальном времени для настольных приложений Cursor и Claude — с проникновением плагинов Webview и асинхронным переводом с помощью ИИ.',
  'lt-LT': '> GUI pagrįstas realaus laiko lokalizacijos variklis Cursor ir Claude darbalaukio programoms — su Webview įskiepių skverbimu ir AI pagrįstu asinchroniniu vertimu.',
  'lv-LV': '> GUI balstīts reāllaika lokalizācijas dzinējs Cursor un Claude darbvirsmas lietotnēm — ar Webview spraudņu iespiešanos un AI balstītu asinhrono tulkošanu.',
  'et-EE': '> GUI-põhine reaalajas lokaliseerimismootor Cursori ja Claude\'i töölauarakendustele — Webview pluginatega läbistamise ja AI-põhise asünkroonse tõlkega.',
  'tr-TR': '> Cursor ve Claude masaüstü uygulamaları için GUI destekli gerçek zamanlı yerelleştirme motoru — Webview eklenti penetrasyonu ve AI destekli asenkron çeviri ile.',
  'vi-VN': '> Công cụ bản địa hóa thời gian thực có GUI cho ứng dụng desktop Cursor và Claude — với khả năng xuyên thấu plugin Webview và dịch thuật bất đồng bộ bằng AI.',
  'th-TH': '> เอ็นจิ้นการแปลภาษาแบบเรียลไทม์พร้อม GUI สำหรับแอปเดสก์ท็อป Cursor และ Claude — พร้อมการเจาะปลั๊กอิน Webview และการแปลแบบอะซิงโครนัสด้วย AI',
  'id-ID': '> Mesin lokalisasi waktu nyata berbasis GUI untuk aplikasi desktop Cursor dan Claude — dengan penetrasi plugin Webview dan terjemahan asinkron berbasis AI.',
  'ms-MY': '> Enjin penyetempatan masa nyata berasaskan GUI untuk aplikasi desktop Cursor dan Claude — dengan penembusan pemalam Webview dan terjemahan tak segerak berasaskan AI.',
  'hi-IN': '> Cursor और Claude डेस्कटॉप ऐप्स के लिए GUI-संचालित रीयल-टाइम स्थानीयकरण इंजन — Webview प्लगइन प्रवेश और AI-संचालित अतुल्यकालिक अनुवाद के साथ।',
};

const LANGS = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'ja-JP', name: 'Japanese', native: '日本語' },
  { code: 'ko-KR', name: 'Korean', native: '한국어' },
  { code: 'fr-FR', name: 'French', native: 'Français' },
  { code: 'de-DE', name: 'German', native: 'Deutsch' },
  { code: 'es-ES', name: 'Spanish', native: 'Español' },
  { code: 'it-IT', name: 'Italian', native: 'Italiano' },
  { code: 'pt-BR', name: 'Brazilian Portuguese', native: 'Português' },
  { code: 'pt-PT', name: 'European Portuguese', native: 'Português' },
  { code: 'nl-NL', name: 'Dutch', native: 'Nederlands' },
  { code: 'pl-PL', name: 'Polish', native: 'Polski' },
  { code: 'sv-SE', name: 'Swedish', native: 'Svenska' },
  { code: 'da-DK', name: 'Danish', native: 'Dansk' },
  { code: 'fi-FI', name: 'Finnish', native: 'Suomi' },
  { code: 'nb-NO', name: 'Norwegian', native: 'Norsk' },
  { code: 'cs-CZ', name: 'Czech', native: 'Čeština' },
  { code: 'sk-SK', name: 'Slovak', native: 'Slovenčina' },
  { code: 'ro-RO', name: 'Romanian', native: 'Română' },
  { code: 'hu-HU', name: 'Hungarian', native: 'Magyar' },
  { code: 'el-GR', name: 'Greek', native: 'Ελληνικά' },
  { code: 'bg-BG', name: 'Bulgarian', native: 'Български' },
  { code: 'uk-UA', name: 'Ukrainian', native: 'Українська' },
  { code: 'ru-RU', name: 'Russian', native: 'Русский' },
  { code: 'lt-LT', name: 'Lithuanian', native: 'Lietuvių' },
  { code: 'lv-LV', name: 'Latvian', native: 'Latviešu' },
  { code: 'et-EE', name: 'Estonian', native: 'Eesti' },
  { code: 'tr-TR', name: 'Turkish', native: 'Türkçe' },
  { code: 'vi-VN', name: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'th-TH', name: 'Thai', native: 'ไทย' },
  { code: 'id-ID', name: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'ms-MY', name: 'Malay', native: 'Bahasa Melayu' },
  { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी' },
];

function buildSelector(currentLang) {
  const parts = [];
  for (const l of LANGS) {
    let file;
    if (currentLang === 'en') {
      if (l.code === 'en') continue; // skip self-link on English page
      file = 'docs/readme/' + l.code + '.md';
    } else {
      if (l.code === currentLang) continue; // skip self-link
      if (l.code === 'en') file = '../../README.md';
      else file = l.code + '.md';
    }
    parts.push('[' + l.native + '](' + file + ')');
  }
  return parts.join(' | ');
}

function buildOutputFile(langCode, tagline, body) {
  const selector = buildSelector(langCode === 'en' ? 'en' : langCode);
  return TITLE + '\n\n' + tagline + '\n\n' + selector + '\n\n' + body.trimEnd() + '\n';
}

function extractBody(sourceText) {
  // Skip: title, blank line, tagline, blank line, selector line, blank line
  const lines = sourceText.split('\n');
  let i = 0;
  // Skip title
  while (i < lines.length && lines[i].trim() === '') i++;
  if (lines[i] && lines[i].startsWith('# ')) i++;
  // Skip blank after title
  while (i < lines.length && lines[i].trim() === '') i++;
  // Skip tagline
  if (lines[i] && lines[i].startsWith('> ')) i++;
  // Skip blank after tagline
  while (i < lines.length && lines[i].trim() === '') i++;
  // Skip selector line (starts with [English] or equivalent)
  if (lines[i] && lines[i].includes('](')) i++;
  // Skip blank after selector
  while (i < lines.length && lines[i].trim() === '') i++;
  return lines.slice(i).join('\n');
}

async function translate(lang, body) {
  const langName = LANGS.find(l => l.code === lang).name;
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + DEEPSEEK_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional technical translator. Translate the following markdown document from Simplified Chinese to ' +
            langName +
            '. CRITICAL RULES:\n' +
            '1. Preserve ALL markdown formatting EXACTLY: headers, bullets, tables, code blocks, inline code, links, images, horizontal rules.\n' +
            '2. Do NOT translate: code, URLs, file paths, command names, product names (Cursor, Claude, Electron, React, Tailwind, Zustand, OpenAI, Anthropic, Google Gemini, DeepL), version numbers, API key names.\n' +
            '3. Keep all HTML-like tags and technical identifiers unchanged.\n' +
            '4. Output ONLY the translated markdown. No explanations, no preamble, no postscript.',
        },
        { role: 'user', content: body },
      ],
      temperature: 0.1,
      max_tokens: 8192,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error('DeepSeek API error ' + res.status + ': ' + text.slice(0, 200));
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function translateOne(lang) {
  // Read source each time to ensure freshness
  const sourceText = fs.readFileSync(SOURCE, 'utf-8');
  const body = extractBody(sourceText);

  let tagline;
  if (lang === 'en') {
    // Translate tagline via API too
    const taglineRes = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + DEEPSEEK_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Translate the following Chinese tagline to English. Output ONLY the translated tagline, preserving the "> " prefix and markdown blockquote format. Keep product names (Cursor, Claude, Webview, AI) unchanged.' },
          { role: 'user', content: '> 覆盖 Cursor 与 Claude 桌面应用的 GUI 全场景实时汉化引擎，支持 Webview 插件穿透与 AI 异步翻译。' },
        ],
        temperature: 0.1,
        max_tokens: 256,
      }),
    });
    if (taglineRes.ok) {
      const d = await taglineRes.json();
      tagline = d.choices[0].message.content.trim();
    } else {
      tagline = TAGLINES[lang];
    }
  } else if (TAGLINES[lang]) {
    tagline = TAGLINES[lang];
  } else {
    tagline = TAGLINES.en;
  }

  const translatedBody = body ? await translate(lang, body) : body;

  const outputPath = lang === 'en'
    ? path.join(ROOT, 'README.md')
    : path.join(OUT_DIR, lang + '.md');
  fs.writeFileSync(outputPath, buildOutputFile(lang, tagline, translatedBody), 'utf-8');
  console.log('  ✓ ' + lang + ' → ' + path.relative(ROOT, outputPath));
}

async function translateAll() {
  const sourceText = fs.readFileSync(SOURCE, 'utf-8');
  if (!sourceText.trim()) {
    console.error('Source file is empty: ' + SOURCE);
    process.exit(1);
  }
  console.log('Source: docs/readme/zh-CN.md (' + sourceText.split('\n').length + ' lines)');
  console.log('Translating to ' + LANGS.length + ' languages...\n');

  const CONCURRENCY = 3;
  for (let i = 0; i < LANGS.length; i += CONCURRENCY) {
    const batch = LANGS.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(l => translateOne(l.code)));
  }

  console.log('\nDone. ' + LANGS.length + ' languages translated.');
}

translateAll().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
