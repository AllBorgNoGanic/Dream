/**
 * offlineStore.js
 *
 * IndexedDB-backed offline storage for Dream Shepherd.
 *
 * Two object stores:
 *   1. "pendingDreams"  - dreams created while offline, waiting to sync
 *   2. "cachedDreams"   - full dream list cached for offline reading
 *
 * Uses a thin promise wrapper around IndexedDB (no deps).
 */

const DB_NAME = "dreamshepherd-offline";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("pendingDreams")) {
        db.createObjectStore("pendingDreams", { keyPath: "offlineId" });
      }
      if (!db.objectStoreNames.contains("cachedDreams")) {
        db.createObjectStore("cachedDreams", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(storeName, mode, fn) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(storeName, mode);
        const store = t.objectStore(storeName);
        const result = fn(store);
        t.oncomplete = () => resolve(result);
        t.onerror = () => reject(t.error);
      })
  );
}

// ── Pending dreams queue ────────────────────────────────────────────────────

/** Queue a dream payload for later sync. Returns the offlineId. */
export function addPendingDream(dreamPayload) {
  const offlineId = `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const entry = {
    ...dreamPayload,
    offlineId,
    created_at: new Date().toISOString(),
    _queuedAt: Date.now(),
  };
  return tx("pendingDreams", "readwrite", (store) => {
    store.put(entry);
  }).then(() => offlineId);
}

/** Get all pending dreams, oldest first. */
export function getPendingDreams() {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction("pendingDreams", "readonly");
        const req = t.objectStore("pendingDreams").getAll();
        req.onsuccess = () => {
          const items = req.result || [];
          items.sort((a, b) => (a._queuedAt || 0) - (b._queuedAt || 0));
          resolve(items);
        };
        req.onerror = () => reject(req.error);
      })
  );
}

/** Remove a single pending dream after successful sync. */
export function removePendingDream(offlineId) {
  return tx("pendingDreams", "readwrite", (store) => {
    store.delete(offlineId);
  });
}

/** Count pending dreams. */
export function countPendingDreams() {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction("pendingDreams", "readonly");
        const req = t.objectStore("pendingDreams").count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

// ── Dream cache for offline reading ─────────────────────────────────────────

/** Overwrite the cached dream list (call after every successful load). */
export function cacheDreams(dreams) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction("cachedDreams", "readwrite");
        const store = t.objectStore("cachedDreams");
        store.clear(); // wipe old
        dreams.forEach((d) => store.put(d));
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
      })
  );
}

/** Retrieve cached dreams for offline viewing. */
export function getCachedDreams() {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction("cachedDreams", "readonly");
        const req = t.objectStore("cachedDreams").getAll();
        req.onsuccess = () => {
          const items = req.result || [];
          items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          resolve(items);
        };
        req.onerror = () => reject(req.error);
      })
  );
}
