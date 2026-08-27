import { licenseIsFresh } from './state';

export const PRODUCT_SLUG = 'android-select-speak-canvas';
const BILLING_BASE = import.meta.env.VITE_BILLING_BASE || 'https://api.sociobot.in';
export const BUY_URL = `${BILLING_BASE}/api/v1/products/${PRODUCT_SLUG}/checkout`;
const TOKEN_KEY = `sb_license:${PRODUCT_SLUG}`;
const CACHE_KEY = `sb_license_cache:${PRODUCT_SLUG}`;

type Verdict = { valid: boolean; checkedAt: number; reason?: string };

export function captureReturnedLicense(): string | null {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return localStorage.getItem(TOKEN_KEY);
  localStorage.setItem(TOKEN_KEY, token);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  return token;
}

export function storeLicense(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim());
  localStorage.removeItem(CACHE_KEY);
}

export function cachedUnlock(): boolean {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') as Verdict | null;
    return Boolean(cached?.valid);
  } catch {
    return false;
  }
}

export async function verifyLicense(force = false): Promise<Verdict | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') as Verdict | null;
    if (!force && cached && licenseIsFresh(cached.checkedAt)) return cached;
  } catch { /* Reverify malformed cache. */ }

  const response = await fetch(`${BILLING_BASE}/api/v1/products/${PRODUCT_SLUG}/verify?license=${encodeURIComponent(token)}`);
  if (!response.ok) throw new Error('License service is unavailable.');
  const result = await response.json() as { valid: boolean; reason?: string };
  const verdict = { valid: result.valid === true, reason: result.reason, checkedAt: Date.now() };
  localStorage.setItem(CACHE_KEY, JSON.stringify(verdict));
  return verdict;
}
