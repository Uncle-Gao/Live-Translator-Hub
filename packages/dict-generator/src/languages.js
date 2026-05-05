/**
 * @live-translator/dict-generator — 支持的目标语言列表
 * 仅包含横排书写系统（LTR），明确排除 RTL 语言（ar, he, fa, ur）
 */

const SUPPORTED_LANGUAGES = [
  // 东亚
  { code: 'zh-CN', name: '简体中文',          deepl: 'ZH'    },
  { code: 'zh-TW', name: '繁體中文',          deepl: 'ZH'    },
  { code: 'ja-JP', name: '日本語',             deepl: 'JA'    },
  { code: 'ko-KR', name: '한국어',             deepl: 'KO'    },
  // 西欧
  { code: 'fr-FR', name: 'Français',          deepl: 'FR'    },
  { code: 'de-DE', name: 'Deutsch',           deepl: 'DE'    },
  { code: 'es-ES', name: 'Español',           deepl: 'ES'    },
  { code: 'it-IT', name: 'Italiano',          deepl: 'IT'    },
  { code: 'pt-BR', name: 'Português (BR)',    deepl: 'PT-BR' },
  { code: 'pt-PT', name: 'Português (PT)',    deepl: 'PT-PT' },
  { code: 'nl-NL', name: 'Nederlands',        deepl: 'NL'    },
  { code: 'pl-PL', name: 'Polski',            deepl: 'PL'    },
  { code: 'sv-SE', name: 'Svenska',           deepl: 'SV'    },
  { code: 'da-DK', name: 'Dansk',             deepl: 'DA'    },
  { code: 'fi-FI', name: 'Suomi',             deepl: 'FI'    },
  { code: 'nb-NO', name: 'Norsk',             deepl: 'NB'    },
  // 东欧
  { code: 'cs-CZ', name: 'Čeština',           deepl: 'CS'    },
  { code: 'sk-SK', name: 'Slovenčina',        deepl: 'SK'    },
  { code: 'ro-RO', name: 'Română',            deepl: 'RO'    },
  { code: 'hu-HU', name: 'Magyar',            deepl: 'HU'    },
  { code: 'el-GR', name: 'Ελληνικά',         deepl: 'EL'    },
  { code: 'bg-BG', name: 'Български',        deepl: 'BG'    },
  { code: 'uk-UA', name: 'Українська',       deepl: 'UK'    },
  { code: 'ru-RU', name: 'Русский',          deepl: 'RU'    },
  { code: 'lt-LT', name: 'Lietuvių',         deepl: 'LT'    },
  { code: 'lv-LV', name: 'Latviešu',         deepl: 'LV'    },
  { code: 'et-EE', name: 'Eesti',            deepl: 'ET'    },
  // 其他横排语言
  { code: 'tr-TR', name: 'Türkçe',           deepl: 'TR'    },
  { code: 'vi-VN', name: 'Tiếng Việt',       deepl: null    },
  { code: 'th-TH', name: 'ภาษาไทย',         deepl: null    },
  { code: 'id-ID', name: 'Bahasa Indonesia', deepl: 'ID'    },
  { code: 'ms-MY', name: 'Bahasa Melayu',    deepl: null    },
  { code: 'hi-IN', name: 'हिन्दी',            deepl: null    },
  // 明确排除 RTL：ar, he, fa, ur
];

/**
 * 按 code 查找语言条目
 * @param {string} code  例: 'ja-JP'
 * @returns {{ code, name, deepl } | undefined}
 */
function findLanguage(code) {
  return SUPPORTED_LANGUAGES.find(l => l.code === code);
}

module.exports = { SUPPORTED_LANGUAGES, findLanguage };
