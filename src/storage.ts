import type { Selection } from './state';

export type SavedState = {
  text: string;
  rate: number;
  selection?: Selection;
  updatedAt: number;
};

export type HistoryItem = { text: string; createdAt: number };

const DB_NAME = 'tapread-canvas';
const STORE = 'local-data';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeValue<T>(key: string, value: T): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(value, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

export async function getValue<T>(key: string): Promise<T | undefined> {
  const db = await openDatabase();
  const value = await new Promise<T | undefined>((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return value;
}

export async function addHistory(item: HistoryItem): Promise<void> {
  const history = (await getValue<HistoryItem[]>('history')) ?? [];
  const next = [item, ...history.filter((entry) => entry.text !== item.text)].slice(0, 25);
  await storeValue('history', next);
}

export async function exportLocalData(): Promise<string> {
  const [state, history] = await Promise.all([
    getValue<SavedState>('state'),
    getValue<HistoryItem[]>('history'),
  ]);
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), state, history: history ?? [] }, null, 2);
}

export async function importLocalData(raw: string): Promise<void> {
  const parsed = JSON.parse(raw) as { version?: unknown; state?: SavedState; history?: HistoryItem[] };
  if (parsed.version !== 1 || !parsed.state || typeof parsed.state.text !== 'string') {
    throw new Error('That file is not a TapRead Canvas export.');
  }
  await storeValue('state', parsed.state);
  if (Array.isArray(parsed.history)) {
    const safeHistory = parsed.history
      .filter((item) => item && typeof item.text === 'string' && typeof item.createdAt === 'number')
      .slice(0, 25);
    await storeValue('history', safeHistory);
  }
}
