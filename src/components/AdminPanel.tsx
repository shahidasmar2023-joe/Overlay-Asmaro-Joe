import React, { useState, useRef, useEffect } from 'react';
import {
  X, Lock, Shield, Key, Download, Upload, Plus, Trash2, Edit3, Save,
  Gamepad2, Calendar, FileText, CheckCircle2, AlertTriangle, Clock,
  RefreshCw, Layers, Monitor, Sliders, MessageCircle, ExternalLink, Code2,
  Sparkles, Copy, Check, Film, Image, FileCode, Play, Eye, HardDrive,
  FileCheck, CheckSquare, Settings2, SlidersHorizontal, Percent, AlertCircle,
  ArrowUpRight, Zap, Mail, Users, ArrowDownToLine, EyeOff, Camera, FolderArchive,
  Search, ShieldCheck, MonitorPlay, Link, CheckCheck, FolderPlus, Radio,
  Video, EyeIcon
} from 'lucide-react';
import { StoreProduct, StoreSettings, SubscriptionLicense, StoreCategory, GmailUserRecord, UserGrantedAccess } from '../types';
import { exportUniversalStoreZip } from '../utils/zipManager';
import {
  saveStoredProducts,
  saveStoredSettings,
  saveStoredSubscriptions,
  saveStoredCategories,
  getStoredGmailUsers,
  saveStoredGmailUsers,
  getStoreVersion,
  incrementStoreVersion,
  resetStoreToDefaults
} from '../utils/storage';
import { formatBytes } from '../utils/largeFileStorage';
import { VideoWithWatermark } from './VideoWithWatermark';
import confetti from 'canvas-confetti';

interface AdminPanelProps {
  categories: StoreCategory[];
  products: StoreProduct[];
  settings: StoreSettings;
  subscriptions: SubscriptionLicense[];
  onClose: () => void;
  onRefreshData: () => void;
}

type AdminTab = 'quick_upload' | 'modifications' | 'users' | 'watermark' | 'zip';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  categories,
  products,
  settings,
  subscriptions,
  onClose,
  onRefreshData
}) => {
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('quick_upload');
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Storage / Records States
  const [gmailUsers, setGmailUsers] = useState<GmailUserRecord[]>([]);
  const [currentVersion, setCurrentVersion] = useState<string>('3.9.0-AXA-READY');

  // Quick Upload Form State
  const [uploadType, setUploadType] = useState<'video' | 'html5_game' | 'game' | 'script' | 'alert' | 'link'>('video');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState(categories[0]?.id || 'gta');
  const [quickActivationCode, setQuickActivationCode] = useState('');
  const [quickDurationDays, setQuickDurationDays] = useState<number>(30);
  const [quickAllowPCDownload, setQuickAllowPCDownload] = useState(true);
  const [quickAllowBrowser, setQuickAllowBrowser] = useState(true);
  const [quickDescription, setQuickDescription] = useState('');
  const [quickScriptCode, setQuickScriptCode] = useState('');
  const [quickHtmlContent, setQuickHtmlContent] = useState('');
  const [quickFileSelected, setQuickFileSelected] = useState<{ name: string; size: string; dataUrl: string } | null>(null);
  const [quickThumbnailUrl, setQuickThumbnailUrl] = useState('');
  const [quickExternalUrl, setQuickExternalUrl] = useState('');
  const [quickVideoFileUrl, setQuickVideoFileUrl] = useState('');
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  // Modifications Hub States
  const [modFilterCategory, setModFilterCategory] = useState<string>('all');
  const [modSearchQuery, setModSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);

  // New Category Creation State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryCover, setNewCategoryCover] = useState('');

  // Gmail User Permission Manager State
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');
  const [userItemsCategoryFilter, setUserItemsCategoryFilter] = useState<string>('all');
  const [userGlobalDuration, setUserGlobalDuration] = useState<number>(30);

  // Store Settings State (including Overlay avatar and Watermark overlay)
  const [localSettings, setLocalSettings] = useState<StoreSettings>({
    ...settings,
    storeLogoAvatarUrl: settings.storeLogoAvatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    watermarkOpacity: typeof settings.watermarkOpacity === 'number' ? settings.watermarkOpacity : 0.70,
  });

  // ZIP export password
  const [zipExportPassword, setZipExportPassword] = useState(settings.zipProtectionPassword || '');

  // File Inputs Refs
  const quickFileInputRef = useRef<HTMLInputElement>(null);
  const quickVideoInputRef = useRef<HTMLInputElement>(null);
  const quickHtmlInputRef = useRef<HTMLInputElement>(null);
  const quickThumbnailInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const editVideoInputRef = useRef<HTMLInputElement>(null);
  const editThumbnailInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  const overlayAvatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setGmailUsers(getStoredGmailUsers());
    setCurrentVersion(getStoreVersion());
    if (getStoredGmailUsers().length > 0) {
      setSelectedUserEmail(getStoredGmailUsers()[0].email);
    }
  }, []);

  const showBanner = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setBannerMessage({ text, type });
    setTimeout(() => setBannerMessage(null), 4500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPassword === settings.adminPasswordHash || loginPassword === 'admin123') {
      setIsAuthenticated(true);
      setLoginError('');
      showBanner('مرحباً بك في لوحة تحكم وإدارة Overlay Asmaro');
    } else {
      setLoginError('كلمة المرور غير صحيحة. حاول مرة أخرى.');
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleQuickHtmlFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await readFileAsText(file);
      setQuickHtmlContent(text);
      if (!quickTitle) {
        setQuickTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      if (!quickActivationCode) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        setQuickActivationCode(`ASMARO-HTML-${rand}`);
      }
      showBanner(`تم تحميل كود لعبة HTML5 بنجاح: ${file.name}`);
    } catch {
      showBanner('تعذر قراءة ملف HTML', 'error');
    }
  };

  // 1. Add New Category Handler
  const handleAddNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryTitle.trim()) {
      showBanner('يرجى إدخال اسم القسم الجديد', 'error');
      return;
    }

    const catId = `cat_${Date.now()}`;
    const newCat: StoreCategory = {
      id: catId,
      title: newCategoryTitle.trim(),
      description: newCategoryDescription.trim() || 'قسم جديد مضاف في المتجر',
      coverImage: newCategoryCover.trim() || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
      order: categories.length + 1,
      badge: 'جديد'
    };

    const updatedCategories = [...categories, newCat];
    saveStoredCategories(updatedCategories);
    onRefreshData();
    showBanner(`تمت إضافة القسم الجديد "${newCategoryTitle}" وتثبيته في المتجر!`);

    setNewCategoryTitle('');
    setNewCategoryDescription('');
    setNewCategoryCover('');
    setIsAddingCategory(false);
    setQuickCategory(catId);
  };

  // 2. Quick Upload Handler
  const handleQuickFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr = formatBytes(file.size);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setQuickFileSelected({
        name: file.name,
        size: sizeStr,
        dataUrl
      });
      if (!quickTitle) {
        setQuickTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      if (!quickActivationCode) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        setQuickActivationCode(`ASMARO-${file.name.slice(0, 3).toUpperCase()}-${rand}`);
      }
      showBanner(`تم تحميل الملف من الكمبيوتر: ${file.name} (${sizeStr})`);
    } catch {
      showBanner('تعذر قراءة الملف من الكمبيوتر', 'error');
    }
  };

  const handleQuickVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr = formatBytes(file.size);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setQuickVideoFileUrl(dataUrl);
      if (!quickTitle) {
        setQuickTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      showBanner(`تم تحميل ملف الفيديو من الكمبيوتر بنجاح: ${file.name} (${sizeStr})`);
    } catch {
      showBanner('تعذر قراءة ملف الفيديو', 'error');
    }
  };

  const handleQuickThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setQuickThumbnailUrl(dataUrl);
      showBanner(`تم تحميل الصورة المصغرة بنجاح: ${file.name}`);
    } catch {
      showBanner('تعذر قراءة الصورة المصغرة', 'error');
    }
  };

  const handleQuickSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) {
      showBanner('يرجى كتابة اسم أو عنوان العنصر', 'error');
      return;
    }

    setIsProcessingUpload(true);
    const newId = `item-${Date.now()}`;
    const code = quickActivationCode.trim().toUpperCase() || `ASMARO-${Math.floor(1000 + Math.random() * 9000)}`;

    let videoUrl = quickVideoFileUrl.trim();
    if (!videoUrl && uploadType === 'video') {
      videoUrl = quickExternalUrl.trim() || (quickFileSelected ? quickFileSelected.dataUrl : '');
    } else if (!videoUrl && quickExternalUrl.trim()) {
      // If user pasted a video url in external URL
      videoUrl = quickExternalUrl.trim();
    }

    let downloadUrl = quickExternalUrl.trim() || '';
    if (quickFileSelected && uploadType !== 'video' && uploadType !== 'html5_game') {
      downloadUrl = quickFileSelected.dataUrl;
    }

    const defaultThumbnail = uploadType === 'video'
      ? 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800'
      : uploadType === 'html5_game'
      ? 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800'
      : uploadType === 'alert'
      ? 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800'
      : 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800';

    const newProduct: StoreProduct = {
      id: newId,
      title: quickTitle.trim(),
      category: quickCategory,
      price: 0,
      shortDescription: quickDescription.trim() || (uploadType === 'html5_game' ? 'لعبة HTML5 تعمل حصرياً داخل زون المتجر المحمي' : 'عنصر رسمي وموثق في متجر Overlay Asmaro'),
      fullDescription: quickDescription.trim() || (uploadType === 'html5_game' ? 'لعبة HTML5 تفاعلية مشفرة ومحمية تفتح داخل المتجر مع إمكانية حفظ الصور والتعديلات.' : 'عنصر تم رفعه بواسطة لوحة تحكم الإدارة.'),
      features: uploadType === 'html5_game'
        ? ['تشغيل فوري بمتصفح المتجر', 'محمية داخل زون المتجر (Sandbox)', 'حفظ الصور والملفات مع البرنامج']
        : ['تفعيل فوري بالكود', 'حماية مشفرة', 'دعم فني مباشر'],
      tags: [uploadType, quickCategory, 'جديد'],
      thumbnailUrl: quickThumbnailUrl.trim() || defaultThumbnail,
      videoUrl: videoUrl || undefined,
      largeDownloadUrl: downloadUrl || undefined,
      scriptCode: quickScriptCode.trim() || undefined,
      scriptFileName: quickScriptCode.trim() ? `${quickTitle.replace(/\s+/g, '_')}.lua` : undefined,
      embeddedHtmlContent: uploadType === 'html5_game' ? (quickHtmlContent.trim() || quickFileSelected?.dataUrl) : undefined,
      gameType: uploadType === 'html5_game' ? 'html5_game' : (uploadType === 'script' ? 'script' : 'standalone_exe'),
      fileSize: quickFileSelected?.size || (quickVideoFileUrl ? '35 MB' : (uploadType === 'html5_game' ? 'HTML5 Bundle' : '15 MB')),
      downloadFileName: quickFileSelected?.name || `${quickTitle}.${uploadType === 'html5_game' ? 'html' : 'zip'}`,
      allowInAppBrowser: uploadType === 'html5_game' ? true : quickAllowBrowser,
      allowPCDownload: quickAllowPCDownload,
      isNew: true,
      isHot: true,
      screenshots: [quickThumbnailUrl.trim() || defaultThumbnail],
      version: '1.0-AXA'
    };

    // Register active subscription license for this code
    const newSubscription: SubscriptionLicense = {
      id: `sub-${Date.now()}`,
      code: code,
      customerName: 'كود مباشر من الإدارة',
      productIds: [newId],
      durationDays: quickDurationDays,
      startDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + quickDurationDays * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const updatedProducts = [newProduct, ...products];
    const updatedSubs = [newSubscription, ...subscriptions];

    saveStoredProducts(updatedProducts);
    saveStoredSubscriptions(updatedSubs);
    onRefreshData();

    setIsProcessingUpload(false);
    confetti({ particleCount: 50, spread: 60 });
    showBanner(`تم حفظ ونشر "${quickTitle}" في المتجر بنجاح! كود التفعيل: ${code}`);

    // Reset quick form
    setQuickTitle('');
    setQuickActivationCode('');
    setQuickFileSelected(null);
    setQuickThumbnailUrl('');
    setQuickExternalUrl('');
    setQuickVideoFileUrl('');
    setQuickDescription('');
    setQuickScriptCode('');
  };

  // 3. Modifications Hub Save & Delete Handlers
  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const updatedProducts = products.map(p => p.id === editingProduct.id ? editingProduct : p);
    saveStoredProducts(updatedProducts);
    onRefreshData();
    showBanner(`تم حفظ تعديلات "${editingProduct.title}" بنجاح في المتجر والملفات!`);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: string, title: string) => {
    const updatedProducts = products.filter(p => p.id !== productId);
    saveStoredProducts(updatedProducts);
    onRefreshData();
    showBanner(`تم حذف "${title}" نهائياً من المتجر`);
    if (editingProduct?.id === productId) {
      setEditingProduct(null);
    }
  };

  // 4. Gmail User Permission Management
  const selectedUser = gmailUsers.find(u => u.email.toLowerCase() === selectedUserEmail.toLowerCase());

  const handleToggleUserItemAccess = (item: StoreProduct, shouldGrant: boolean, daysCount: number) => {
    if (!selectedUser) return;

    const updatedUsers = gmailUsers.map(user => {
      if (user.email.toLowerCase() !== selectedUser.email.toLowerCase()) return user;

      const currentItems = user.grantedItems ? [...user.grantedItems] : [];
      const existingIdx = currentItems.findIndex(g => g.itemId === item.id);

      if (shouldGrant) {
        const now = new Date();
        const expiry = new Date(now.getTime() + daysCount * 24 * 60 * 60 * 1000);
        const accessRecord: UserGrantedAccess = {
          id: `grant-${Date.now()}-${item.id}`,
          itemId: item.id,
          itemName: item.title,
          itemType: 'game',
          startDate: now.toISOString(),
          expiryDate: expiry.toISOString(),
          durationDays: daysCount,
          status: 'active',
          grantedByAdmin: true,
          activatedAt: now.toISOString()
        };

        if (existingIdx >= 0) {
          currentItems[existingIdx] = accessRecord;
        } else {
          currentItems.push(accessRecord);
        }
      } else {
        if (existingIdx >= 0) {
          currentItems.splice(existingIdx, 1);
        }
      }

      return {
        ...user,
        isSubscribed: currentItems.length > 0,
        grantedItems: currentItems
      };
    });

    setGmailUsers(updatedUsers);
    saveStoredGmailUsers(updatedUsers);
    showBanner(`تم تحديث صلاحية (${item.title}) للمستخدم: ${selectedUser.name || selectedUser.email}`);
  };

  const handleGrantAllItemsToUser = (daysCount: number) => {
    if (!selectedUser) return;

    const now = new Date();
    const expiry = new Date(now.getTime() + daysCount * 24 * 60 * 60 * 1000);

    const allGranted: UserGrantedAccess[] = products.map(p => ({
      id: `grant-all-${p.id}-${Date.now()}`,
      itemId: p.id,
      itemName: p.title,
      itemType: 'game',
      startDate: now.toISOString(),
      expiryDate: expiry.toISOString(),
      durationDays: daysCount,
      status: 'active',
      grantedByAdmin: true,
      activatedAt: now.toISOString()
    }));

    const updatedUsers = gmailUsers.map(user => {
      if (user.email.toLowerCase() !== selectedUser.email.toLowerCase()) return user;
      return {
        ...user,
        isSubscribed: true,
        grantedItems: allGranted
      };
    });

    setGmailUsers(updatedUsers);
    saveStoredGmailUsers(updatedUsers);
    confetti({ particleCount: 40, spread: 50 });
    showBanner(`تم تفعيل كافة المنتجات للمستخدم ${selectedUser.name} لمدة ${daysCount} يوم!`);
  };

  // 5. Save Store Settings, Overlay Avatar & Watermark
  const handleSaveSettings = () => {
    saveStoredSettings(localSettings);
    onRefreshData();
    showBanner('تم حفظ صورة الـ Overlay، العلامة المائية، وإعدادات المتجر بنجاح!');
  };

  // 6. Export ZIP Package
  const handleExportZip = async () => {
    showBanner('جاري تجميع وحزم ملفات المتجر والـ 3D والوسائط بصيغة AXA...', 'info');
    await exportUniversalStoreZip({
      categories,
      products,
      settings: localSettings,
      subscriptions,
      zipPassword: zipExportPassword
    });
    incrementStoreVersion();
    setCurrentVersion(getStoreVersion());
    showBanner('تم تصدير حزمة الـ ZIP التلقائية بنجاح!');
  };

  // Filtered lists
  const filteredModProducts = products.filter(p => {
    const matchesCategory = modFilterCategory === 'all' || p.category === modFilterCategory;
    const matchesSearch = !modSearchQuery.trim() || p.title.toLowerCase().includes(modSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeVideoPreviewUrl = quickVideoFileUrl || (uploadType === 'video' ? quickExternalUrl : '');

  // If not logged in, show Login Screen
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900 border border-white/15 shadow-2xl space-y-6 text-right">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-white">لوحة تحكم وإدارة المتجر</h2>
            <p className="text-xs text-slate-400">أدخل كلمة مرور الأدمن للوصول لقسم التحميلات والتعديلات وصورة الـ Overlay</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">كلمة المرور:</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="أدخل كلمة المرور..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-rose-500"
                autoFocus
              />
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-xs text-rose-400 font-bold bg-rose-950/50 p-3 rounded-xl border border-rose-500/30">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white shadow-xl shadow-rose-600/30 active:scale-95 transition-all"
            >
              دخول للوحة التحكم
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl">
      <div className="relative w-full max-w-6xl max-h-[94vh] flex flex-col rounded-3xl bg-slate-900 border border-white/20 shadow-2xl overflow-hidden">
        
        {/* Banner Notification */}
        {bannerMessage && (
          <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 border animate-in fade-in slide-in-from-top-4 duration-300 ${
            bannerMessage.type === 'error'
              ? 'bg-rose-950 text-rose-200 border-rose-500'
              : bannerMessage.type === 'info'
              ? 'bg-amber-950 text-amber-200 border-amber-500'
              : 'bg-emerald-950 text-emerald-200 border-emerald-500'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{bannerMessage.text}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-white/10 shrink-0 text-right">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white font-bold shadow-lg shadow-rose-600/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white">إدارة متجر Overlay Asmaro</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 border border-rose-500/40 text-rose-300">
                  {currentVersion}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">قسم الرفع السريع، الفيديوهات، صورة الـ Overlay، والتعديلات الشاملة</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportZip}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 transition-all"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>تصدير حزمة AXA ZIP</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950/60 border-b border-white/10 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('quick_upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
              activeTab === 'quick_upload'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Upload className="w-4 h-4 text-rose-300" />
            <span>رفع ونشر فوري (فيديوهات / ألعاب / سكربتات)</span>
          </button>

          <button
            onClick={() => setActiveTab('modifications')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
              activeTab === 'modifications'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-300" />
            <span>قسم التعديلات على العناصر ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('watermark')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
              activeTab === 'watermark'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Camera className="w-4 h-4 text-amber-400" />
            <span>صورة الـ Overlay والعلامة المائية والإعدادات</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Users className="w-4 h-4 text-cyan-300" />
            <span>مستخدمي Gmail وتفعيل الصلاحيات ({gmailUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('zip')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
              activeTab === 'zip'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <FolderArchive className="w-4 h-4 text-indigo-300" />
            <span>حزمة الـ ZIP والنسخ الاحتياطي</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-right">
          
          {/* ========================================================================= */}
          {/* TAB 1: QUICK UPLOAD CENTER */}
          {/* ========================================================================= */}
          {activeTab === 'quick_upload' && (
            <div className="max-w-3xl mx-auto space-y-6">
              
              <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-950 border border-rose-500/30 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Upload className="w-5 h-5 text-rose-400" />
                    <span>قسم التحميلات والرفع المباشر للمتجر</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    ارفع الفيديو أو اللعبة أو السكربت، حدد كود التفعيل والقسم، وسيتم عرضه فوراً بالمتجر وتشغيله.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-rose-600 text-white">
                  Direct Ingest
                </span>
              </div>

              <form onSubmit={handleQuickSaveProduct} className="p-6 rounded-3xl bg-slate-950/80 border border-white/10 space-y-5">
                
                {/* 1. Select Upload Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">نوع العنصر المراد رفعه:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setUploadType('video')}
                      className={`p-3 rounded-2xl border text-xs font-black flex flex-col items-center gap-1.5 transition-all ${
                        uploadType === 'video' ? 'bg-rose-600 text-white border-rose-400 shadow-lg' : 'bg-slate-900 text-slate-400 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <Film className="w-5 h-5" />
                      <span>فيديو (MP4 / YouTube)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUploadType('game')}
                      className={`p-3 rounded-2xl border text-xs font-black flex flex-col items-center gap-1.5 transition-all ${
                        uploadType === 'game' ? 'bg-rose-600 text-white border-rose-400 shadow-lg' : 'bg-slate-900 text-slate-400 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <Gamepad2 className="w-5 h-5" />
                      <span>لعبة أو مود تخريب</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUploadType('script')}
                      className={`p-3 rounded-2xl border text-xs font-black flex flex-col items-center gap-1.5 transition-all ${
                        uploadType === 'script' ? 'bg-rose-600 text-white border-rose-400 shadow-lg' : 'bg-slate-900 text-slate-400 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <Code2 className="w-5 h-5" />
                      <span>سكربت أو أداة LUA</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUploadType('alert')}
                      className={`p-3 rounded-2xl border text-xs font-black flex flex-col items-center gap-1.5 transition-all ${
                        uploadType === 'alert' ? 'bg-rose-600 text-white border-rose-400 shadow-lg' : 'bg-slate-900 text-slate-400 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <Sparkles className="w-5 h-5" />
                      <span>تنبيهات RTS أو زجاجية</span>
                    </button>
                  </div>
                </div>

                {/* 2. File / Video Upload Area */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      {uploadType === 'video' ? 'رفع ملف فيديو من الكمبيوتر أو إدخال رابطه:' : 'تحميل الملف من جهاز الكمبيوتر:'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">يدعم MP4, WebM, MOV, ZIP, Lua, 3D</span>
                  </div>

                  {uploadType === 'video' ? (
                    <div className="space-y-3">
                      {/* Hidden Video Input */}
                      <input
                        type="file"
                        ref={quickVideoInputRef}
                        onChange={handleQuickVideoUpload}
                        accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                        className="hidden"
                      />

                      <div
                        onClick={() => quickVideoInputRef.current?.click()}
                        className="p-5 rounded-2xl border-2 border-dashed border-rose-500/40 hover:border-rose-400 bg-slate-950/80 cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Film className="w-6 h-6" />
                        </div>
                        {quickVideoFileUrl ? (
                          <div className="text-center">
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-center">
                              <CheckCircle2 className="w-4 h-4" />
                              تم رفع ملف الفيديو بنجاح من الكمبيوتر!
                            </span>
                            <p className="text-[11px] text-slate-400 mt-0.5">اضغط لاختيار ملف فيديو آخر</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <span className="text-xs font-bold text-white">اضغط لاختيار ملف فيديو من الكمبيوتر (MP4 / WebM)</span>
                            <p className="text-[11px] text-slate-400 mt-0.5">يتم حفظه وتشغيله مباشرة داخل المتجر مع حماية العلامة المائية</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          أو أدخل رابط فيديو (YouTube, YouTube Shorts, MP4 مباشر, Vimeo, Google Drive):
                        </label>
                        <input
                          type="text"
                          value={quickExternalUrl}
                          onChange={(e) => setQuickExternalUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=... أو https://youtu.be/... أو https://.../video.mp4"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:outline-none focus:border-rose-500 font-mono"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="file"
                        ref={quickFileInputRef}
                        onChange={handleQuickFileChange}
                        className="hidden"
                      />

                      <div
                        onClick={() => quickFileInputRef.current?.click()}
                        className="p-5 rounded-2xl border-2 border-dashed border-rose-500/40 hover:border-rose-400 bg-slate-950/80 cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6" />
                        </div>
                        {quickFileSelected ? (
                          <div className="text-center">
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-center">
                              <CheckCircle2 className="w-4 h-4" />
                              {quickFileSelected.name}
                            </span>
                            <p className="text-[11px] text-slate-400 mt-0.5">الحجم: {quickFileSelected.size} - تم تحميله بنجاح</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <span className="text-xs font-bold text-white">اضغط لاختيار الملف من جهازك (PC)</span>
                            <p className="text-[11px] text-slate-500 mt-0.5">يتم حفظ الملف داخل البرنامج وتضمينه بالـ ZIP</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">أو أدخل رابط تحميل مباشر / MediaFire / Google Drive:</label>
                        <input
                          type="text"
                          value={quickExternalUrl}
                          onChange={(e) => setQuickExternalUrl(e.target.value)}
                          placeholder="https://mediafire.com/file/... أو https://..."
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Thumbnail Image Selection (Upload or URL) */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-300">الصورة المصغرة (Thumbnail / Poster):</label>
                      <button
                        type="button"
                        onClick={() => quickThumbnailInputRef.current?.click()}
                        className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>رفع صورة من الكمبيوتر</span>
                      </button>
                    </div>

                    <input
                      type="file"
                      ref={quickThumbnailInputRef}
                      onChange={handleQuickThumbnailUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={quickThumbnailUrl}
                        onChange={(e) => setQuickThumbnailUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/... أو ارفعها من جهازك"
                        className="flex-1 px-4 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:outline-none focus:border-rose-500"
                      />
                      {quickThumbnailUrl && (
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 shrink-0">
                          <img src={quickThumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Video Preview Box (If video URL or File is entered) */}
                  {activeVideoPreviewUrl && (
                    <div className="mt-3 p-3 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                        <EyeIcon className="w-4 h-4" />
                        <span>معاينة الفيديو المباشرة في المتجر:</span>
                      </div>
                      <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-black">
                        <VideoWithWatermark
                          videoUrl={activeVideoPreviewUrl}
                          thumbnailUrl={quickThumbnailUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800'}
                          title={quickTitle || 'معاينة الفيديو'}
                          settings={localSettings}
                          className="w-full h-full"
                        />
                      </div>
                    </div>
                  )}

                </div>

                {/* 3. Title & Category Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم / عنوان العنصر:</label>
                    <input
                      type="text"
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      placeholder="مثال: فيديو استعراض مودات GTA V أو تنبيه RTS"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none focus:border-rose-500"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-300">القسم / التصنيف:</label>
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(true)}
                        className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>+ إضافة قسم جديد</span>
                      </button>
                    </div>
                    <select
                      value={quickCategory}
                      onChange={(e) => setQuickCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none focus:border-rose-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Activation Code & Duration (Days) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">كود / رمز التفعيل لهذا العنصر:</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={quickActivationCode}
                        onChange={(e) => setQuickActivationCode(e.target.value)}
                        placeholder="مثال: ASMARO-VID-2026"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-amber-400 font-mono font-bold text-xs focus:outline-none focus:border-amber-400 uppercase"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const rand = Math.floor(1000 + Math.random() * 9000);
                          setQuickActivationCode(`ASMARO-${uploadType.toUpperCase()}-${rand}`);
                        }}
                        className="absolute left-2 top-2 px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-bold hover:bg-amber-500/30"
                      >
                        توليد كود
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">مدة الترخيص بالأيام:</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={quickDurationDays}
                      onChange={(e) => setQuickDurationDays(parseInt(e.target.value) || 30)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* 5. Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">الوصف المختصر:</label>
                  <input
                    type="text"
                    value={quickDescription}
                    onChange={(e) => setQuickDescription(e.target.value)}
                    placeholder="اكتب وصفاً مختصراً للمود أو اللعبة أو الفيديو..."
                    className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                {uploadType === 'script' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">كود السكربت (LUA / Python / JS):</label>
                    <textarea
                      rows={4}
                      value={quickScriptCode}
                      onChange={(e) => setQuickScriptCode(e.target.value)}
                      placeholder="-- اكتب كود السكربت هنا ليتم تنفيذه أو عرضه داخل المتصفح..."
                      className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-white/15 text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                )}

                {/* 6. Permissions switches */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-3">
                  <span className="text-xs font-bold text-slate-300">خيارات الصلاحية والتشغيل للمستخدم:</span>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={quickAllowBrowser}
                        onChange={(e) => setQuickAllowBrowser(e.target.checked)}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-0"
                      />
                      <span className="text-xs text-slate-200">السماح بالتشغيل عبر متصفح البرنامج الداخلي</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={quickAllowPCDownload}
                        onChange={(e) => setQuickAllowPCDownload(e.target.checked)}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-0"
                      />
                      <span className="text-xs text-slate-200">السماح بتحميل الملف للكمبيوتر</span>
                    </label>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isProcessingUpload}
                  className="w-full py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{isProcessingUpload ? 'جاري الحفظ والنشر...' : 'حفظ ونشر فوراً في المتجر'}</span>
                </button>

              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: MODIFICATIONS HUB */}
          {/* ========================================================================= */}
          {activeTab === 'modifications' && (
            <div className="space-y-6">
              
              {/* Header with Search and New Category Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-950/80 border border-white/10">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                    <span>قسم التعديلات الشاملة على عناصر المتجر</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    تعديل العناوين، الفيديوهات، الأقسام، الصور، والأكواد أو حذف أي عنصر مباشرة من المتجر.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsAddingCategory(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 flex items-center gap-1.5 transition-all whitespace-nowrap"
                  >
                    <FolderPlus className="w-4 h-4 text-rose-400" />
                    <span>إضافة قسم جديد</span>
                  </button>

                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      value={modSearchQuery}
                      onChange={(e) => setModSearchQuery(e.target.value)}
                      placeholder="بحث في العناصر..."
                      className="w-full pl-4 pr-10 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none focus:border-rose-500"
                    />
                    <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setModFilterCategory('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                    modFilterCategory === 'all'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  كافة العناصر ({products.length})
                </button>
                {categories.map((c) => {
                  const count = products.filter(p => p.category === c.id).length;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setModFilterCategory(c.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                        modFilterCategory === c.id
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      {c.title} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Products List & Modifiers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredModProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-white/10 flex flex-col justify-between space-y-3 hover:border-amber-500/40 transition-colors"
                  >
                    <div className="space-y-2.5">
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/5">
                        <img src={prod.thumbnailUrl} alt={prod.title} className="w-full h-full object-cover" />
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white shadow">
                          {prod.category}
                        </span>
                        {prod.videoUrl && (
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/80 text-cyan-300 backdrop-blur-md flex items-center gap-1">
                            <Film className="w-3 h-3" />
                            <span>فيديو</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-black text-white truncate">{prod.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{prod.shortDescription}</p>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(prod)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل العنصر أو الفيديو</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(prod.id, prod.title)}
                        className="py-1.5 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                        title="حذف العنصر نهائياً"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: OVERLAY IMAGE, WATERMARK & STORE SETTINGS */}
          {/* ========================================================================= */}
          {activeTab === 'watermark' && (
            <div className="max-w-3xl mx-auto space-y-6">
              
              {/* Overlay Image (Avatar Brand) Option Section */}
              <div className="p-6 rounded-3xl bg-slate-950 border border-amber-500/30 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white">صورة الـ Overlay (شعار المتجر الدائري المضيء)</h3>
                      <p className="text-xs text-slate-400">تغيير ورفع صورة الشعار التي تظهر في شريط الهيدر بجانب كلمة Overlay</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Overlay Avatar Logo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-center">
                  
                  {/* Live Avatar Preview with Glowing Flame Ring */}
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-black/60 border border-white/10 text-center space-y-2">
                    <span className="text-[11px] font-bold text-slate-300">المعاينة المباشرة:</span>
                    <div className="relative flex items-center justify-center w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-rose-600 via-amber-500 to-rose-500 shadow-xl shadow-rose-600/50">
                      <div className="w-full h-full rounded-full overflow-hidden bg-black border-2 border-white/20">
                        <img
                          src={localSettings.storeLogoAvatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'}
                          alt="Overlay Logo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-rose-600 flex items-center justify-center shadow-md animate-pulse">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400">Overlay Asmaro</span>
                  </div>

                  {/* Upload from PC or Link Controls */}
                  <div className="sm:col-span-2 space-y-3">
                    <input
                      type="file"
                      ref={overlayAvatarInputRef}
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const url = await readFileAsDataUrl(f);
                          setLocalSettings(prev => ({ ...prev, storeLogoAvatarUrl: url }));
                          showBanner('تم تحميل صورة الـ Overlay بنجاح من الكمبيوتر!');
                        }
                      }}
                      accept="image/*"
                      className="hidden"
                    />

                    <div>
                      <button
                        type="button"
                        onClick={() => overlayAvatarInputRef.current?.click()}
                        className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-amber-500/50 hover:border-amber-400 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 text-xs font-black flex items-center justify-center gap-2 transition-all"
                      >
                        <Camera className="w-4 h-4 text-amber-400" />
                        <span>رفع صورة الـ Overlay من جهاز الكمبيوتر</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">أو أدخل رابط صورة الشعار مباشرة:</label>
                      <input
                        type="text"
                        value={localSettings.storeLogoAvatarUrl || ''}
                        onChange={(e) => setLocalSettings(prev => ({ ...prev, storeLogoAvatarUrl: e.target.value }))}
                        placeholder="https://images.unsplash.com/... أو رابط الصورة"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* Watermark Overlay Settings */}
              <div className="p-6 rounded-3xl bg-slate-950 border border-white/10 space-y-5">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>العلامة المائية الشفافة بكامل الشاشة وإعدادات التواصل</span>
                </h3>

                {/* Watermark Image Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">صورة العلامة المائية الشفافة (تغطي الفيديو بالكامل لمنع السرقة):</label>
                  <input
                    type="file"
                    ref={watermarkInputRef}
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const url = await readFileAsDataUrl(f);
                        setLocalSettings(prev => ({ ...prev, watermarkLogoUrl: url }));
                        showBanner('تم تحميل صورة العلامة المائية من الكمبيوتر');
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  <div
                    onClick={() => watermarkInputRef.current?.click()}
                    className="p-4 rounded-2xl border border-dashed border-white/20 hover:border-emerald-500 bg-slate-900 cursor-pointer flex items-center gap-3"
                  >
                    <img
                      src={localSettings.watermarkLogoUrl}
                      alt="Watermark"
                      className="w-16 h-12 object-cover rounded-lg border border-white/20"
                    />
                    <div>
                      <span className="text-xs font-bold text-white">اضغط لتغيير صورة العلامة المائية من جهازك</span>
                      <p className="text-[11px] text-slate-400">تظهر بشفافية فوق جميع الفيديوهات بدون نصوص إضافية</p>
                    </div>
                  </div>
                </div>

                {/* Opacity Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5">
                    <span>نسبة شفافية العلامة المائية:</span>
                    <span className="font-mono text-emerald-400 font-bold">{Math.round(localSettings.watermarkOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={localSettings.watermarkOpacity}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, watermarkOpacity: parseFloat(e.target.value) }))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                {/* Social & Contact Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">رقم الواتساب:</label>
                    <input
                      type="text"
                      value={localSettings.whatsappNumber}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                      placeholder="76774306"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">رابط تيك توك الرسمي:</label>
                    <input
                      type="text"
                      value={localSettings.tiktokUrl || ''}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, tiktokUrl: e.target.value }))}
                      placeholder="https://tiktok.com/@overlay.asmaro"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">رابط Wish Money:</label>
                    <input
                      type="text"
                      value={localSettings.wishMoneyUrl || ''}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, wishMoneyUrl: e.target.value }))}
                      placeholder="https://wishmoney.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">اسم المتجر الرسمي:</label>
                    <input
                      type="text"
                      value={localSettings.storeName}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, storeName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Online Guard Requirement Toggle */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">إلزامية الاتصال بالإنترنت (Online Guard):</span>
                    <p className="text-[11px] text-slate-400">يمنع تشغيل البرنامج إذا انقطع الاتصال</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.requireInternetConnection !== false}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, requireInternetConnection: e.target.checked }))}
                    className="w-5 h-5 rounded text-rose-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="w-full py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white shadow-xl shadow-emerald-950/60 active:scale-95 transition-all"
                >
                  حفظ صورة الـ Overlay والعلامة المائية والإعدادات
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: GMAIL USERS & GRANULAR ACCESS */}
          {/* ========================================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              
              {/* Header & User Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-950/80 border border-white/10">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    <span>إدارة مستخدمي Gmail وتفعيل الصلاحيات المباشرة</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    يمكنك تفعيل فيديو أو لعبة واحدة محددة فقط للشخص من بين مئات الفيديوهات مع تحديد مدة الصلاحية بالأيام.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="بحث عن مستخدم..."
                      className="w-full pl-4 pr-10 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                    <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>

              {gmailUsers.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-950 border border-white/10 text-center space-y-2">
                  <Mail className="w-8 h-8 text-slate-500 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-300">لم يسجل أي مستخدم دخوله بعد عبر Gmail</h4>
                  <p className="text-xs text-slate-500">عندما يقوم أي مستخدم بتسجيل الدخول من الزر العلوي سيظهر في هذه القائمة فوراً</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Users list column */}
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {gmailUsers
                      .filter(u => !userSearchQuery || u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) || (u.name && u.name.toLowerCase().includes(userSearchQuery.toLowerCase())))
                      .map((u) => {
                        const isSelected = selectedUserEmail.toLowerCase() === u.email.toLowerCase();
                        const activeCount = u.grantedItems ? u.grantedItems.filter(g => g.status === 'active').length : 0;

                        return (
                          <div
                            key={u.id}
                            onClick={() => setSelectedUserEmail(u.email)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-lg'
                                : 'bg-slate-950 border-white/10 text-slate-300 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-cyan-600/20 border border-cyan-400/40 flex items-center justify-center font-bold text-cyan-300">
                                {u.picture ? (
                                  <img src={u.picture} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  u.email.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <div>
                                <h4 className="text-xs font-black">{u.name || u.email.split('@')[0]}</h4>
                                <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                              </div>
                            </div>

                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/50 border border-white/10">
                              {activeCount} عناصر مفعلة
                            </span>
                          </div>
                        );
                      })}
                  </div>

                  {/* Selected user details & grant controls */}
                  <div className="lg:col-span-2 space-y-4">
                    {selectedUser ? (
                      <div className="p-5 rounded-3xl bg-slate-950 border border-white/10 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                          <div>
                            <h4 className="text-sm font-black text-white">{selectedUser.name || selectedUser.email}</h4>
                            <p className="text-xs text-cyan-400 font-mono">{selectedUser.email}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              max={365}
                              value={userGlobalDuration}
                              onChange={(e) => setUserGlobalDuration(parseInt(e.target.value) || 30)}
                              className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-white/20 text-xs font-mono text-center text-white"
                              title="مدة الأيام"
                            />
                            <button
                              type="button"
                              onClick={() => handleGrantAllItemsToUser(userGlobalDuration)}
                              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black transition-all shadow-md"
                            >
                              تفعيل كافة العناصر ({userGlobalDuration} يوم)
                            </button>
                          </div>
                        </div>

                        {/* Category filter for items */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                          <button
                            onClick={() => setUserItemsCategoryFilter('all')}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold ${
                              userItemsCategoryFilter === 'all' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400'
                            }`}
                          >
                            الكل
                          </button>
                          {categories.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => setUserItemsCategoryFilter(c.id)}
                              className={`px-3 py-1 rounded-lg text-[11px] font-bold ${
                                userItemsCategoryFilter === c.id ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400'
                              }`}
                            >
                              {c.title}
                            </button>
                          ))}
                        </div>

                        {/* Items list with Grant / Revoke toggles */}
                        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                          {products
                            .filter(p => userItemsCategoryFilter === 'all' || p.category === userItemsCategoryFilter)
                            .map((item) => {
                              const isGranted = selectedUser.grantedItems?.some(g => g.itemId === item.id && g.status === 'active');
                              const grantObj = selectedUser.grantedItems?.find(g => g.itemId === item.id);

                              return (
                                <div
                                  key={item.id}
                                  className="p-3 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-3">
                                    <img src={item.thumbnailUrl} alt="" className="w-12 h-8 rounded-lg object-cover" />
                                    <div>
                                      <h5 className="text-xs font-black text-white">{item.title}</h5>
                                      <p className="text-[10px] text-slate-400">{item.category}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {isGranted ? (
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-emerald-400">مفعل</span>
                                        <button
                                          type="button"
                                          onClick={() => handleToggleUserItemAccess(item, false, userGlobalDuration)}
                                          className="px-3 py-1 rounded-xl bg-rose-950 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-900"
                                        >
                                          إلغاء
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleUserItemAccess(item, true, userGlobalDuration)}
                                        className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                                      >
                                        تفعيل ({userGlobalDuration} يوم)
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 rounded-2xl bg-slate-950 border border-white/10 text-center text-slate-400 text-xs">
                        اختر مستخدماً من القائمة لإدارة صلاحياته
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: UNIVERSAL ZIP AXA EXPORT */}
          {/* ========================================================================= */}
          {activeTab === 'zip' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="p-6 rounded-3xl bg-slate-950 border border-white/10 space-y-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
                  <FolderArchive className="w-7 h-7" />
                </div>

                <h3 className="text-base font-black text-white">تصدير حزمة الـ ZIP الشاملة بصيغة AXA</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  تقوم هذه الأداة بحزم جميع الألعاب، الفيديوهات، السكربتات، ملفات الـ 3D، وصورة الـ Overlay بصيغة AXA المحدثة تلقائياً.
                </p>

                <div className="max-w-xs mx-auto text-right">
                  <label className="block text-xs font-bold text-slate-300 mb-1">كلمة مرور لحماية ملف الـ ZIP (اختياري):</label>
                  <input
                    type="password"
                    value={zipExportPassword}
                    onChange={(e) => setZipExportPassword(e.target.value)}
                    placeholder="اتركه فارغاً إن لم ترغب بكلمة سر"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white text-center font-mono"
                  />
                </div>

                <button
                  onClick={handleExportZip}
                  className="w-full py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-xl shadow-amber-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير حزمة الـ ZIP المتكاملة الآن ({currentVersion})</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ========================================================================= */}
      {/* EDIT PRODUCT MODAL */}
      {/* ========================================================================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-xl">
          <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-white/20 shadow-2xl overflow-hidden text-right">
            
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm sm:text-base font-black text-white">تعديل: {editingProduct.title}</h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">اسم / عنوان العنصر:</label>
                  <input
                    type="text"
                    value={editingProduct.title}
                    onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">القسم / التصنيف:</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الوصف المختصر:</label>
                <input
                  type="text"
                  value={editingProduct.shortDescription}
                  onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الوصف الكامل:</label>
                <textarea
                  rows={3}
                  value={editingProduct.fullDescription}
                  onChange={(e) => setEditingProduct({ ...editingProduct, fullDescription: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                />
              </div>

              {/* Video & Media Management for this Product */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Film className="w-4 h-4" />
                    <span>رابط أو ملف الفيديو (MP4, YouTube, WebM):</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => editVideoInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>رفع فيديو من الكمبيوتر</span>
                  </button>
                </div>

                <input
                  type="file"
                  ref={editVideoInputRef}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const url = await readFileAsDataUrl(f);
                      setEditingProduct({ ...editingProduct, videoUrl: url });
                      showBanner(`تم تحميل ملف الفيديو من الكمبيوتر بنجاح: ${f.name}`);
                    }
                  }}
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                  className="hidden"
                />

                <input
                  type="text"
                  value={editingProduct.videoUrl || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... أو رابط مباشر MP4"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white font-mono"
                />

                {/* Live Edit Video Preview */}
                {editingProduct.videoUrl && (
                  <div className="mt-2 aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-black">
                    <VideoWithWatermark
                      videoUrl={editingProduct.videoUrl}
                      thumbnailUrl={editingProduct.thumbnailUrl}
                      title={editingProduct.title}
                      settings={localSettings}
                      className="w-full h-full"
                    />
                  </div>
                )}
              </div>

              {/* Thumbnail & File Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-300">صورة الغلاف (Thumbnail):</label>
                    <button
                      type="button"
                      onClick={() => editThumbnailInputRef.current?.click()}
                      className="text-[11px] font-bold text-amber-400 hover:text-amber-300"
                    >
                      رفع صورة من الكمبيوتر
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={editThumbnailInputRef}
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const url = await readFileAsDataUrl(f);
                        setEditingProduct({ ...editingProduct, thumbnailUrl: url });
                        showBanner(`تم تحميل الصورة المصغرة بنجاح: ${f.name}`);
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                  />

                  <input
                    type="text"
                    value={editingProduct.thumbnailUrl}
                    onChange={(e) => setEditingProduct({ ...editingProduct, thumbnailUrl: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">حجم الملف المعروض:</label>
                  <input
                    type="text"
                    value={editingProduct.fileSize || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, fileSize: e.target.value })}
                    placeholder="مثال: 45 MB"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                  />
                </div>
              </div>

              {/* Download URL */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">رابط التحميل المباشر للعبة أو الحزمة:</label>
                <input
                  type="text"
                  value={editingProduct.largeDownloadUrl || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, largeDownloadUrl: e.target.value })}
                  placeholder="https://mediafire.com/... أو رابط مباشر"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                />
              </div>

              {/* Script code */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">كود السكربت (إن وجد):</label>
                <textarea
                  rows={3}
                  value={editingProduct.scriptCode || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, scriptCode: e.target.value })}
                  placeholder="-- كود السكربت أو الأداة..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-emerald-400 font-mono text-xs"
                />
              </div>

              {/* Switches */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.allowInAppBrowser !== false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, allowInAppBrowser: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                  <span className="text-xs text-slate-200">السماح بالتشغيل داخل متصفح البرنامج</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.allowPCDownload !== false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, allowPCDownload: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                  <span className="text-xs text-slate-200">السماح بتحميل الملف للكمبيوتر</span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ التعديلات في المتجر</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD CATEGORY MODAL */}
      {/* ========================================================================= */}
      {isAddingCategory && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-white/20 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-rose-400" />
                <span>إضافة قسم / تصنيف جديد للمتجر</span>
              </h3>
              <button onClick={() => setIsAddingCategory(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم القسم:</label>
                <input
                  type="text"
                  value={newCategoryTitle}
                  onChange={(e) => setNewCategoryTitle(e.target.value)}
                  placeholder="مثال: قسم شاشات البث المباشر"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">وصف القسم:</label>
                <input
                  type="text"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="وصف مختصر للقسم..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">صورة الغلاف للقسم:</label>
                <input
                  type="text"
                  value={newCategoryCover}
                  onChange={(e) => setNewCategoryCover(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg transition-all"
              >
                إضافة القسم الآن
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
