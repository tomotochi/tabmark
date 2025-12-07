import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: 'out/webview',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'webview/src/main.js'),
      formats: ['es'],
      fileName: () => 'assets/index.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
