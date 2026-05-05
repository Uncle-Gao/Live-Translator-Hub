import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron/simple'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: 'electron/main.js',
        vite: {
          build: {
            rollupOptions: {
              external: [
                'sudo-prompt',
                'electron',
                'original-fs',
                'electron-updater',
                '@live-translator/patcher-cursor',
                '@live-translator/patcher-claude',
                /^node:.*/
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
