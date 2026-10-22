import { build } from 'esbuild'

const externalVuePlugin = {
  name: 'external-vue-sfc',
  setup(b) {
    b.onResolve({ filter: /\.vue$/ }, (args) => ({
      path: args.path,
      external: true,
    }))
  },
}

function formatFromArg() {
  const arg = process.argv.find((x) => x.startsWith('--format='))
  return arg ? arg.slice('--format='.length) : 'esm'
}

const format = formatFromArg()
const outfile = format === 'cjs' ? 'dist/index.cjs' : 'dist/index.js'

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'neutral',
  format,
  target: 'es2019',
  external: ['vue', 'ant-design-vue', 'vue-router'],
  plugins: [externalVuePlugin],
  outfile,
  logLevel: 'info',
})
