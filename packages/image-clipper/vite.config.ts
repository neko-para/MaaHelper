import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    viteSingleFile(),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag.startsWith('vscode-')
        }
      }
    }),
    vueJsx()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: '../../maa-helper/assets/image-clipper'
  }
})
