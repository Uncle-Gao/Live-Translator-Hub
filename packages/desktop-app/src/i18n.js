import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const localeModules = import.meta.glob('./locales/*.json', { eager: true });

const resources = {};

for (const [path, mod] of Object.entries(localeModules)) {
  const code = path.match(/\/([^/]+)\.json$/)[1];
  resources[code] = { translation: mod.default || mod };
}

const fallbackNS = resources['en-US'] || Object.values(resources)[0];

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh-CN',
    fallbackLng: 'en-US',
    interpolation: { escapeValue: false },
    // For languages without a locale file, fall back to en-US
    returnNull: false,
    returnEmptyString: false,
  });

export { fallbackNS };
export default i18n;
