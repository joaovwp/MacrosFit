// IndexedDB wrapper for offline caching

const DB_NAME = 'MacrosFitDB';
const DB_VERSION = 1;
const STORES = ['profile', 'library', 'diary', 'sync_queue'];

let db = null;

export async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      STORES.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };
  });
}

export async function get(storeName, key) {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function getAll(storeName) {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function set(storeName, data) {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function deleteItem(storeName, key) {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function clear(storeName) {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Sync queue for offline operations
export async function addToSyncQueue(operation) {
  if (!db) await initDB();

  const item = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    operation
  };

  return set('sync_queue', item);
}

export async function getSyncQueue() {
  if (!db) await initDB();

  const items = await getAll('sync_queue');
  return items.sort((a, b) => a.timestamp - b.timestamp);
}

export async function removeFromSyncQueue(id) {
  if (!db) await initDB();
  return deleteItem('sync_queue', id);
}

export async function clearSyncQueue() {
  if (!db) await initDB();
  return clear('sync_queue');
}
