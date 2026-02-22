import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const vclIndex = fileURLToPath(new URL('../../src/vcl/index.ts', import.meta.url))
const vclDir = fileURLToPath(new URL('../../src/vcl/', import.meta.url))
const drtIndex = fileURLToPath(new URL('../../src/drt/index.ts', import.meta.url))
const drtDir = fileURLToPath(new URL('../../src/drt/', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: /^@vcl$/,
        replacement: fileURLToPath(new URL('../../src/vcl/index.ts', import.meta.url)),
      },
      { find: /^@vcl\//, replacement: fileURLToPath(new URL('../../src/vcl/', import.meta.url)) },
      {
        find: /^@drt$/,
        replacement: fileURLToPath(new URL('../../src/drt/index.ts', import.meta.url)),
      },
      { find: /^@drt\//, replacement: fileURLToPath(new URL('../../src/drt/', import.meta.url)) },
    ],
  },

  // ✅ IMPORTANT pour éviter "process is not defined" dans la webview
  define: {
    'process.env': '{}',
    'process.env.NODE_ENV': '"production"',

    // ✅ flags Vue (recommandé)
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false',
  },

  // IMPORTANT si vous lancez `npm run dev` (Vite dev server) :
  server: {
    fs: {
      allow: [
        // autorise à importer ../../src/*
        fileURLToPath(new URL('../../', import.meta.url)),
      ],
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: 'inline',
    minify: false,
    lib: { entry: 'src/zazaVue.ts', formats: ['es'], fileName: () => 'zazaVue.compiled.js' },
    rollupOptions: { output: { inlineDynamicImports: true } },
    cssCodeSplit: false,
  },
})
