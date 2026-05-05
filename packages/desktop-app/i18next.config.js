import { defineConfig } from 'i18next-cli';

export default defineConfig({
  locales: ['zh-CN', 'en-US'],
  extract: {
    input: ['src/**/*.{jsx,js}'],
    ignore: ['src/main.jsx'],
    output: 'src/locales/{{language}}.json',
    functions: ['t'],
    transComponents: ['Trans'],
    defaultNS: false,
    defaultValue: '__STRING_NOT_TRANSLATED__',
    disablePlurals: true,
    sort: true,
    removeUnusedKeys: false,
  },
});
