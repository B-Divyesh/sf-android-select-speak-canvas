import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8');

describe('native Android companion regression contract', () => {
  it('@claim:android-private-capture uses a visible service, consent, on-device recognition, and device speech', async () => {
    const manifest = await read('../android/app/src/main/AndroidManifest.xml');
    const metadata = await read('../android/app/src/main/res/xml/tapread_accessibility_service.xml');
    const service = await read('../android/app/src/main/java/in/sociobot/tapreadcanvas/TapReadAccessibilityService.java');
    const consent = await read('../android/app/src/main/java/in/sociobot/tapreadcanvas/CaptureConsentActivity.java');

    expect(manifest).toMatch(/TapReadAccessibilityService/);
    expect(manifest).toMatch(/android\.permission\.BIND_ACCESSIBILITY_SERVICE/);
    expect(manifest).toMatch(/foregroundServiceType="mediaProjection"/);
    expect(metadata).toMatch(/canRetrieveWindowContent="false"/);
    expect(consent).toMatch(/createScreenCaptureIntent/);
    expect(service).toMatch(/TYPE_ACCESSIBILITY_OVERLAY/);
    expect(service).toMatch(/getMediaProjection/);
    expect(service).toMatch(/ImageReader\.newInstance/);
    expect(service).toMatch(/TextRecognition\.getClient/);
    expect(service).toMatch(/InputImage\.fromBitmap/);
    expect(service).toMatch(/new TextToSpeech/);
  });

  it('@claim:android-selection-memory stores the last selection and reading for repeat', async () => {
    const service = await read('../android/app/src/main/java/in/sociobot/tapreadcanvas/TapReadAccessibilityService.java');
    expect(service).toMatch(/putString\("last_text"/);
    expect(service).toMatch(/getString\("last_text"/);
    expect(service).toMatch(/RegionMemory/);
  });

  it('@claim:protected-captures refuses likely protected blank captures', async () => {
    const safety = await read('../android/app/src/main/java/in/sociobot/tapreadcanvas/ScreenSafety.java');
    expect(safety).toMatch(/isLikelyProtectedBlank/);
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
