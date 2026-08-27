import { copyFile, mkdir } from 'node:fs/promises';

await mkdir('public/vendor', { recursive: true });
const assets = [
  ['node_modules/tesseract.js/dist/worker.min.js', 'public/vendor/tesseract-worker.min.js'],
  ['node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'public/vendor/tesseract-core-simd-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm', 'public/vendor/tesseract-core-simd-lstm.wasm'],
  ['node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', 'public/vendor/eng.traineddata.gz'],
];

await Promise.all(assets.map(([from, to]) => copyFile(from, to)));
console.log('Synced local OCR worker, WebAssembly core, and English model.');
