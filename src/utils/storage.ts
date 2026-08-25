import { StoreProduct, StoreSettings, SubscriptionLicense, StoreCategory, GmailUserRecord, MediaVaultItem } from '../types';
import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS, DEFAULT_SUBSCRIPTIONS, DEFAULT_CATEGORIES } from '../data/storeData';

const STORAGE_KEYS = {
  CATEGORIES: 'asmaro_categories_v3',
  PRODUCTS: 'asmaro_products_v3',
  SETTINGS: 'asmaro_settings_v3',
  SUBSCRIPTIONS: 'asmaro_subscriptions_v3',
  GMAIL_USERS: 'asmaro_gmail_users_v3',
  MEDIA_VAULT: 'asmaro_media_vault_v3',
  STORE_VERSION: 'asmaro_store_version_v3',
  LOCAL_ACTIVATIONS: 'asmaro_local_activations_v3',
  GAME_FILES: 'asmaro_game_files_v3'
};

// ========================
// HIGH-CAPACITY INDEXEDDB STORAGE ENGINE
// ========================
const IDB_DB_NAME = 'AsmaroOverlay_MasterStore_DB';
const IDB_VERSION = 2;
const IDB_STORE_NAME = 'asmaro_entities';

let idbPromise: Promise<IDBDatabase> | null = null;

function getStoreDB(): Promise<IDBDatabase> {
  if (idbPromise) return idbPromise;

  idbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in current environment'));
      return;
    }

    const request = indexedDB.open(IDB_DB_NAME, IDB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return idbPromise;
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await getStoreDB();
    return await new Promise<T | null>((resolve) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result && req.result.value !== undefined) {
          resolve(req.result.value as T);
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

async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getStoreDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.put({ key, value, updatedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Failed writing key: ${key}`, err);
  }
}

// ========================
// FAST IN-MEMORY SYNCHRONOUS CACHE
// ========================
// This ensures that all components receive instant, synchronous results for hundreds of items
// while persisting asynchronously without any 5MB localStorage limitations.

let cachedCategories: StoreCategory[] = (() => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.CATEGORIES) : null;
    return raw ? JSON.parse(raw) : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
})();

let cachedProducts: StoreProduct[] = (() => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.PRODUCTS) : null;
    return raw ? JSON.parse(raw) : DEFAULT_PRODUCTS;
  } catch {
    return DEFAULT_PRODUCTS;
  }
})();

let cachedSettings: StoreSettings = (() => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SETTINGS) : null;
    return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
})();

let cachedSubscriptions: SubscriptionLicense[] = (() => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS) : null;
    return raw ? JSON.parse(raw) : DEFAULT_SUBSCRIPTIONS;
  } catch {
    return DEFAULT_SUBSCRIPTIONS;
  }
})();

export const DEFAULT_GMAIL_USERS: GmailUserRecord[] = [
  {
    id: 'usr-1',
    email: 'jalal.bibi.123@gmail.com',
    name: 'Jalal Bibi',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    lastLoginDate: new Date().toISOString(),
    ipLocation: 'Beirut, Lebanon',
    licenseCode: 'ASMARO-ROYAL-9981-2241',
    isSubscribed: true
  },
  {
    id: 'usr-2',
    email: 'gamer.pro.overlay@gmail.com',
    name: 'Ahmed Streamer',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
    lastLoginDate: new Date(Date.now() - 3600000 * 5).toISOString(),
    ipLocation: 'Riyadh, KSA',
    licenseCode: 'ASMARO-GTA-8712-4419',
    isSubscribed: true
  }
];

let cachedGmailUsers: GmailUserRecord[] = (() => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.GMAIL_USERS) : null;
    return raw ? JSON.parse(raw) : DEFAULT_GMAIL_USERS;
  } catch {
    return DEFAULT_GMAIL_USERS;
  }
})();

export interface LocalItemActivation {
  itemId: string;
  code: string;
  activatedAt: string;
  expiryDate: string;
  durationDays: number;
}

let cachedLocalActivations: LocalItemActivation[] = (() => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.LOCAL_ACTIVATIONS) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
})();

let cachedMediaVault: MediaVaultItem[] = (() => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.MEDIA_VAULT) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
})();

export interface SavedGameFile {
  id: string;
  productId: string;
  fileName: string;
  fileType: 'image' | 'screenshot' | 'save_state' | 'custom_file';
  dataUrl: string;
  size?: string;
  createdAt: string;
  notes?: string;
}

let cachedGameFiles: Record<string, SavedGameFile[]> = {};

// Asynchronous bootloader that hydrates from IndexedDB to memory
if (typeof window !== 'undefined') {
  (async () => {
    try {
      const [idbProds, idbCats, idbSets, idbSubs, idbUsers, idbActs, idbVault] = await Promise.all([
        idbGet<StoreProduct[]>(STORAGE_KEYS.PRODUCTS),
        idbGet<StoreCategory[]>(STORAGE_KEYS.CATEGORIES),
        idbGet<StoreSettings>(STORAGE_KEYS.SETTINGS),
        idbGet<SubscriptionLicense[]>(STORAGE_KEYS.SUBSCRIPTIONS),
        idbGet<GmailUserRecord[]>(STORAGE_KEYS.GMAIL_USERS),
        idbGet<LocalItemActivation[]>(STORAGE_KEYS.LOCAL_ACTIVATIONS),
        idbGet<MediaVaultItem[]>(STORAGE_KEYS.MEDIA_VAULT)
      ]);

      let hasChanges = false;

      if (idbProds && idbProds.length > 0) {
        cachedProducts = idbProds;
        hasChanges = true;
      }
      if (idbCats && idbCats.length > 0) {
        cachedCategories = idbCats;
        hasChanges = true;
      }
      if (idbSets) {
        cachedSettings = idbSets;
        hasChanges = true;
      }
      if (idbSubs && idbSubs.length > 0) {
        cachedSubscriptions = idbSubs;
        hasChanges = true;
      }
      if (idbUsers && idbUsers.length > 0) {
        cachedGmailUsers = idbUsers;
        hasChanges = true;
      }
      if (idbActs) {
        cachedLocalActivations = idbActs;
        hasChanges = true;
      }
      if (idbVault) {
        cachedMediaVault = idbVault;
        hasChanges = true;
      }

      if (hasChanges) {
        window.dispatchEvent(new Event('asmaro_store_updated'));
      }
    } catch (e) {
      console.warn('IndexedDB initial hydration complete with fallback', e);
    }
  })();
}

// Helper to safely write small snapshot to localStorage without throwing QuotaExceeded
function safeLocalStorageSet(key: string, value: any) {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (e) {
    // If quota exceeded, try storing lighter payload (e.g. metadata only)
    try {
      if (Array.isArray(value)) {
        // Strip heavy embeddedHtmlContent and long data URLs for localStorage fallback
        const light = value.map((item: any) => {
          if (item && typeof item === 'object') {
            const copy = { ...item };
            if (copy.embeddedHtmlContent && copy.embeddedHtmlContent.length > 1000) {
              copy.embeddedHtmlContent = copy.embeddedHtmlContent.substring(0, 500) + '...';
            }
            if (copy.videoUrl && copy.videoUrl.startsWith('data:')) {
              copy.videoUrl = undefined;
            }
            return copy;
          }
          return item;
        });
        localStorage.setItem(key, JSON.stringify(light));
      }
    } catch {
      // IndexedDB has the true complete data
    }
  }
}

// ========================
// STORE VERSIONING
// ========================
export const getStoreVersion = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEYS.STORE_VERSION) || '3.9.0-AXA-MASTER';
  } catch {
    return '3.9.0-AXA-MASTER';
  }
};

export const incrementStoreVersion = (): string => {
  const current = getStoreVersion();
  const parts = current.split('.');
  let nextVer = '3.9.1-AXA-MASTER';
  if (parts.length >= 3) {
    const patchNumber = parseInt(parts[2], 10) || 0;
    nextVer = `${parts[0]}.${parts[1]}.${patchNumber + 1}-AXA-MASTER`;
  }
  try {
    localStorage.setItem(STORAGE_KEYS.STORE_VERSION, nextVer);
  } catch {}
  return nextVer;
};

// ========================
// CATEGORIES
// ========================
export const getStoredCategories = (): StoreCategory[] => {
  return cachedCategories;
};

export const saveStoredCategories = (categories: StoreCategory[]) => {
  cachedCategories = categories;
  safeLocalStorageSet(STORAGE_KEYS.CATEGORIES, categories);
  idbSet(STORAGE_KEYS.CATEGORIES, categories);
  incrementStoreVersion();
  window.dispatchEvent(new Event('asmaro_store_updated'));
};

// ========================
// PRODUCTS (GAMES, VIDEOS, HTML GAMES, SCRIPTS)
// ========================
export const getStoredProducts = (): StoreProduct[] => {
  return cachedProducts;
};

export const saveStoredProducts = (products: StoreProduct[]) => {
  cachedProducts = products;
  // 1. Write pristine un-truncated data to IndexedDB (virtually unlimited GBs)
  idbSet(STORAGE_KEYS.PRODUCTS, products);
  // 2. Write safe copy to localStorage
  safeLocalStorageSet(STORAGE_KEYS.PRODUCTS, products);
  incrementStoreVersion();
  window.dispatchEvent(new Event('asmaro_store_updated'));
};

// ========================
// SETTINGS
// ========================
export const getStoredSettings = (): StoreSettings => {
  return cachedSettings;
};

export const saveStoredSettings = (settings: StoreSettings) => {
  cachedSettings = settings;
  safeLocalStorageSet(STORAGE_KEYS.SETTINGS, settings);
  idbSet(STORAGE_KEYS.SETTINGS, settings);
  incrementStoreVersion();
  window.dispatchEvent(new Event('asmaro_store_updated'));
};

// ========================
// SUBSCRIPTIONS & LICENSES
// ========================
export const getStoredSubscriptions = (): SubscriptionLicense[] => {
  return cachedSubscriptions;
};

export const saveStoredSubscriptions = (subscriptions: SubscriptionLicense[]) => {
  cachedSubscriptions = subscriptions;
  safeLocalStorageSet(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
  idbSet(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
  incrementStoreVersion();
  window.dispatchEvent(new Event('asmaro_store_updated'));
};

// ========================
// GMAIL USERS
// ========================
export const getStoredGmailUsers = (): GmailUserRecord[] => {
  return cachedGmailUsers;
};

export const saveStoredGmailUsers = (users: GmailUserRecord[]) => {
  cachedGmailUsers = users;
  safeLocalStorageSet(STORAGE_KEYS.GMAIL_USERS, users);
  idbSet(STORAGE_KEYS.GMAIL_USERS, users);
  window.dispatchEvent(new Event('asmaro_store_updated'));
};

export const registerOrUpdateGmailUser = (email: string, name: string, avatarUrl?: string) => {
  const users = [...getStoredGmailUsers()];
  const existingIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (existingIndex >= 0) {
    users[existingIndex].lastLoginDate = new Date().toISOString();
    if (name) users[existingIndex].name = name;
    if (avatarUrl) users[existingIndex].avatarUrl = avatarUrl;
  } else {
    users.unshift({
      id: 'usr-' + Date.now(),
      email,
      name: name || email.split('@')[0],
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
      lastLoginDate: new Date().toISOString(),
      ipLocation: 'Online (Connected)',
      isSubscribed: false,
      grantedItems: []
    });
  }
  saveStoredGmailUsers(users);
};

// ========================
// LOCAL ACTIVATIONS
// ========================
export const getStoredLocalActivations = (): LocalItemActivation[] => {
  return cachedLocalActivations;
};

export const saveStoredLocalActivations = (activations: LocalItemActivation[]) => {
  cachedLocalActivations = activations;
  safeLocalStorageSet(STORAGE_KEYS.LOCAL_ACTIVATIONS, activations);
  idbSet(STORAGE_KEYS.LOCAL_ACTIVATIONS, activations);
  window.dispatchEvent(new Event('asmaro_store_updated'));
};

// ========================
// MEDIA VAULT
// ========================
export const getStoredMediaVault = (): MediaVaultItem[] => {
  return cachedMediaVault;
};

export const saveStoredMediaVault = (items: MediaVaultItem[]) => {
  cachedMediaVault = items;
  safeLocalStorageSet(STORAGE_KEYS.MEDIA_VAULT, items);
  idbSet(STORAGE_KEYS.MEDIA_VAULT, items);
  window.dispatchEvent(new Event('asmaro_store_updated'));
};

// ========================
// GAME FILES & SCREENSHOTS
// ========================
export const getStoredGameFiles = (productId?: string): SavedGameFile[] => {
  const prodKey = productId ? `asmaro_game_files_${productId}` : 'asmaro_all_game_files';
  if (cachedGameFiles[prodKey]) {
    return cachedGameFiles[prodKey];
  }
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(prodKey) : null;
    const list = raw ? JSON.parse(raw) : [];
    cachedGameFiles[prodKey] = list;
    return list;
  } catch {
    return [];
  }
};

export const saveStoredGameFile = (file: SavedGameFile) => {
  const prodKey = `asmaro_game_files_${file.productId}`;
  const prodFiles = [...getStoredGameFiles(file.productId)];
  const existingIdx = prodFiles.findIndex(f => f.id === file.id);
  if (existingIdx >= 0) {
    prodFiles[existingIdx] = file;
  } else {
    prodFiles.unshift(file);
  }
  cachedGameFiles[prodKey] = prodFiles;
  safeLocalStorageSet(prodKey, prodFiles.slice(0, 100));
  idbSet(prodKey, prodFiles);

  const allKey = 'asmaro_all_game_files';
  const allFiles = [...getStoredGameFiles()];
  const globalIdx = allFiles.findIndex(f => f.id === file.id);
  if (globalIdx >= 0) {
    allFiles[globalIdx] = file;
  } else {
    allFiles.unshift(file);
  }
  cachedGameFiles[allKey] = allFiles;
  safeLocalStorageSet(allKey, allFiles.slice(0, 200));
  idbSet(allKey, allFiles);

  if (file.fileType === 'image' || file.fileType === 'screenshot') {
    const vault = [...getStoredMediaVault()];
    const vaultIdx = vault.findIndex(v => v.id === file.id);
    const vaultItem: MediaVaultItem = {
      id: file.id,
      name: file.fileName,
      type: 'image',
      url: file.dataUrl,
      size: file.size || 'صورة محفوظة',
      category: file.productId,
      uploadedAt: file.createdAt,
      tags: ['game_save', file.productId]
    };
    if (vaultIdx >= 0) {
      vault[vaultIdx] = vaultItem;
    } else {
      vault.unshift(vaultItem);
    }
    saveStoredMediaVault(vault);
  }

  window.dispatchEvent(new Event('asmaro_store_updated'));
};

export const deleteStoredGameFile = (fileId: string, productId: string) => {
  const prodKey = `asmaro_game_files_${productId}`;
  const prodFiles = getStoredGameFiles(productId).filter(f => f.id !== fileId);
  cachedGameFiles[prodKey] = prodFiles;
  safeLocalStorageSet(prodKey, prodFiles);
  idbSet(prodKey, prodFiles);

  const allKey = 'asmaro_all_game_files';
  const allFiles = getStoredGameFiles().filter(f => f.id !== fileId);
  cachedGameFiles[allKey] = allFiles;
  safeLocalStorageSet(allKey, allFiles);
  idbSet(allKey, allFiles);

  const vault = getStoredMediaVault().filter(v => v.id !== fileId);
  saveStoredMediaVault(vault);

  window.dispatchEvent(new Event('asmaro_store_updated'));
};

// ========================
// ACCESS & LICENSE CHECKER
// ========================
export const checkIsItemActive = (
  itemId: string,
  category?: string,
  currentUserEmail?: string
): { isActive: boolean; expiryDate?: string; durationDays?: number } => {
  const now = new Date().getTime();

  // 1. Check Gmail user access
  if (currentUserEmail) {
    const users = getStoredGmailUsers();
    const currentUser = users.find(u => u.email.toLowerCase() === currentUserEmail.toLowerCase());
    if (currentUser && currentUser.grantedItems) {
      const itemAccess = currentUser.grantedItems.find(
        g => (g.itemId === itemId || g.itemId === 'all' || (category && g.itemId === category)) && g.status === 'active'
      );
      if (itemAccess) {
        const exp = new Date(itemAccess.expiryDate).getTime();
        if (exp > now) {
          return { isActive: true, expiryDate: itemAccess.expiryDate, durationDays: itemAccess.durationDays };
        }
      }
    }
  }

  // 2. Check local client activations
  const localActs = getStoredLocalActivations();
  const localMatch = localActs.find(a => a.itemId === itemId || a.itemId === 'all' || (category && a.itemId === category));
  if (localMatch) {
    const exp = new Date(localMatch.expiryDate).getTime();
    if (exp > now) {
      return { isActive: true, expiryDate: localMatch.expiryDate, durationDays: localMatch.durationDays };
    }
  }

  return { isActive: false };
};

// ========================
// RESET STORE
// ========================
export const resetStoreToDefaults = () => {
  saveStoredCategories(DEFAULT_CATEGORIES);
  saveStoredProducts(DEFAULT_PRODUCTS);
  saveStoredSettings(DEFAULT_SETTINGS);
  saveStoredSubscriptions(DEFAULT_SUBSCRIPTIONS);
  saveStoredGmailUsers(DEFAULT_GMAIL_USERS);
  saveStoredMediaVault([]);
  saveStoredLocalActivations([]);
};
