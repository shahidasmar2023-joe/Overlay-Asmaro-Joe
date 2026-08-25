export type ProductCategory = string;

export interface StoreCategory {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  iconName?: string;
  badge?: string;
  order: number;
}

export interface StoreProduct {
  id: string;
  title: string;
  category: string; // matches StoreCategory.id
  price: number;
  discountPrice?: number;
  shortDescription: string;
  fullDescription: string;
  features: string[];
  tags: string[];
  videoUrl?: string; // Direct MP4 or embedded preview
  thumbnailUrl: string;
  screenshots: string[]; // Store display images / screenshots
  scriptCode?: string; // Embedded script (Lua, Python, JS, AHK)
  scriptFileName?: string;
  largeDownloadUrl?: string; // External large file, direct package, or cached IndexedDB link
  fileSize?: string;
  gameType?: 'gta' | 'pubg' | 'script' | 'mods' | 'stream_overlay' | 'standalone_exe' | 'html5_game';
  downloadFileName?: string;
  installationGuide?: string;
  isHot?: boolean;
  isNew?: boolean;
  audioAlertUrl?: string; // Playable sound trigger
  version?: string;
  supportedPlatforms?: string[]; // PC, Android, Streamlabs, OBS, FiveM
  viewsCount?: number;
  allowInAppBrowser?: boolean; // Can be played directly inside app's embedded browser
  allowPCDownload?: boolean; // Can download game/script file to PC
  embeddedHtmlContent?: string; // Custom HTML/JS game bundle or canvas simulator
  scenarioDetails?: string; // Game scenario and background story
}

export interface SubscriptionLicense {
  id: string;
  code: string; // e.g. ASMARO-GTA-7842-9912
  customerName: string;
  customerPhone?: string;
  productIds: string[]; // Allowed products/games
  durationDays: number;
  startDate: string; // ISO date
  expiryDate: string; // ISO date
  status: 'active' | 'expiring' | 'expired';
  notes?: string;
  createdAt: string;
}

export interface UserGrantedAccess {
  id: string;
  itemId: string; // Product ID, Video ID, or Category ID
  itemName: string;
  itemType: 'game' | 'video' | 'category' | 'script';
  startDate: string; // ISO date string
  expiryDate: string; // ISO date string
  durationDays: number;
  status: 'active' | 'expired';
  grantedByAdmin: boolean;
  activatedAt: string;
}

export interface GmailUserRecord {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  lastLoginDate: string;
  ipLocation?: string;
  licenseCode?: string;
  isSubscribed: boolean;
  grantedItems?: UserGrantedAccess[];
}

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  storeLogoAvatarUrl?: string; // Circular avatar image inside the flame ring
  whatsappNumber: string; // e.g. 76774306 or 96176774306
  whatsappMessageTemplate: string;
  wishMoneyUrl: string; // e.g. https://wishmoney.com
  wishMoneyAccount: string; // Account identifier/phone
  tiktokUsername?: string; // e.g. @overlay.asmaro or asmaro
  tiktokUrl?: string; // e.g. https://tiktok.com/@overlay.asmaro
  watermarkLogoUrl: string; // Watermark protection image across all videos
  watermarkOpacity: number; // 0.0 to 1.0 (Full-screen overlay image opacity slider)
  isWatermarkFullScreen?: boolean; // Default true
  requireInternetConnection?: boolean; // Must be online to use AXA/App
  watermarkPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center' | 'full-diagonal';
  watermarkText?: string; // Custom anti-theft text overlay
  watermarkScale?: number; // 0.8 to 1.5
  adminPasswordHash: string; // Master Admin Password
  zipProtectionPassword: string; // Password for zip export encryption
  requireZipPasswordOnExport: boolean;
  currency: string;
  themeColor: string;
  lastBackupDate?: string;
}

export interface MediaVaultItem {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio';
  url: string;
  size?: string;
  category?: string;
  uploadedAt: string;
  tags?: string[];
}

export interface UniversalZipManifest {
  storeName: string;
  exportVersion: string;
  exportedAt: string;
  productsCount: number;
  categoriesCount: number;
  subscriptionsCount: number;
  mediaCount: number;
  hasZipPassword: boolean;
  passwordProtected: boolean;
  zipPasswordHash?: string;
  folders: string[];
  filesList: {
    media: string[];
    scripts: string[];
    models: string[];
    executablePackage: string[];
  };
}
