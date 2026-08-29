import { execFileSync } from 'node:child_process';
import { defineConfig } from 'vite';

const buildId = process.env.BUILD_ID || execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], { encoding: 'utf8' }).trim();

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0'),
    __BUILD_ID__: JSON.stringify(buildId),
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          ocr: ['tesseract.js'],
        },
      },
    },
  },
});
