import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8');

describe('native Android companion regression contract', () => {
  const runClaim = (claim: string) => execFileSync('bash', ['scripts/test-android.sh', claim], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
    env: { ...process.env, ANDROID_HOME: process.env.ANDROID_HOME || '/opt/android-sdk', JAVA_HOME: process.env.JAVA_HOME || '/usr/lib/jvm/java-21-openjdk-amd64' },
  });

  it('@claim:android-private-capture builds the target-35 app and runs native reading outcomes', () => {
    expect(runClaim('android-private-capture')).toContain('BUILD SUCCESSFUL');
  });

  it('@claim:android-selection-memory saves and repeats the exact native reading', () => {
    expect(runClaim('android-selection-memory')).toContain('BUILD SUCCESSFUL');
  });

  it('@claim:protected-captures rejects blank recognition output', () => {
    expect(runClaim('protected-captures')).toContain('BUILD SUCCESSFUL');
  });

  it('@claim:android-device-privacy packages with backup and network access disabled', () => {
    expect(runClaim('android-device-privacy')).toContain('BUILD SUCCESSFUL');
  });
});

describe('static host protection regression contract', () => {
  it('ships deployable CSP, permission policy, framing protection, and immutable hashed asset caching', async () => {
    const headers = await read('../public/_headers');
    const swa = JSON.parse(await read('../public/staticwebapp.config.json')) as { globalHeaders: Record<string, string>; routes: Array<{ route: string; headers?: Record<string, string> }>; navigationFallback?: unknown; responseOverrides: { '404': { rewrite: string } } };
    expect(headers).toMatch(/Content-Security-Policy:/);
    expect(headers).toMatch(/wasm-unsafe-eval/);
    expect(headers).toMatch(/frame-ancestors 'none'/);
    expect(headers).toMatch(/Permissions-Policy:/);
    expect(headers).toMatch(/X-Frame-Options: DENY/);
    expect(headers).toMatch(/\/assets\/\*/);
    expect(headers).toMatch(/max-age=31536000, immutable/);
    expect(swa.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(swa.globalHeaders['Permissions-Policy']).toContain('camera=()');
    expect(swa.globalHeaders['X-Frame-Options']).toBe('DENY');
    expect(swa.routes.find((route) => route.route === '/assets/*')?.headers?.['Cache-Control']).toContain('immutable');
    expect(swa.navigationFallback).toBeUndefined();
    expect(swa.responseOverrides['404'].rewrite).toBe('/404.html');
  });
});
