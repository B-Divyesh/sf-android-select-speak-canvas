import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

const index = await readFile('dist/index.html', 'utf8');
const buildAssets = [...index.matchAll(/(?:src|href)="(\/assets\/[^"?#]+\.(?:js|css))"/g)].map((match) => match[1]);
const serviceWorker = await readFile('dist/sw.js', 'utf8');
const buildVersion = `tapread-${buildAssets.join('-').replace(/[^a-z0-9]/gi, '').slice(-24)}`;
const injectedWorker = serviceWorker.replace("const VERSION = 'tapread-v1';", `const VERSION = '${buildVersion}';`).replace(
  'const PRECACHE = [',
  `const PRECACHE = [\n${buildAssets.map((asset) => `  '${asset}',`).join('\n')}`,
);
await writeFile('dist/sw.js', injectedWorker);

for (const route of ['demo', 'privacy', 'terms']) {
  await mkdir(`dist/${route}`, { recursive: true });
  await copyFile('dist/index.html', `dist/${route}/index.html`);
}
await copyFile('dist/index.html', 'dist/404.html');
