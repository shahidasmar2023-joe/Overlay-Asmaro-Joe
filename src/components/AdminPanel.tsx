import React, { useState } from 'react';
import {
  X,
  Settings,
  Film,
  Gamepad2,
  Layers,
  Save,
  Trash2,
  Edit,
  Download,
  Upload,
  KeyRound,
  FileCode,
  ShieldCheck,
  FolderPlus,
  Palette,
  Image as ImageIcon,
  Sparkles,
  Flame,
  Crown,
  Shield,
  Zap,
  Star,
  Gem,
  Heart,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { Category, StoreItem, StoreConfig, StoreData, StoreIconConfig } from '../types';
import { VoiceInputButton } from './VoiceInputButton';
import { AudioRecorderModal } from './AudioRecorderModal';
import { renderDynamicIcon } from './Header';
import { putMediaBlob, deleteMediaBlob, sanitizeFileName } from '../lib/db';
import {
  exportFullStoreZip,
  exportStandaloneHtml,
  exportJsonBackup,
  importStoreZip,
} from '../lib/exportUtils';
import { DEFAULT_STORE_LOGO_SVG } from '../lib/defaultData';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeData: StoreData;
  onUpdateStoreData: (newData: StoreData) => void;
}

type AdminTab =
  | 'store-branding'
  | 'add-game'
  | 'add-video'
  | 'categories'
  | 'manage-items'
  | 'backup-export'
  | 'security';

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  storeData,
  onUpdateStoreData,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('store-branding');

  // Audio Studio Modal
  const [isAudioStudioOpen, setIsAudioStudioOpen] = useState(false);
  const [audioTargetField, setAudioTargetField] = useState<string | null>(null);

  // Store Image & Icon Customization State
  const [storeLogoUrl, setStoreLogoUrl] = useState(storeData.config.storeLogoUrl || '');
  const [storeLogoFile, setStoreLogoFile] = useState<File | null>(null);
  const [storeLogoWidth, setStoreLogoWidth] = useState(storeData.config.storeLogoWidth || 280);
  const [storeLogoBorderRadius, setStoreLogoBorderRadius] = useState(
    storeData.config.storeLogoBorderRadius || 12
  );
  const [iconConfig, setIconConfig] = useState<StoreIconConfig>(
    storeData.config.iconConfig || {
      iconName: 'Sparkles',
      primaryColor: '#f43f5e',
      secondaryColor: '#3b82f6',
      glowColor: '#eab308',
      borderColor: 'rgba(255,255,255,0.2)',
      bgGradientFrom: '#0f172a',
      bgGradientTo: '#020617',
      size: 46,
    }
  );

  // Category editing state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('Gamepad2');
  const [catBadgeColor, setCatBadgeColor] = useState<Category['badgeColor']>('red');
  const [catBannerUrl, setCatBannerUrl] = useState('');
  const [catBannerFile, setCatBannerFile] = useState<File | null>(null);

  // Game/Script editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [gameTitle, setGameTitle] = useState('');
  const [gameDesc, setGameDesc] = useState('');
  const [gamePrice, setGamePrice] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [gameCatId, setGameCatId] = useState('');
  const [gameImageUrl, setGameImageUrl] = useState('');
  const [gameImageFile, setGameImageFile] = useState<File | null>(null);
  const [gameScriptFile, setGameScriptFile] = useState<File | null>(null);
  const [gameScriptText, setGameScriptText] = useState('');
  const [gameAudioBlob, setGameAudioBlob] = useState<Blob | null>(null);
  const [gameAudioUrl, setGameAudioUrl] = useState<string | null>(null);

  // Video/Alert editing state
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoPrice, setVideoPrice] = useState('');
  const [videoCode, setVideoCode] = useState('');
  const [videoCatId, setVideoCatId] = useState('');
  const [videoOverlayText, setVideoOverlayText] = useState('Play Joe Gaming');
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [videoPreviewFile, setVideoPreviewFile] = useState<File | null>(null);
  const [videoDownloadUrl, setVideoDownloadUrl] = useState('');
  const [videoDownloadFile, setVideoDownloadFile] = useState<File | null>(null);
  const [videoScriptFile, setVideoScriptFile] = useState<File | null>(null);
  const [videoScriptText, setVideoScriptText] = useState('');

  // Security / Settings state
  const [newAdminPass, setNewAdminPass] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState(storeData.config.whatsappNumber);
  const [wishMoneyPhone, setWishMoneyPhone] = useState(storeData.config.wishMoneyNumber);
  const [storeNameInput, setStoreNameInput] = useState(storeData.config.storeName);
  const [storeSubtitleInput, setStoreSubtitleInput] = useState(storeData.config.storeSubtitle);

  // Export progress status
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [exportPercent, setExportPercent] = useState<number>(0);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Login Check
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === storeData.config.adminPasswordHash) {
      setIsAuthenticated(true);
      setAuthError(false);
      setPasswordInput('');
    } else {
      setAuthError(true);
    }
  };

  // Preset Color Palettes for the Store Icon
  const colorPresets = [
    {
      name: 'ذهبي ملكي (Luxury Gold)',
      primary: '#fbbf24',
      secondary: '#ca8a04',
      glow: '#f59e0b',
      from: '#1e1b18',
      to: '#0a0a08',
    },
    {
      name: 'أحمر ناري (Cyber Crimson)',
      primary: '#f43f5e',
      secondary: '#be123c',
      glow: '#f43f5e',
      from: '#1f1015',
      to: '#0a0507',
    },
    {
      name: 'أزرق سماوي (Neon Azure)',
      primary: '#38bdf8',
      secondary: '#2563eb',
      glow: '#38bdf8',
      from: '#0e1726',
      to: '#030712',
    },
    {
      name: 'أخضر زمردي (Emerald Matrix)',
      primary: '#34d399',
      secondary: '#059669',
      glow: '#10b981',
      from: '#062419',
      to: '#020d09',
    },
    {
      name: 'بنفسجي ملكي (Royal Violet)',
      primary: '#c084fc',
      secondary: '#7e22ce',
      glow: '#a855f7',
      from: '#1e102e',
      to: '#0b0412',
    },
    {
      name: 'غروب ناري (Sunset Flame)',
      primary: '#fb923c',
      secondary: '#e11d48',
      glow: '#f97316',
      from: '#26140e',
      to: '#0c0503',
    },
  ];

  // Save Store Icon and Image Customization
  const handleSaveStoreBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalLogoUrl = storeLogoUrl;
    let logoKey = storeData.config.storeLogoKey;

    if (storeLogoFile) {
      logoKey = `store_logo_${Date.now()}_${sanitizeFileName(storeLogoFile.name)}`;
      await putMediaBlob(logoKey, storeLogoFile, storeLogoFile.name);
      finalLogoUrl = URL.createObjectURL(storeLogoFile);
    }

    const updatedConfig: StoreConfig = {
      ...storeData.config,
      storeLogoUrl: finalLogoUrl || DEFAULT_STORE_LOGO_SVG,
      storeLogoKey: logoKey,
      storeLogoWidth,
      storeLogoBorderRadius,
      iconConfig,
    };

    onUpdateStoreData({ ...storeData, config: updatedConfig });
    alert('✅ تم حفظ صورة المتجر وتخصيص الأيقونة والألوان بنجاح!');
  };

  // Reset Store Logo Image to Default
  const handleResetToDefaultLogo = () => {
    setStoreLogoUrl(DEFAULT_STORE_LOGO_SVG);
    setStoreLogoFile(null);
    setStoreLogoWidth(280);
    setStoreLogoBorderRadius(12);
  };

  // Reset form states
  const resetGameForm = () => {
    setEditingItemId(null);
    setGameTitle('');
    setGameDesc('');
    setGamePrice('');
    setGameCode('');
    setGameCatId(storeData.categories[0]?.id || 'cat-games');
    setGameImageUrl('');
    setGameImageFile(null);
    setGameScriptFile(null);
    setGameScriptText('');
    setGameAudioBlob(null);
    setGameAudioUrl(null);
  };

  const resetVideoForm = () => {
    setEditingItemId(null);
    setVideoTitle('');
    setVideoDesc('');
    setVideoPrice('');
    setVideoCode('');
    setVideoCatId(
      storeData.categories.find((c) => c.id === 'cat-alerts')?.id || storeData.categories[0]?.id || ''
    );
    setVideoOverlayText(storeData.config.defaultOverlayText || 'Play Joe Gaming');
    setVideoPreviewUrl('');
    setVideoPreviewFile(null);
    setVideoDownloadUrl('');
    setVideoDownloadFile(null);
    setVideoScriptFile(null);
    setVideoScriptText('');
  };

  const resetCatForm = () => {
    setEditingCatId(null);
    setCatName('');
    setCatDesc('');
    setCatIcon('Gamepad2');
    setCatBadgeColor('red');
    setCatBannerUrl('');
    setCatBannerFile(null);
  };

  // Save Game / Script
  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameTitle.trim()) {
      alert('يرجى إدخال اسم اللعبة أو السكربت!');
      return;
    }

    const itemId = editingItemId || `game-${Date.now()}`;
    const targetCatId = gameCatId || storeData.categories[0]?.id || 'cat-games';

    let imageKey = '';
    let scriptKey = '';
    let scriptFileName = '';
    let audioKey = '';

    const existingItem = storeData.items.find((i) => i.id === itemId);

    // Save image
    if (gameImageFile) {
      imageKey = `image_${itemId}_${Date.now()}_${sanitizeFileName(gameImageFile.name)}`;
      await putMediaBlob(imageKey, gameImageFile, gameImageFile.name);
      if (existingItem?.imageKey) await deleteMediaBlob(existingItem.imageKey);
    } else if (existingItem?.imageKey) {
      imageKey = existingItem.imageKey;
    }

    // Save audio note if recorded
    if (gameAudioBlob) {
      audioKey = `audio_${itemId}_${Date.now()}.webm`;
      await putMediaBlob(audioKey, gameAudioBlob, `${sanitizeFileName(gameTitle)}_audio.webm`);
      if (existingItem?.audioKey) await deleteMediaBlob(existingItem.audioKey);
    } else if (existingItem?.audioKey) {
      audioKey = existingItem.audioKey;
    }

    // Save script file or raw text
    if (gameScriptFile) {
      scriptKey = `script_${itemId}_${Date.now()}_${sanitizeFileName(gameScriptFile.name)}`;
      scriptFileName = gameScriptFile.name;
      await putMediaBlob(scriptKey, gameScriptFile, gameScriptFile.name);
      if (existingItem?.scriptKey) await deleteMediaBlob(existingItem.scriptKey);
    } else if (gameScriptText.trim()) {
      const textBlob = new Blob([gameScriptText], { type: 'text/plain;charset=utf-8' });
      scriptKey = `script_${itemId}_${Date.now()}_script.txt`;
      scriptFileName = `${sanitizeFileName(gameTitle)}_script.txt`;
      await putMediaBlob(scriptKey, textBlob, scriptFileName);
    } else if (existingItem?.scriptKey) {
      scriptKey = existingItem.scriptKey;
      scriptFileName = existingItem.scriptFileName || '';
    }

    const updatedItem: StoreItem = {
      id: itemId,
      categoryId: targetCatId,
      type: 'game',
      title: gameTitle.trim(),
      description: gameDesc.trim(),
      price: gamePrice.trim() || 'مجاني',
      activationCode: gameCode.trim(),
      image: gameImageUrl.trim(),
      imageKey: imageKey || undefined,
      audioKey: audioKey || undefined,
      scriptKey: scriptKey || undefined,
      scriptFileName: scriptFileName || undefined,
      scriptData: gameScriptText.trim() || undefined,
      downloadsCount: existingItem?.downloadsCount || 0,
      viewsCount: existingItem?.viewsCount || 0,
      createdAt: existingItem?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    let updatedItems = [...storeData.items];
    if (editingItemId) {
      updatedItems = updatedItems.map((i) => (i.id === editingItemId ? updatedItem : i));
    } else {
      updatedItems.unshift(updatedItem);
    }

    const newData: StoreData = { ...storeData, items: updatedItems };
    onUpdateStoreData(newData);
    resetGameForm();
    alert('✅ تم حفظ اللعبة وتحديث المتجر بنجاح!');
  };

  // Save Video / Alert
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim()) {
      alert('يرجى إدخال عنوان الـ Alert أو الفيديو!');
      return;
    }

    const itemId = editingItemId || `video-${Date.now()}`;
    const targetCatId =
      videoCatId ||
      storeData.categories.find((c) => c.id === 'cat-alerts')?.id ||
      storeData.categories[0]?.id ||
      'cat-alerts';

    let previewKey = '';
    let downloadKey = '';
    let scriptKey = '';
    let scriptFileName = '';

    const existingItem = storeData.items.find((i) => i.id === itemId);

    // Save Preview Video
    if (videoPreviewFile) {
      previewKey = `preview_${itemId}_${Date.now()}_${sanitizeFileName(videoPreviewFile.name)}`;
      await putMediaBlob(previewKey, videoPreviewFile, videoPreviewFile.name);
      if (existingItem?.previewVideoKey) await deleteMediaBlob(existingItem.previewVideoKey);
    } else if (existingItem?.previewVideoKey) {
      previewKey = existingItem.previewVideoKey;
    }

    // Save Downloadable HQ Video
    if (videoDownloadFile) {
      downloadKey = `download_${itemId}_${Date.now()}_${sanitizeFileName(videoDownloadFile.name)}`;
      await putMediaBlob(downloadKey, videoDownloadFile, videoDownloadFile.name);
      if (existingItem?.downloadVideoKey) await deleteMediaBlob(existingItem.downloadVideoKey);
    } else if (existingItem?.downloadVideoKey) {
      downloadKey = existingItem.downloadVideoKey;
    }

    // Save script / attachment
    if (videoScriptFile) {
      scriptKey = `script_${itemId}_${Date.now()}_${sanitizeFileName(videoScriptFile.name)}`;
      scriptFileName = videoScriptFile.name;
      await putMediaBlob(scriptKey, videoScriptFile, videoScriptFile.name);
      if (existingItem?.scriptKey) await deleteMediaBlob(existingItem.scriptKey);
    } else if (videoScriptText.trim()) {
      const textBlob = new Blob([videoScriptText], { type: 'text/plain;charset=utf-8' });
      scriptKey = `script_${itemId}_${Date.now()}_script.txt`;
      scriptFileName = `${sanitizeFileName(videoTitle)}_script.txt`;
      await putMediaBlob(scriptKey, textBlob, scriptFileName);
    } else if (existingItem?.scriptKey) {
      scriptKey = existingItem.scriptKey;
      scriptFileName = existingItem.scriptFileName || '';
    }

    const updatedItem: StoreItem = {
      id: itemId,
      categoryId: targetCatId,
      type: 'video',
      title: videoTitle.trim(),
      description: videoDesc.trim() || 'تنبيه فيديو عالي الجودة مع مؤثرات حصرية',
      price: videoPrice.trim() || 'مجاني',
      activationCode: videoCode.trim(),
      overlayText: videoOverlayText.trim() || 'Play Joe Gaming',
      previewVideoUrl: videoPreviewUrl.trim(),
      previewVideoKey: previewKey || undefined,
      downloadVideoUrl: videoDownloadUrl.trim(),
      downloadVideoKey: downloadKey || undefined,
      scriptKey: scriptKey || undefined,
      scriptFileName: scriptFileName || undefined,
      scriptData: videoScriptText.trim() || undefined,
      downloadsCount: existingItem?.downloadsCount || 0,
      viewsCount: existingItem?.viewsCount || 0,
      createdAt: existingItem?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    let updatedItems = [...storeData.items];
    if (editingItemId) {
      updatedItems = updatedItems.map((i) => (i.id === editingItemId ? updatedItem : i));
    } else {
      updatedItems.unshift(updatedItem);
    }

    const newData: StoreData = { ...storeData, items: updatedItems };
    onUpdateStoreData(newData);
    resetVideoForm();
    alert('✅ تم حفظ الـ Alert وفيديو العرض بنجاح!');
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      alert('يرجى كتابة اسم القسم!');
      return;
    }

    const catId = editingCatId || `cat-${Date.now()}`;
    let bannerKey = '';
    const existingCat = storeData.categories.find((c) => c.id === catId);

    if (catBannerFile) {
      bannerKey = `banner_${catId}_${Date.now()}_${sanitizeFileName(catBannerFile.name)}`;
      await putMediaBlob(bannerKey, catBannerFile, catBannerFile.name);
      if (existingCat?.bannerKey) await deleteMediaBlob(existingCat.bannerKey);
    } else if (existingCat?.bannerKey) {
      bannerKey = existingCat.bannerKey;
    }

    const newCat: Category = {
      id: catId,
      name: catName.trim(),
      description: catDesc.trim(),
      icon: catIcon,
      badgeColor: catBadgeColor,
      bannerUrl: catBannerUrl.trim(),
      bannerKey: bannerKey || undefined,
      order: existingCat?.order || storeData.categories.length + 1,
    };

    let updatedCats = [...storeData.categories];
    if (editingCatId) {
      updatedCats = updatedCats.map((c) => (c.id === editingCatId ? newCat : c));
    } else {
      updatedCats.push(newCat);
    }

    const newData: StoreData = { ...storeData, categories: updatedCats };
    onUpdateStoreData(newData);
    resetCatForm();
    alert('✅ تم حفظ القسم وإضافته إلى المتجر بنجاح!');
  };

  // Delete Category
  const handleDeleteCategory = async (id: string) => {
    if (storeData.categories.length <= 1) {
      alert('يجب الإبقاء على قسم واحد على الأقل في المتجر!');
      return;
    }
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم نقل جميع عناصره إلى القسم الأول.')) return;

    const remainingCats = storeData.categories.filter((c) => c.id !== id);
    const fallbackCatId = remainingCats[0].id;
    const updatedItems = storeData.items.map((i) =>
      i.categoryId === id ? { ...i, categoryId: fallbackCatId } : i
    );

    const targetCat = storeData.categories.find((c) => c.id === id);
    if (targetCat?.bannerKey) await deleteMediaBlob(targetCat.bannerKey);

    const newData: StoreData = {
      ...storeData,
      categories: remainingCats,
      items: updatedItems,
    };
    onUpdateStoreData(newData);
  };

  // Delete Item
  const handleDeleteItem = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر نهائياً؟')) return;
    const item = storeData.items.find((i) => i.id === id);
    if (item) {
      if (item.imageKey) await deleteMediaBlob(item.imageKey);
      if (item.previewVideoKey) await deleteMediaBlob(item.previewVideoKey);
      if (item.downloadVideoKey) await deleteMediaBlob(item.downloadVideoKey);
      if (item.scriptKey) await deleteMediaBlob(item.scriptKey);
      if (item.audioKey) await deleteMediaBlob(item.audioKey);
    }

    const updatedItems = storeData.items.filter((i) => i.id !== id);
    const newData: StoreData = { ...storeData, items: updatedItems };
    onUpdateStoreData(newData);
  };

  // Edit Item Trigger
  const handleEditItem = (item: StoreItem) => {
    setEditingItemId(item.id);
    if (item.type === 'video') {
      setVideoTitle(item.title);
      setVideoDesc(item.description || '');
      setVideoPrice(item.price || '');
      setVideoCode(item.activationCode || '');
      setVideoCatId(item.categoryId);
      setVideoOverlayText(item.overlayText || 'Play Joe Gaming');
      setVideoPreviewUrl(item.previewVideoUrl || '');
      setVideoDownloadUrl(item.downloadVideoUrl || '');
      setVideoScriptText(item.scriptData || '');
      setActiveTab('add-video');
    } else {
      setGameTitle(item.title);
      setGameDesc(item.description || '');
      setGamePrice(item.price || '');
      setGameCode(item.activationCode || '');
      setGameCatId(item.categoryId);
      setGameImageUrl(item.image || '');
      setGameScriptText(item.scriptData || '');
      setActiveTab('add-game');
    }
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: StoreConfig = {
      ...storeData.config,
      storeName: storeNameInput.trim() || 'Overlay Asmaro',
      storeSubtitle: storeSubtitleInput.trim(),
      whatsappNumber: whatsappPhone.trim() || '76774306',
      wishMoneyNumber: wishMoneyPhone.trim() || '76774306',
      adminPasswordHash: newAdminPass.trim() || storeData.config.adminPasswordHash,
    };

    onUpdateStoreData({ ...storeData, config: newConfig });
    setNewAdminPass('');
    alert('✅ تم تحديث إعدادات الأمان والتواصل بنجاح!');
  };

  // Export handlers
  const handleExportZip = async () => {
    setExportStatus('جاري تجهيز الحزمة...');
    try {
      await exportFullStoreZip(storeData, (percent, status) => {
        setExportPercent(percent);
        setExportStatus(status);
      });
      setTimeout(() => {
        setExportStatus(null);
      }, 3000);
    } catch (err: any) {
      alert('فشل التصدير: ' + err.message);
      setExportStatus(null);
    }
  };

  const handleImportZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus('جاري استيراد الحزمة...');
    try {
      const imported = await importStoreZip(file, (_percent, status) => {
        setImportStatus(status);
      });
      onUpdateStoreData(imported);
      alert('✅ تم استيراد حزمة المتجر وتحديث كافة الملفات بنجاح!');
      setImportStatus(null);
    } catch (err: any) {
      alert('فشل الاستيراد: ' + err.message);
      setImportStatus(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto animate-fade-in text-right"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#0a0d14]/95 border border-white/15 backdrop-blur-2xl rounded-3xl p-5 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95)] max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-4 top-4 p-2 rounded-xl text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step 1: Login Gate */}
        {!isAuthenticated ? (
          <div className="py-10 max-w-md mx-auto text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400 shadow-[0_0_25px_rgba(225,29,72,0.35)] backdrop-blur-md">
              <Settings className="w-8 h-8 animate-gear" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">لوحة الإدارة والتحكم</h2>
              <p className="text-xs text-gray-400 mt-1">
                أدخل كود الإدارة للمتابعة (الافتراضي: {storeData.config.adminPasswordHash || '2255'})
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setAuthError(false);
                }}
                placeholder="أدخل كود المرور السري..."
                className="w-full bg-black/60 border border-white/15 focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/20 rounded-2xl py-3.5 px-4 text-center text-lg font-bold text-white tracking-widest placeholder-gray-600 transition-all font-mono backdrop-blur-md"
                autoFocus
              />

              {authError && (
                <p className="text-xs text-rose-400 font-bold p-2 rounded-xl bg-rose-950/40 border border-rose-500/30">
                  ❌ كلمة المرور غير صحيحة، حاول مجدداً.
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl font-bold bg-gradient-to-r from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 text-white shadow-lg shadow-rose-900/40 border border-rose-400/30 cursor-pointer transition-all"
              >
                تسجيل الدخول للإدارة
              </button>
            </form>
          </div>
        ) : (
          /* Step 2: Full Admin Dashboard with dedicated "Add Icon and Image for Store" section */
          <div className="space-y-6">
            {/* Dashboard Top Heading */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-400 shadow backdrop-blur-md">
                  <Settings className="w-6 h-6 animate-gear" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">لوحة تحكم المتجر والإدارة</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    تخصيص صورة وأيقونة المتجر، الألعاب، الفيديوهات، السكربتات والتسجيل الصوتي
                  </p>
                </div>
              </div>

              <div className="text-xs bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 backdrop-blur-md">
                <ShieldCheck className="w-4 h-4" />
                <span>جلسة مدير النظام نشطة</span>
              </div>
            </div>

            {/* Navigation Tabs including requested "Add Icon and Image for Store" tab */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10 text-xs sm:text-sm font-bold no-scrollbar">
              {/* Dedicated New Tab */}
              <button
                onClick={() => setActiveTab('store-branding')}
                className={`px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                  activeTab === 'store-branding'
                    ? 'border-amber-500/70 bg-gradient-to-r from-amber-600/30 to-rose-600/30 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.35)] ring-1 ring-amber-500/50 backdrop-blur-md font-black'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Palette className="w-4 h-4 text-amber-400" />
                <span>✨ إضافة أيقونة وصورة المتجر</span>
              </button>

              <button
                onClick={() => setActiveTab('add-game')}
                className={`px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                  activeTab === 'add-game'
                    ? 'border-rose-500/60 bg-rose-600/20 text-rose-200 shadow-[0_0_15px_rgba(225,29,72,0.3)] ring-1 ring-rose-500/40 backdrop-blur-md font-black'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-4 h-4 text-rose-400" />
                <span>🎮 إضافة / تعديل لعبة</span>
              </button>

              <button
                onClick={() => setActiveTab('add-video')}
                className={`px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                  activeTab === 'add-video'
                    ? 'border-blue-500/60 bg-blue-600/20 text-blue-200 shadow-[0_0_15px_rgba(37,99,235,0.3)] ring-1 ring-blue-500/40 backdrop-blur-md font-black'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Film className="w-4 h-4 text-blue-400" />
                <span>🎬 إضافة / تعديل فيديو Alert</span>
              </button>

              <button
                onClick={() => setActiveTab('categories')}
                className={`px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                  activeTab === 'categories'
                    ? 'border-yellow-500/60 bg-yellow-600/20 text-yellow-200 shadow-[0_0_15px_rgba(234,179,8,0.3)] ring-1 ring-yellow-500/40 backdrop-blur-md font-black'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <FolderPlus className="w-4 h-4 text-yellow-400" />
                <span>📂 إدارة الأقسام</span>
              </button>

              <button
                onClick={() => setActiveTab('manage-items')}
                className={`px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                  activeTab === 'manage-items'
                    ? 'border-emerald-500/60 bg-emerald-600/20 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/40 backdrop-blur-md font-black'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>📋 العناصر ({storeData.items.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('backup-export')}
                className={`px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                  activeTab === 'backup-export'
                    ? 'border-indigo-500/60 bg-indigo-600/20 text-indigo-200 shadow-[0_0_15px_rgba(79,70,229,0.3)] ring-1 ring-indigo-500/40 backdrop-blur-md font-black'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>💾 تصدير ZIP</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                  activeTab === 'security'
                    ? 'border-purple-500/60 bg-purple-600/20 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)] ring-1 ring-purple-500/40 backdrop-blur-md font-black'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <KeyRound className="w-4 h-4 text-purple-400" />
                <span>🔑 الأمان والتواصل</span>
              </button>
            </div>

            {/* TAB 0: ADD ICON AND IMAGE FOR STORE (NEW SECTION) */}
            {activeTab === 'store-branding' && (
              <form onSubmit={handleSaveStoreBranding} className="space-y-6">
                {/* Live Preview Box */}
                <div className="bg-gradient-to-br from-black/80 to-[#0c121d] border border-white/15 rounded-3xl p-5 shadow-2xl backdrop-blur-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>معاينة حية للمتجر (Live Header Preview):</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleResetToDefaultLogo}
                      className="text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>إعادة الشعار الافتراضي</span>
                    </button>
                  </div>

                  {/* Header mini simulation */}
                  <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3.5">
                      {/* Simulated Icon with Custom Colors */}
                      <div
                        className="p-1 rounded-2xl flex-shrink-0 shadow-lg transition-all duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${iconConfig.primaryColor} 0%, ${iconConfig.secondaryColor} 100%)`,
                          boxShadow: `0 0 20px ${iconConfig.glowColor}55`,
                        }}
                      >
                        <div
                          className="w-12 h-12 rounded-[14px] flex items-center justify-center"
                          style={{
                            background: `linear-gradient(180deg, ${iconConfig.bgGradientFrom} 0%, ${iconConfig.bgGradientTo} 100%)`,
                            border: `1px solid ${iconConfig.borderColor}`,
                          }}
                        >
                          {renderDynamicIcon(iconConfig.iconName, 'w-6 h-6', {
                            color: iconConfig.primaryColor,
                            filter: `drop-shadow(0 0 8px ${iconConfig.glowColor})`,
                          })}
                        </div>
                      </div>

                      {/* Simulated Store Image */}
                      <div>
                        {storeLogoUrl ? (
                          <img
                            src={storeLogoUrl}
                            alt="Store Brand"
                            className="object-contain max-h-[58px] drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                            style={{
                              maxWidth: `${storeLogoWidth}px`,
                              borderRadius: `${storeLogoBorderRadius}px`,
                            }}
                          />
                        ) : (
                          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-rose-500">
                            Overlay Store
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-bold">
                      ✓ المعاينة المباشرة نشطة
                    </div>
                  </div>
                </div>

                {/* Part 1: Store Image Customization */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4 backdrop-blur-md">
                  <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    <span>1. صورة المتجر وشعار الواجهة (Store Image):</span>
                  </h3>
                  <p className="text-xs text-gray-300">
                    يمكنك رفع صورة شعار المتجر من جهازك (PNG، JPG، SVG، WebP، GIF) أو وضع رابط صورة مباشر:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        رفع صورة المتجر من جهازك:
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setStoreLogoFile(file);
                            setStoreLogoUrl(URL.createObjectURL(file));
                          }
                        }}
                        className="w-full text-xs text-gray-300 file:ml-2 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-amber-600 file:text-white file:font-bold hover:file:bg-amber-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        أو رابط صورة المتجر (URL / Base64):
                      </label>
                      <input
                        type="text"
                        value={storeLogoUrl}
                        onChange={(e) => {
                          setStoreLogoUrl(e.target.value);
                          setStoreLogoFile(null);
                        }}
                        placeholder="https://... أو data:image/..."
                        className="w-full bg-black/60 border border-white/15 rounded-2xl px-3.5 py-2.5 text-xs text-white backdrop-blur-md"
                      />
                    </div>
                  </div>

                  {/* Width & Border Radius Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        عرض الصورة (Max Width: {storeLogoWidth}px):
                      </label>
                      <input
                        type="range"
                        min="160"
                        max="480"
                        step="10"
                        value={storeLogoWidth}
                        onChange={(e) => setStoreLogoWidth(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        انحناء زوايا الصورة (Border Radius: {storeLogoBorderRadius}px):
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="32"
                        value={storeLogoBorderRadius}
                        onChange={(e) => setStoreLogoBorderRadius(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Part 2: Icon Type & Color Customization */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4 backdrop-blur-md">
                  <h3 className="text-base font-black text-rose-300 flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    <span>2. تخصيص أيقونة المتجر وألوانها (Store Icon & Colors):</span>
                  </h3>

                  {/* Icon Selector */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-2">اختر شكل الأيقونة:</label>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                      {[
                        { id: 'Sparkles', name: 'نجوم', Icon: Sparkles },
                        { id: 'Flame', name: 'شعلة', Icon: Flame },
                        { id: 'Gamepad2', name: 'يد تحكم', Icon: Gamepad2 },
                        { id: 'Crown', name: 'تاج', Icon: Crown },
                        { id: 'Shield', name: 'درع', Icon: Shield },
                        { id: 'Zap', name: 'برق', Icon: Zap },
                        { id: 'Layers', name: 'طبقات', Icon: Layers },
                        { id: 'Star', name: 'نجمة', Icon: Star },
                        { id: 'Gem', name: 'جوهرة', Icon: Gem },
                        { id: 'Heart', name: 'قلب', Icon: Heart },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setIconConfig({ ...iconConfig, iconName: item.id })}
                          className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                            iconConfig.iconName === item.id
                              ? 'bg-amber-600/30 border-amber-400 text-amber-300 ring-2 ring-amber-400/40 scale-105'
                              : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <item.Icon className="w-5 h-5" />
                          <span className="text-[10px] font-bold">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Presets */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-2">
                      باقات ألوان جاهزة وفخمة:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {colorPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setIconConfig({
                              ...iconConfig,
                              primaryColor: preset.primary,
                              secondaryColor: preset.secondary,
                              glowColor: preset.glow,
                              bgGradientFrom: preset.from,
                              bgGradientTo: preset.to,
                            })
                          }
                          className="p-2.5 rounded-2xl bg-black/40 border border-white/10 hover:border-white/30 flex items-center justify-between text-xs text-gray-200 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{ backgroundColor: preset.primary }}
                            />
                            <span className="font-bold text-[11px]">{preset.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Color Pickers */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-300 mb-1">
                        اللون الأساسي للأيقونة:
                      </label>
                      <div className="flex items-center gap-2 bg-black/60 border border-white/15 rounded-2xl p-1.5">
                        <input
                          type="color"
                          value={iconConfig.primaryColor}
                          onChange={(e) =>
                            setIconConfig({ ...iconConfig, primaryColor: e.target.value })
                          }
                          className="w-8 h-8 rounded-xl bg-transparent border-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={iconConfig.primaryColor}
                          onChange={(e) =>
                            setIconConfig({ ...iconConfig, primaryColor: e.target.value })
                          }
                          className="w-full text-xs text-white font-mono bg-transparent outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-300 mb-1">
                        اللون الثانوي (Gradient):
                      </label>
                      <div className="flex items-center gap-2 bg-black/60 border border-white/15 rounded-2xl p-1.5">
                        <input
                          type="color"
                          value={iconConfig.secondaryColor}
                          onChange={(e) =>
                            setIconConfig({ ...iconConfig, secondaryColor: e.target.value })
                          }
                          className="w-8 h-8 rounded-xl bg-transparent border-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={iconConfig.secondaryColor}
                          onChange={(e) =>
                            setIconConfig({ ...iconConfig, secondaryColor: e.target.value })
                          }
                          className="w-full text-xs text-white font-mono bg-transparent outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-300 mb-1">
                        لون التوهج النيوني (Glow):
                      </label>
                      <div className="flex items-center gap-2 bg-black/60 border border-white/15 rounded-2xl p-1.5">
                        <input
                          type="color"
                          value={iconConfig.glowColor}
                          onChange={(e) =>
                            setIconConfig({ ...iconConfig, glowColor: e.target.value })
                          }
                          className="w-8 h-8 rounded-xl bg-transparent border-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={iconConfig.glowColor}
                          onChange={(e) =>
                            setIconConfig({ ...iconConfig, glowColor: e.target.value })
                          }
                          className="w-full text-xs text-white font-mono bg-transparent outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-300 mb-1">
                        لون خلفية الأيقونة:
                      </label>
                      <div className="flex items-center gap-2 bg-black/60 border border-white/15 rounded-2xl p-1.5">
                        <input
                          type="color"
                          value={iconConfig.bgGradientFrom}
                          onChange={(e) =>
                            setIconConfig({ ...iconConfig, bgGradientFrom: e.target.value })
                          }
                          className="w-8 h-8 rounded-xl bg-transparent border-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={iconConfig.bgGradientFrom}
                          onChange={(e) =>
                            setIconConfig({ ...iconConfig, bgGradientFrom: e.target.value })
                          }
                          className="w-full text-xs text-white font-mono bg-transparent outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 px-6 rounded-2xl font-bold bg-gradient-to-r from-amber-600 via-rose-600 to-blue-700 hover:from-amber-500 hover:via-rose-500 hover:to-blue-600 text-white shadow-xl shadow-rose-950/50 border border-amber-400/30 cursor-pointer flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                >
                  <Save className="w-5 h-5" />
                  <span>حفظ صورة وأيقونة المتجر وتطبيق التغييرات فورا</span>
                </button>
              </form>
            )}

            {/* TAB 1: ADD / EDIT GAME WITH AUDIO & VOICE INPUT */}
            {activeTab === 'add-game' && (
              <form onSubmit={handleSaveGame} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-rose-400 flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5" />
                    <span>{editingItemId ? `تعديل اللعبة: ${gameTitle}` : 'إضافة لعبة تخريب أو سكربت جديد'}</span>
                  </h3>
                  {editingItemId && (
                    <button
                      type="button"
                      onClick={resetGameForm}
                      className="text-xs text-gray-300 hover:text-white bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      إلغاء التعديل
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title with Voice Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">اسم اللعبة / السكربت:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={gameTitle}
                        onChange={(e) => setGameTitle(e.target.value)}
                        placeholder="مثال: الشباب vs البنات"
                        className="flex-1 bg-black/60 border border-white/15 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 backdrop-blur-md"
                        required
                      />
                      <VoiceInputButton onTranscript={(txt) => setGameTitle(txt)} />
                    </div>
                  </div>

                  {/* Category Selector */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">القسم التابع له:</label>
                    <select
                      value={gameCatId}
                      onChange={(e) => setGameCatId(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:border-rose-500 backdrop-blur-md"
                    >
                      {storeData.categories.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#0a0d14] text-white">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description with Voice Input & Audio Memo Recorder */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-300">وصف اللعبة ومميزاتها (صوتي أو نصي):</label>
                    <button
                      type="button"
                      onClick={() => {
                        setAudioTargetField('gameDesc');
                        setIsAudioStudioOpen(true);
                      }}
                      className="text-xs text-rose-300 hover:text-rose-200 flex items-center gap-1 bg-rose-950/40 border border-rose-500/30 px-2.5 py-1 rounded-xl cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>تسجيل مقطع صوتي مخصص</span>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      value={gameDesc}
                      onChange={(e) => setGameDesc(e.target.value)}
                      placeholder="اكتب أو انطق شرح اللعبة وقوانين التخريب..."
                      rows={3}
                      className="flex-1 bg-black/60 border border-white/15 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:border-rose-500 backdrop-blur-md"
                    />
                    <VoiceInputButton
                      onTranscript={(txt) => setGameDesc((prev) => (prev ? prev + ' ' + txt : txt))}
                    />
                  </div>
                  {gameAudioUrl && (
                    <div className="mt-2 p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                      <span>✓ تم إرفاق مقطع صوتي للعبة</span>
                      <audio controls src={gameAudioUrl} className="h-7 max-w-[200px]" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Price with Voice Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">السعر (مثال: 15$):</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={gamePrice}
                        onChange={(e) => setGamePrice(e.target.value)}
                        placeholder="15$"
                        className="flex-1 bg-black/60 border border-white/15 rounded-2xl px-3.5 py-2.5 text-sm text-white backdrop-blur-md"
                      />
                      <VoiceInputButton onTranscript={(txt) => setGamePrice(txt)} />
                    </div>
                  </div>

                  {/* Activation Code */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      كود التفعيل السري (لتنزيل اللعبة):
                    </label>
                    <input
                      type="text"
                      value={gameCode}
                      onChange={(e) => setGameCode(e.target.value)}
                      placeholder="مثال: ASMARO2026"
                      className="w-full bg-black/60 border border-white/15 rounded-2xl px-3.5 py-2.5 text-sm text-white font-mono backdrop-blur-md"
                    />
                  </div>
                </div>

                {/* Image Upload / URL */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-md">
                  <h4 className="text-xs font-bold text-yellow-400">صورة العرض للعبة:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">رفع صورة من جهازك:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setGameImageFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-gray-300 file:ml-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-white/10 file:text-white file:font-bold hover:file:bg-white/20 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">أو رابط صورة خارجي (URL):</label>
                      <input
                        type="text"
                        value={gameImageUrl}
                        onChange={(e) => setGameImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white backdrop-blur-md"
                      />
                    </div>
                  </div>
                </div>

                {/* Script Attachment / Text with Voice Input */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-md">
                  <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4" />
                    <span>ملف السكربت أو كود اللعبة المرفق (يتم تنزيله للزبون عند إدخال الكود):</span>
                  </h4>
                  <div className="space-y-2">
                    <label className="block text-xs text-gray-400">رفع ملف سكربت أو ZIP:</label>
                    <input
                      type="file"
                      onChange={(e) => setGameScriptFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-gray-300 file:ml-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-white/10 file:text-white file:font-bold hover:file:bg-white/20 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">أو ألصق كود السكربت أو أملاه بالصوت هنا:</label>
                    <div className="flex gap-2">
                      <textarea
                        value={gameScriptText}
                        onChange={(e) => setGameScriptText(e.target.value)}
                        placeholder="ألصق كود السكربت أو التعليمات هنا..."
                        rows={3}
                        className="flex-1 bg-black/60 border border-white/15 rounded-xl p-2.5 text-xs text-white font-mono backdrop-blur-md"
                      />
                      <VoiceInputButton
                        onTranscript={(txt) => setGameScriptText((prev) => (prev ? prev + '\n' + txt : txt))}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl font-bold bg-gradient-to-r from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 text-white shadow-lg shadow-rose-900/40 border border-rose-400/30 cursor-pointer flex items-center justify-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ اللعبة في المتجر</span>
                </button>
              </form>
            )}

            {/* TAB 2: ADD / EDIT VIDEO & ALERTS WITH VOICE & AUDIO */}
            {activeTab === 'add-video' && (
              <form onSubmit={handleSaveVideo} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-blue-400 flex items-center gap-2">
                    <Film className="w-5 h-5" />
                    <span>{editingItemId ? `تعديل الـ Alert: ${videoTitle}` : 'إضافة Alert / فيديو جديد'}</span>
                  </h3>
                  {editingItemId && (
                    <button
                      type="button"
                      onClick={resetVideoForm}
                      className="text-xs text-gray-300 hover:text-white bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      إلغاء التعديل
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title with Voice Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">عنوان الـ Alert / الفيديو:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        placeholder="مثال: علم العراق HD"
                        className="flex-1 bg-black/60 border border-white/15 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:border-blue-500 backdrop-blur-md"
                        required
                      />
                      <VoiceInputButton onTranscript={(txt) => setVideoTitle(txt)} />
                    </div>
                  </div>

                  {/* Category Selector */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">القسم التابع له:</label>
                    <select
                      value={videoCatId}
                      onChange={(e) => setVideoCatId(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:border-blue-500 backdrop-blur-md"
                    >
                      {storeData.categories.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#0a0d14] text-white">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Video Description with Voice Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">وصف الـ Alert والتنبيه:</label>
                  <div className="flex gap-2">
                    <textarea
                      value={videoDesc}
                      onChange={(e) => setVideoDesc(e.target.value)}
                      placeholder="اكتب أو انطق وصف الفيديو وشروط استخدامه..."
                      rows={2}
                      className="flex-1 bg-black/60 border border-white/15 rounded-2xl px-3.5 py-2 text-sm text-white focus:border-blue-500 backdrop-blur-md"
                    />
                    <VoiceInputButton
                      onTranscript={(txt) => setVideoDesc((prev) => (prev ? prev + ' ' + txt : txt))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Price */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">السعر (مثال: 5$):</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={videoPrice}
                        onChange={(e) => setVideoPrice(e.target.value)}
                        placeholder="5$"
                        className="flex-1 bg-black/60 border border-white/15 rounded-2xl px-3.5 py-2.5 text-sm text-white backdrop-blur-md"
                      />
                      <VoiceInputButton onTranscript={(txt) => setVideoPrice(txt)} />
                    </div>
                  </div>

                  {/* Activation Code */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">كود التفعيل السري للتحميل:</label>
                    <input
                      type="text"
                      value={videoCode}
                      onChange={(e) => setVideoCode(e.target.value)}
                      placeholder="مثال: IRAQ5"
                      className="w-full bg-black/60 border border-white/15 rounded-2xl px-3.5 py-2.5 text-sm text-white font-mono backdrop-blur-md"
                    />
                  </div>

                  {/* Overlay Branding Text */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">نص الشعار على الفيديو:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={videoOverlayText}
                        onChange={(e) => setVideoOverlayText(e.target.value)}
                        placeholder="Play Joe Gaming"
                        className="flex-1 bg-black/60 border border-white/15 rounded-2xl px-3.5 py-2.5 text-sm text-white font-bold backdrop-blur-md"
                      />
                      <VoiceInputButton onTranscript={(txt) => setVideoOverlayText(txt)} />
                    </div>
                  </div>
                </div>

                {/* 1. Preview Video Upload vs 2. Downloadable Video Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. Preview Video */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-md">
                    <h4 className="text-xs font-bold text-blue-400">
                      👁️ 1. فيديو العرض بالمتجر (Preview) - للعرض فقط:
                    </h4>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">رفع فيديو العرض (MP4/WebM):</label>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setVideoPreviewFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-gray-300 file:ml-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-white/10 file:text-white file:font-bold hover:file:bg-white/20 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">أو رابط فيديو العرض (URL):</label>
                      <input
                        type="text"
                        value={videoPreviewUrl}
                        onChange={(e) => setVideoPreviewUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white backdrop-blur-md"
                      />
                    </div>
                  </div>

                  {/* 2. Original Downloadable Video */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-md">
                    <h4 className="text-xs font-bold text-emerald-400">
                      💻 2. الفيديو الأصلي (Downloadable HQ) - يتحمل بكود التفعيل:
                    </h4>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">رفع الفيديو الأصلي عالي الجودة:</label>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setVideoDownloadFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-gray-300 file:ml-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-white/10 file:text-white file:font-bold hover:file:bg-white/20 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">أو رابط الفيديو الأصلي (URL):</label>
                      <input
                        type="text"
                        value={videoDownloadUrl}
                        onChange={(e) => setVideoDownloadUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white backdrop-blur-md"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white shadow-lg shadow-blue-900/40 border border-blue-400/30 cursor-pointer flex items-center justify-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ الـ Alert في المتجر</span>
                </button>
              </form>
            )}

            {/* TAB 3: CATEGORIES MANAGEMENT WITH VOICE INPUT */}
            {activeTab === 'categories' && (
              <div className="space-y-6">
                <form
                  onSubmit={handleSaveCategory}
                  className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-yellow-400 flex items-center gap-2">
                      <FolderPlus className="w-5 h-5" />
                      <span>{editingCatId ? `تعديل القسم: ${catName}` : 'إضافة قسم / قائمة جديدة في المتجر'}</span>
                    </h3>
                    {editingCatId && (
                      <button
                        type="button"
                        onClick={resetCatForm}
                        className="text-xs text-gray-300 hover:text-white bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        إلغاء التعديل
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">اسم القسم:</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={catName}
                          onChange={(e) => setCatName(e.target.value)}
                          placeholder="مثال: ألعاب التحديات"
                          className="flex-1 bg-black/60 border border-white/15 rounded-2xl px-3.5 py-2.5 text-sm text-white backdrop-blur-md"
                          required
                        />
                        <VoiceInputButton onTranscript={(txt) => setCatName(txt)} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">أيقونة القسم:</label>
                      <select
                        value={catIcon}
                        onChange={(e) => setCatIcon(e.target.value)}
                        className="w-full bg-black/60 border border-white/15 rounded-2xl px-3.5 py-2.5 text-sm text-white backdrop-blur-md"
                      >
                        <option value="Gamepad2" className="bg-[#0a0d14] text-white">🎮 Gamepad (ألعاب)</option>
                        <option value="Film" className="bg-[#0a0d14] text-white">🎬 Film (فيديو وتنبيهات)</option>
                        <option value="Flame" className="bg-[#0a0d14] text-white">🔥 Flame (مؤثرات)</option>
                        <option value="Sparkles" className="bg-[#0a0d14] text-white">✨ Sparkles (تصاميم)</option>
                        <option value="Zap" className="bg-[#0a0d14] text-white">⚡ Zap (سكربتات)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">لون التوهج (Badge Color):</label>
                      <select
                        value={catBadgeColor}
                        onChange={(e) => setCatBadgeColor(e.target.value as Category['badgeColor'])}
                        className="w-full bg-black/60 border border-white/15 rounded-2xl px-3.5 py-2.5 text-sm text-white backdrop-blur-md"
                      >
                        <option value="red" className="bg-[#0a0d14] text-white">🔴 أحمر تخريبي (Red)</option>
                        <option value="blue" className="bg-[#0a0d14] text-white">🔵 أزرق ملكي (Blue)</option>
                        <option value="gold" className="bg-[#0a0d14] text-white">🟡 ذهبي فخم (Gold)</option>
                        <option value="emerald" className="bg-[#0a0d14] text-white">🟢 أخضر زمردي (Emerald)</option>
                        <option value="purple" className="bg-[#0a0d14] text-white">🟣 بنفسجي نيون (Purple)</option>
                        <option value="cyan" className="bg-[#0a0d14] text-white">🌊 سماوي (Cyan)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">شرح ونبذة عن هذا القسم:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={catDesc}
                        onChange={(e) => setCatDesc(e.target.value)}
                        placeholder="اكتب شرحاً قصيراً يظهر في أعلى المتجر عند اختيار هذا القسم..."
                        className="flex-1 bg-black/60 border border-white/15 rounded-2xl px-3.5 py-2.5 text-sm text-white backdrop-blur-md"
                      />
                      <VoiceInputButton onTranscript={(txt) => setCatDesc(txt)} />
                    </div>
                  </div>

                  {/* Category Banner Image */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">رفع صورة غلاف / بانر للقسم:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCatBannerFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-gray-300 file:ml-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-white/10 file:text-white file:font-bold hover:file:bg-white/20 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">أو رابط صورة الغلاف (URL):</label>
                      <input
                        type="text"
                        value={catBannerUrl}
                        onChange={(e) => setCatBannerUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white backdrop-blur-md"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-white shadow-lg shadow-yellow-900/40 border border-yellow-400/30 cursor-pointer flex items-center justify-center gap-2 text-sm transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ وتثبيت القسم</span>
                  </button>
                </form>

                {/* List of Existing Categories */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-300">الأقسام الحالية بالمتجر:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {storeData.categories.map((cat) => {
                      const count = storeData.items.filter((i) => i.categoryId === cat.id).length;
                      return (
                        <div
                          key={cat.id}
                          className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow backdrop-blur-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-yellow-400">
                              <FolderPlus className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm flex items-center gap-2">
                                <span>{cat.name}</span>
                                <span className="text-[10px] bg-white/10 text-gray-300 border border-white/10 px-2 py-0.5 rounded-full">
                                  {count} عناصر
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{cat.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setCatName(cat.name);
                                setCatDesc(cat.description || '');
                                setCatIcon(cat.icon || 'Gamepad2');
                                setCatBadgeColor(cat.badgeColor || 'red');
                                setCatBannerUrl(cat.bannerUrl || '');
                              }}
                              className="p-2 rounded-xl bg-yellow-600/80 hover:bg-yellow-600 text-white text-xs font-bold transition-all cursor-pointer shadow"
                              title="تعديل"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold transition-all cursor-pointer shadow"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: MANAGE ALL ITEMS */}
            {activeTab === 'manage-items' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-emerald-400 flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    <span>إدارة وتعديل / حذف كافة العناصر المعروضة بالمتجر</span>
                  </h3>
                </div>

                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {storeData.items.map((item) => {
                    const cat = storeData.categories.find((c) => c.id === item.categoryId);
                    return (
                      <div
                        key={item.id}
                        className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow hover:border-white/20 transition-all backdrop-blur-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-gray-300 font-bold flex-shrink-0">
                            {item.type === 'video' ? (
                              <Film className="w-5 h-5 text-blue-400" />
                            ) : (
                              <Gamepad2 className="w-5 h-5 text-rose-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{item.title}</span>
                              <span className="text-xs text-emerald-400 font-bold">
                                ({item.price || 'مجاني'})
                              </span>
                              <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full border border-white/10">
                                {cat?.name || 'عام'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 flex items-center gap-3 mt-1">
                              <span>
                                كود التفعيل:{' '}
                                <strong className="text-yellow-400 font-mono">
                                  {item.activationCode || 'بدون كود'}
                                </strong>
                              </span>
                              <span>•</span>
                              <span>النوع: {item.type === 'video' ? 'فيديو Alert' : 'لعبة / سكربت'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="inline-flex items-center gap-1 bg-yellow-600/90 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="inline-flex items-center gap-1 bg-rose-600/90 hover:bg-rose-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>مسح</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 5: BACKUP & EXPORT TO COMPUTER (ZIP / HTML / JSON) */}
            {activeTab === 'backup-export' && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 backdrop-blur-md">
                  <h3 className="text-lg font-black text-indigo-400 flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    <span>حفظ وتصدير الحزمة كاملة على الكمبيوتر (Offline & Cloud Ready)</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    عند التصدير، يتم تجميع وتنزيل كافة الملفات الأصلية (فيديوهات HD، صور المتجر، الأيقونة المخصصة، سكربتات، أكواد، وصفحة متجر مستقلة تعمل على أي جهاز).
                  </p>

                  {exportStatus && (
                    <div className="bg-indigo-950/60 border border-indigo-500/50 rounded-2xl p-3 text-xs text-indigo-300 font-bold space-y-1.5 backdrop-blur-md">
                      <div className="flex justify-between">
                        <span>{exportStatus}</span>
                        <span>{exportPercent}%</span>
                      </div>
                      <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full transition-all duration-300"
                          style={{ width: `${exportPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <button
                      onClick={handleExportZip}
                      className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-800 hover:from-indigo-500 hover:to-blue-700 text-white text-right shadow-lg shadow-indigo-900/40 border border-indigo-400/30 transition-all cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center mb-2">
                        <Download className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-sm">حزمة المتجر الكاملة (ZIP)</div>
                      <p className="text-[11px] text-gray-200 mt-1 opacity-90">
                        تحتوي على index.html + مجلد media + store_data.json
                      </p>
                    </button>

                    <button
                      onClick={() => exportStandaloneHtml(storeData)}
                      className="p-4 rounded-2xl bg-gradient-to-br from-rose-600 to-amber-700 hover:from-rose-500 hover:to-amber-600 text-white text-right shadow-lg shadow-rose-900/40 border border-rose-400/30 transition-all cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center mb-2">
                        <FileCode className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-sm">صفحة HTML مستقلة</div>
                      <p className="text-[11px] text-gray-200 mt-1 opacity-90">
                        ملف HTML واحد يعمل فوراً في أي متصفح
                      </p>
                    </button>

                    <button
                      onClick={() => exportJsonBackup(storeData)}
                      className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 hover:from-emerald-500 hover:to-teal-700 text-white text-right shadow-lg shadow-emerald-900/40 border border-emerald-400/30 transition-all cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center mb-2">
                        <Save className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-sm">نسخة بيانات JSON</div>
                      <p className="text-[11px] text-gray-200 mt-1 opacity-90">
                        نسخ وحفظ البيانات والأكواد نصياً
                      </p>
                    </button>
                  </div>
                </div>

                {/* Import Existing ZIP */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-3 backdrop-blur-md">
                  <h4 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>استيراد حزمة متجر سابقة وتثبيتها (ZIP):</span>
                  </h4>
                  <p className="text-xs text-gray-300">
                    إذا قمت بنقل ملفات المتجر من كمبيوتر آخر وتريد تثبيتها، اختر ملف ZIP هنا وسيتم فك الضغط تلقائياً:
                  </p>

                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleImportZip}
                    className="w-full text-xs text-gray-300 file:ml-2 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-yellow-600 file:text-white file:font-bold hover:file:bg-yellow-500 cursor-pointer"
                  />

                  {importStatus && (
                    <p className="text-xs text-yellow-300 font-bold mt-2 animate-pulse">{importStatus}</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: SECURITY & SETTINGS WITH VOICE INPUT */}
            {activeTab === 'security' && (
              <form
                onSubmit={handleSaveSettings}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 backdrop-blur-md"
              >
                <h3 className="text-lg font-black text-purple-400 flex items-center gap-2">
                  <KeyRound className="w-5 h-5" />
                  <span>تغيير كلمة المرور وإعدادات التواصل</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      تغيير كلمة سر الإدارة (الحالية: {storeData.config.adminPasswordHash}):
                    </label>
                    <input
                      type="password"
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      placeholder="أدخل كلمة السر الجديدة (اتركه فارغاً للإبقاء على الحالية)"
                      className="w-full bg-black/60 border border-white/15 rounded-2xl px-3.5 py-2.5 text-sm text-white backdrop-blur-md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">رقم الواتساب و Wish Money:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={whatsappPhone}
                        onChange={(e) => {
                          setWhatsappPhone(e.target.value);
                          setWishMoneyPhone(e.target.value);
                        }}
                        placeholder="76774306"
                        className="flex-1 bg-black/60 border border-white/15 rounded-2xl px-3.5 py-2.5 text-sm text-white font-bold backdrop-blur-md"
                      />
                      <VoiceInputButton
                        onTranscript={(txt) => {
                          const cleaned = txt.replace(/[^0-9]/g, '');
                          if (cleaned) {
                            setWhatsappPhone(cleaned);
                            setWishMoneyPhone(cleaned);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">اسم المتجر:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={storeNameInput}
                        onChange={(e) => setStoreNameInput(e.target.value)}
                        placeholder="Overlay Asmaro"
                        className="flex-1 bg-black/60 border border-white/15 rounded-2xl px-3.5 py-2.5 text-sm text-white font-bold backdrop-blur-md"
                      />
                      <VoiceInputButton onTranscript={(txt) => setStoreNameInput(txt)} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">الوصف الفرعي للمتجر:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={storeSubtitleInput}
                        onChange={(e) => setStoreSubtitleInput(e.target.value)}
                        placeholder="منصة الألعاب الاحترافية والبث التفاعلي"
                        className="flex-1 bg-black/60 border border-white/15 rounded-2xl px-3.5 py-2.5 text-sm text-white backdrop-blur-md"
                      />
                      <VoiceInputButton onTranscript={(txt) => setStoreSubtitleInput(txt)} />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white shadow-lg shadow-purple-900/40 border border-purple-400/30 cursor-pointer flex items-center justify-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>تحديث وحفظ الإعدادات</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Audio Studio Modal for custom voice memos */}
      <AudioRecorderModal
        isOpen={isAudioStudioOpen}
        onClose={() => setIsAudioStudioOpen(false)}
        onSaveAudio={(blob, url) => {
          if (audioTargetField === 'gameDesc') {
            setGameAudioBlob(blob);
            setGameAudioUrl(url);
          }
        }}
      />
    </div>
  );
};
