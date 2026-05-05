import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron/simple'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Strip crossorigin attribute for Electron file:// protocol compatibility
    {
      name: 'strip-crossorigin',
      transformIndexHtml(html) {
        return html.replace(/\s+crossorigin/g, '');
      },
    },
    electron({
      main: {
        entry: 'electron/main.js',
        vite: {
          build: {
            rolldownOptions: {
              external: [
                'sudo-prompt',
                'original-fs',
                'electron-updater',
                '@live-translator/patcher-claude',
                '@live-translator/patcher-cursor',
                '@live-translator/dict-generator',
              ]
            }
          }
        }
      },
      preload: {
        input: 'electron/preload.js',
      },
    }),
  ],
})
