// Large File Storage Utility using IndexedDB for efficient handling of large files
// (e.g. GTA packages, PUBG mods, videos, display images, and scripts)

const DB_NAME = 'AsmaroOverlayStore_LargeFiles';
const DB_VERSION = 1;
const STORE_NAME = 'files_cache';

interface StoredFileRecord {
  id: string;
  name: string;
  size: number;
  type: string;
  blob: Blob;
  updatedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

// In-memory cache of Blob Object URLs to prevent repeated URL creations
const objectUrlCache = new Map<string, string>();

/**
 * Save a large file (Blob or File) into IndexedDB
 */
export async function saveLargeFile(id: string, file: File | Blob, customName?: string): Promise<string> {
  try {
    const db = await getDB();
    const name = customName || (file instanceof File ? file.name : `${id}_file.bin`);
    const record: StoredFileRecord = {
      id,
      name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      blob: file,
      updatedAt: Date.now()
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Revoke old object URL if exists
    if (objectUrlCache.has(id)) {
      URL.revokeObjectURL(objectUrlCache.get(id)!);
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlCache.set(id, objectUrl);
    return objectUrl;
  } catch (error) {
    console.warn('Failed to save file in IndexedDB, falling back to direct ObjectURL', error);
    const objectUrl = URL.createObjectURL(file);
    objectUrlCache.set(id, objectUrl);
    return objectUrl;
  }
}

/**
 * Retrieve a large file ObjectURL by ID
 */
export async function getLargeFileUrl(id: string): Promise<string | null> {
  if (objectUrlCache.has(id)) {
    return objectUrlCache.get(id)!;
  }

  try {
    const db = await getDB();
    return await new Promise<string | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        const record = req.result as StoredFileRecord | undefined;
        if (record && record.blob) {
          const url = URL.createObjectURL(record.blob);
          objectUrlCache.set(id, url);
          resolve(url);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Format bytes into human readable format (MB, GB, KB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Helper to download a stored large file
 */
export async function triggerDownloadLargeFile(id: string, fallbackFileName: string = 'game_package.zip'): Promise<boolean> {
  try {
    const url = await getLargeFileUrl(id);
    if (!url) return false;

    const link = document.createElement('a');
    link.href = url;
    link.download = fallbackFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch {
    return false;
  }
}
