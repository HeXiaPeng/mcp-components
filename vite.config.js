import { defineConfig } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'

const runtimeSrcDir = fileURLToPath(
  new URL('./packages/schema-ui-vue2-runtime/src', import.meta.url),
)

export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  plugins: [
    createVuePlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'schema-ui-vue2-runtime': path.join(runtimeSrcDir, 'index.js'),
    },
  },
  optimizeDeps: {
    exclude: [
      'schema-ui-vue2-runtime',
    ],
  },
  server: {
    watch: {
      followSymlinks: true,
    },
    fs: {
      allow: [
        fileURLToPath(new URL('./', import.meta.url)),
        runtimeSrcDir,
      ],
    },
  },
})
