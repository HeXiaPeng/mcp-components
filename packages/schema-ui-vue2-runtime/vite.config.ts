import { defineConfig } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [createVuePlugin()],
  build: {
    // 目标项目为 webpack 4，产物需避免 es2020 语法（?. / ??），否则老 acorn 解析失败
    target: 'es2019',
    cssCodeSplit: false,
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'SchemaUiVue2Runtime',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      // 由宿主项目提供，避免打包出重复的 Vue 实例导致响应式失效
      external: ['vue', 'ant-design-vue', 'vue-router'],
      output: {
        assetFileNames: 'style.css',
      },
    },
  },
})
