/**
 * Locale → English display name for AI translation prompts.
 * Shared by patcher-cursor & patcher-claude at injection time.
 */
'use strict';

const LANG_NAMES = {
    'zh-CN': 'Simplified Chinese', 'zh-TW': 'Traditional Chinese',
    'ja-JP': 'Japanese', 'ko-KR': 'Korean',
    'fr-FR': 'French', 'de-DE': 'German',
    'es-ES': 'Spanish', 'it-IT': 'Italian',
    'pt-BR': 'Brazilian Portuguese', 'pt-PT': 'European Portuguese',
    'nl-NL': 'Dutch', 'pl-PL': 'Polish',
    'sv-SE': 'Swedish', 'da-DK': 'Danish',
    'fi-FI': 'Finnish', 'nb-NO': 'Norwegian',
    'cs-CZ': 'Czech', 'sk-SK': 'Slovak',
    'ro-RO': 'Romanian', 'hu-HU': 'Hungarian',
    'el-GR': 'Greek', 'bg-BG': 'Bulgarian',
    'uk-UA': 'Ukrainian', 'ru-RU': 'Russian',
    'lt-LT': 'Lithuanian', 'lv-LV': 'Latvian',
    'et-EE': 'Estonian', 'tr-TR': 'Turkish',
    'vi-VN': 'Vietnamese', 'th-TH': 'Thai',
    'id-ID': 'Indonesian', 'ms-MY': 'Malay',
    'hi-IN': 'Hindi'
};

function languageName(locale) {
    return LANG_NAMES[locale] || locale;
}

function languageCode(locale) {
    return (locale || 'ZH').split('-')[0].toUpperCase();
}

module.exports = { LANG_NAMES, languageName, languageCode };
