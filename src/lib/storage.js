const DATABASE_NAME = 'localscope-local-workspace';
const DATABASE_VERSION = 1;
const OBJECT_STORE = 'workspace';
const WORKSPACE_KEY = 'current';
const FALLBACK_KEY = 'localscope.workspace.v1';
let databasePromise;

function openDatabase() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(OBJECT_STORE)) database.createObjectStore(OBJECT_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Unable to open local database.'));
      request.onblocked = () => reject(new Error('Local database upgrade is blocked by another tab.'));
    }).catch(() => null);
  }
  return databasePromise;
}

function validateWorkspace(value) {
  if (value?.version !== 1 || !Array.isArray(value.businesses) || !Array.isArray(value.ads)) return null;
  return {
    version: 1,
    businesses: value.businesses,
    ads: value.ads,
    sources: Array.isArray(value.sources) ? value.sources : [],
    matches: Array.isArray(value.matches) ? value.matches : [],
    dismissedMatches: Array.isArray(value.dismissedMatches) ? value.dismissedMatches : [],
    isDemo: Boolean(value.isDemo),
  };
}

function readFallback() {
  try {
    if (!globalThis.localStorage) return null;
    const stored = globalThis.localStorage.getItem(FALLBACK_KEY);
    return stored ? validateWorkspace(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}

export async function loadWorkspace() {
  const database = await openDatabase();
  if (database) {
    try {
      const value = await new Promise((resolve, reject) => {
        const transaction = database.transaction(OBJECT_STORE, 'readonly');
        const request = transaction.objectStore(OBJECT_STORE).get(WORKSPACE_KEY);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Unable to read local data.'));
      });
      const validated = validateWorkspace(value);
      if (validated) return validated;
    } catch {
      // Fall through to a previous localStorage workspace if present.
    }
  }
  return readFallback();
}

export async function saveWorkspace(workspace) {
  const value = { ...workspace, version: 1 };
  const database = await openDatabase();
  if (database) {
    try {
      await new Promise((resolve, reject) => {
        const transaction = database.transaction(OBJECT_STORE, 'readwrite');
        transaction.objectStore(OBJECT_STORE).put(value, WORKSPACE_KEY);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error || new Error('Unable to save local data.'));
        transaction.onabort = () => reject(transaction.error || new Error('Local save was cancelled.'));
      });
      try { globalThis.localStorage?.removeItem(FALLBACK_KEY); } catch { /* IndexedDB remains authoritative. */ }
      return true;
    } catch {
      // LocalStorage fallback may still have quota; report failure if it does.
    }
  }
  try {
    if (!globalThis.localStorage) return false;
    globalThis.localStorage.setItem(FALLBACK_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export async function clearWorkspace() {
  const database = await openDatabase();
  let cleared = !database && typeof indexedDB === 'undefined';
  if (database) {
    try {
      await new Promise((resolve, reject) => {
        const transaction = database.transaction(OBJECT_STORE, 'readwrite');
        transaction.objectStore(OBJECT_STORE).delete(WORKSPACE_KEY);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error || new Error('Unable to clear local data.'));
      });
      cleared = true;
    } catch {
      cleared = false;
    }
  } else if (typeof indexedDB !== 'undefined') {
    cleared = false;
  }
  try {
    if (globalThis.localStorage) globalThis.localStorage.removeItem(FALLBACK_KEY);
  } catch {
    cleared = false;
  }
  return cleared;
}
