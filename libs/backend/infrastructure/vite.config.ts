/// <reference types='vitest' />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/backend/infrastructure',
  plugins: [
    tsconfigPaths(),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(__dirname, 'tsconfig.lib.json'),
    }),
  ],
  build: {
    outDir: '../../../dist/libs/backend/infrastructure',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: 'src/index.ts',
      name: 'backend-infrastructure',
      fileName: 'index',
      formats: ['es' as const],
    },
    rollupOptions: {
      external: [],
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: 'node',
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/*.test.ts',
    ],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/backend/infrastructure',
      provider: 'v8' as const,
    },
    // Ajoute cette section pour les polyfills Node.js
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@shared/di-container': resolve(
        __dirname,
        '../../shared/di-container/src/index.ts'
      ),
      '@shared/utils': resolve(__dirname, '../../shared/utils/src/index.ts'),
      '@backend/models': resolve(__dirname, '../models/src/index.ts'),
      '@backend/ports': resolve(__dirname, '../ports/src/index.ts'),
    },
  },
}));
