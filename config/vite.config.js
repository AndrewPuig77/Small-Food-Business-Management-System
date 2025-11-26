import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

export default defineConfig({
  css: {
    postcss: './config/postcss.config.js',
  },
  plugins: [
    vue(),
    electron([
      {
        entry: resolve(rootDir, 'src/main/main.js'),
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': resolve(rootDir, 'src/frontend'),
    },
  },
  root: resolve(rootDir, 'src/frontend'),
  build: {
    outDir: resolve(rootDir, 'dist-electron'),
    emptyOutDir: true,
  },
});
