import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };

const releaseDirectory = `v${version}`;

export default defineConfig({
  build: {
    target: 'es2020',
    outDir: 'dist',
    // Published releases stay side by side so fixed Webflow URLs remain immutable.
    emptyOutDir: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(import.meta.dirname, 'src/index.ts'),
      output: {
        format: 'iife',
        entryFileNames: `${releaseDirectory}/frame11.js`,
        assetFileNames: (assetInfo) =>
          assetInfo.names.some((name) => name.endsWith('.css'))
            ? `${releaseDirectory}/frame11.css`
            : `${releaseDirectory}/assets/[name]-[hash][extname]`,
      },
    },
  },
});
