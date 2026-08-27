import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

const index = await readFile('dist/index.html', 'utf8');
const buildAssets = [...index.matchAll(/(?:src|href)="(\/assets\/[^"?#]+\.(?:js|css))"/g)].map((match) => match[1]);
const serviceWorker = await readFile('dist/sw.js', 'utf8');
const injectedWorker = serviceWorker.replace(
  'const PRECACHE = [',
  `const PRECACHE = [\n${buildAssets.map((asset) => `  '${asset}',`).join('\n')}`,
);
await writeFile('dist/sw.js', injectedWorker);

for (const route of ['privacy', 'terms']) {
  await mkdir(`dist/${route}`, { recursive: true });
  await copyFile('dist/index.html', `dist/${route}/index.html`);
}
