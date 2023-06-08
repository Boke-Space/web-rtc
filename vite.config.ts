import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        {
          pinia: ['storeToRefs', 'defineStore'],
        },
      ],
      dirs: ['src/api/**', 'src/service/**', 'src/hooks/**', 'src/store/**'],
      eslintrc: {
        enabled: false,
        filepath: './.eslintrc-auto-import.json',
        globalsPropValue: true,
      },
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      dirs: ['src/components', 'src/base'],
      extensions: ['vue'],
      resolvers: [ElementPlusResolver()],
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/style/variables.scss";`
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: "0.0.0.0",
    proxy: {
      '/srs/': {
        target: 'http://192.168.192.131:1985',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/srs\//, ''),
      },
    },
  },
})
