import React, { useState, useEffect } from 'react';
import {
  X, MessageCircle, ExternalLink, Code2, Copy, Check,
  ShieldCheck, Layers, Tv, MonitorPlay, BookOpen, AlertCircle, Lock, Key, Clock, CheckCircle2,
  FolderHeart, Image as ImageIcon, Play
} from 'lucide-react';
import { StoreProduct, StoreSettings, UserGrantedAccess } from '../types';
import { VideoWithWatermark } from './VideoWithWatermark';
import {
  getStoredSubscriptions,
  getStoredGmailUsers,
  saveStoredGmailUsers,
  getStoredLocalActivations,
  saveStoredLocalActivations,
  checkIsItemActive,
  getStoredGameFiles,
  SavedGameFile
} from '../utils/storage';

interface ProductDetailModalProps {
  product: StoreProduct | null;
  settings: StoreSettings;
  currentUserEmail?: string;
  onClose: () => void;
  onOpenInAppBrowser?: (product: StoreProduct) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  settings,
  currentUserEmail,
  onClose,
  onOpenInAppBrowser
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'scenario' | 'gallery'>('info');
  const [licenseInput, setLicenseInput] = useState('');
  const [activationError, setActivationError] = useState('');
  const [activationSuccess, setActivationSuccess] = useState('');
  const [userAccess, setUserAccess] = useState<UserGrantedAccess | null>(null);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [savedFiles, setSavedFiles] = useState<SavedGameFile[]>([]);

  if (!product) return null;

  // Load saved files and check if current user has active access
  useEffect(() => {
    const checkAccess = () => {
      const activeStatus = checkIsItemActive(product.id, product.category, currentUserEmail);

      if (activeStatus.isActive && activeStatus.expiryDate) {
        setUserAccess({
          id: `active-${product.id}`,
          itemId: product.id,
          itemName: product.title,
          itemType: 'game',
          startDate: new Date().toISOString(),
          expiryDate: activeStatus.expiryDate,
          durationDays: activeStatus.durationDays || 30,
          status: 'active',
          grantedByAdmin: true,
          activatedAt: new Date().toISOString()
        });
      } else {
        // Check generic local subscription activations
        const activeSubs = getStoredSubscriptions();
        const matched = activeSubs.find(
          sub => (sub.productIds.includes(product.id) || sub.productIds.includes('all')) && sub.status === 'active'
        );
        
        if (matched) {
          const now = new Date().getTime();
          const exp = new Date(matched.expiryDate).getTime();
          if (exp > now) {
            setUserAccess({
              id: matched.id,
              itemId: product.id,
              itemName: product.title,
              itemType: 'game',
              startDate: matched.startDate,
              expiryDate: matched.expiryDate,
              durationDays: matched.durationDays,
              status: 'active',
              grantedByAdmin: true,
              activatedAt: matched.startDate
            });
          } else {
            setUserAccess(null);
          }
        } else {
          setUserAccess(null);
        }
      }

      setSavedFiles(getStoredGameFiles(product.id));
    };

    checkAccess();
    window.addEventListener('asmaro_store_updated', checkAccess);
    return () => window.removeEventListener('asmaro_store_updated', checkAccess);
  }, [product.id, product.category, currentUserEmail]);

  // Live Timer Countdown update
  useEffect(() => {
    if (!userAccess) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const target = new Date(userAccess.expiryDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeRemaining('انتهت صلاحية الاشتراك');
        setUserAccess(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${days} يوم و ${hours} ساعة و ${minutes} دقيقة و ${seconds} ثانية`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [userAccess]);

  const handleActivateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError('');
    setActivationSuccess('');

    const cleanCode = licenseInput.trim().toUpperCase();
    if (!cleanCode) {
      setActivationError('يرجى كتابة كود الاشتراك أو التفعيل');
      return;
    }

    const subscriptions = getStoredSubscriptions();
    const foundLicense = subscriptions.find(
      s => s.code.toUpperCase() === cleanCode && (s.productIds.includes(product.id) || s.productIds.includes('all') || s.productIds.includes(product.category))
    );

    // Accept valid generated codes or admin formatted licenses
    const isValidGeneric = cleanCode.startsWith('ASMARO-') && cleanCode.length >= 10;
    if (!foundLicense && !isValidGeneric) {
      setActivationError('كود التفعيل غير صالح أو غير مخصص لهذا العنصر. يرجى التواصل عبر الواتساب للحصول على كود صالح.');
      return;
    }

    const durationDays = foundLicense ? (foundLicense.durationDays || 30) : 30;
    const now = new Date();
    const expiry = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const newGranted: UserGrantedAccess = {
      id: `access-${Date.now()}`,
      itemId: product.id,
      itemName: product.title,
      itemType: 'game',
      startDate: now.toISOString(),
      expiryDate: expiry.toISOString(),
      durationDays: durationDays,
      status: 'active',
      grantedByAdmin: false,
      activatedAt: now.toISOString()
    };

    // Save local client activation
    const localActs = getStoredLocalActivations();
    const existingIndex = localActs.findIndex(a => a.itemId === product.id);
    if (existingIndex >= 0) {
      localActs[existingIndex] = {
        itemId: product.id,
        code: cleanCode,
        activatedAt: now.toISOString(),
        expiryDate: expiry.toISOString(),
        durationDays
      };
    } else {
      localActs.push({
        itemId: product.id,
        code: cleanCode,
        activatedAt: now.toISOString(),
        expiryDate: expiry.toISOString(),
        durationDays
      });
    }
    saveStoredLocalActivations(localActs);

    // If logged in via Gmail, also save to user record
    if (currentUserEmail) {
      const users = getStoredGmailUsers();
      const idx = users.findIndex(u => u.email.toLowerCase() === currentUserEmail.toLowerCase());
      if (idx >= 0) {
        if (!users[idx].grantedItems) users[idx].grantedItems = [];
        users[idx].grantedItems!.push(newGranted);
        users[idx].isSubscribed = true;
        saveStoredGmailUsers(users);
      }
    }

    setUserAccess(newGranted);
    setActivationSuccess(`تم تفعيل الاشتراك بنجاح لمدة ${durationDays} يوم! يمكنك الآن الفتح والتشغيل بمتصفح المتجر.`);
    setLicenseInput('');
  };

  const handleContactWhatsApp = () => {
    const cleanNumber = (settings.whatsappNumber || '76774306').replace(/[^0-9]/g, '');
    const message = `مرحباً Overlay Asmaro، أريد كود التفعيل والاشتراك لـ: ${product.title}`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleWishMoney = () => {
    window.open(settings.wishMoneyUrl || 'https://wishmoney.com', '_blank');
  };

  const handleTikTok = () => {
    const url = settings.tiktokUrl || (settings.tiktokUsername ? `https://tiktok.com/@${settings.tiktokUsername.replace('@', '')}` : 'https://tiktok.com/@overlayasmaro');
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-white/15 shadow-2xl shadow-rose-950/40 overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 text-xs font-black uppercase rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30">
              {product.category.toUpperCase()}
            </span>
            <h2 className="text-base sm:text-xl font-black text-white truncate max-w-md sm:max-w-xl">
              {product.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Main Showcase Video with Full-screen Watermark & Anti-Drag */}
          <div className="relative w-full rounded-2xl overflow-hidden aspect-video bg-black border border-white/10 shadow-lg">
            <VideoWithWatermark
              videoUrl={product.videoUrl}
              thumbnailUrl={product.thumbnailUrl}
              title={product.title}
              settings={settings}
              audioAlertUrl={product.audioAlertUrl}
              className="w-full h-full"
            />
          </div>

          {/* User Active Access Banner OR Locked State with WhatsApp, Wish Money, TikTok & Code */}
          {userAccess ? (
            /* UNLOCKED / ACTIVATED STATE:
               ONLY the clean launch section with "فتح بمتصفح المتجر" is shown.
               No cluttered tabs, no long text descriptions underneath.
            */
            <div className="space-y-4">
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/90 border-2 border-emerald-500/50 shadow-2xl shadow-emerald-950/60 flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4 text-right w-full sm:w-auto">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0 shadow-lg shadow-emerald-900/40">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-black text-emerald-300">الاشتراك مفعل ونشط الآن</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">مرخص بالكامل</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-200 mt-1.5">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-mono text-amber-300 font-bold text-xs sm:text-sm">{timeRemaining || 'جاري الحساب...'}</span>
                    </div>
                  </div>
                </div>

                {/* THE ONLY PROMINENT ACTION BUTTON: "فتح بمتصفح المتجر" */}
                <div className="w-full sm:w-auto flex items-center justify-end">
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenInAppBrowser) onOpenInAppBrowser(product);
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 py-3.5 px-8 rounded-2xl text-sm sm:text-base font-black bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-xl shadow-emerald-600/40 active:scale-95 transition-all duration-300"
                  >
                    <MonitorPlay className="w-6 h-6" />
                    <span>فتح بمتصفح المتجر</span>
                  </button>
                </div>
              </div>

              {/* Saved Game Files and Custom Images Summary */}
              {savedFiles.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <FolderHeart className="w-4 h-4 text-rose-400" />
                    <span>ملفات وصور محفوظة مع اللعبة بالبرنامج: <strong className="text-amber-400 font-mono">{savedFiles.length}</strong> عنصر محفوظ</span>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenInAppBrowser) onOpenInAppBrowser(product);
                    }}
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>عرض بالمتصفح</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* LOCKED STATE:
               Displays WhatsApp, Wish Money, TikTok buttons + Activation Code Input Form + Detailed Tabs
            */
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-rose-500/30 space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">العنصر مقفل - يتطلب الاشتراك وتفعيل الكود</h4>
                      <p className="text-xs text-slate-400 mt-0.5">تواصل للحصول على الكود أو الدفع عبر الوسائل التالية:</p>
                    </div>
                  </div>

                  {/* 3 Prominent Contact Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    <button
                      onClick={handleContactWhatsApp}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>تواصل واتساب ({settings.whatsappNumber || '76774306'})</span>
                    </button>

                    <button
                      onClick={handleWishMoney}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition-all active:scale-95"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>دفع Wish Money</span>
                    </button>

                    <button
                      onClick={handleTikTok}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 transition-all active:scale-95"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.69a6.34 6.34 0 0 0 10.86 4.43 6.32 6.32 0 0 0 1.91-4.47V9.22a8.16 8.16 0 0 0 4.82 1.58v-3.5a4.85 4.85 0 0 1-1-.61z" />
                      </svg>
                      <span>حساب تيك توك</span>
                    </button>
                  </div>
                </div>

                {/* Code Activation Form */}
                <form onSubmit={handleActivateLicense} className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-white/5">
                  <input
                    type="text"
                    value={licenseInput}
                    onChange={(e) => setLicenseInput(e.target.value)}
                    placeholder="أدخل رمز / كود التفعيل هنا..."
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-xs sm:text-sm text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 shrink-0"
                  >
                    <Key className="w-4 h-4" />
                    <span>تفعيل وترخيص</span>
                  </button>
                </form>

                {activationError && (
                  <div className="flex items-center gap-2 text-xs text-rose-400 font-bold bg-rose-950/40 p-3 rounded-xl border border-rose-500/30">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{activationError}</span>
                  </div>
                )}
                {activationSuccess && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{activationSuccess}</span>
                  </div>
                )}
              </div>

              {/* Tabs shown ONLY in locked state to give customer product info */}
              <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === 'info'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>المميزات والخصائص</span>
                </button>

                {product.scenarioDetails && (
                  <button
                    onClick={() => setActiveTab('scenario')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                      activeTab === 'scenario'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>تفاصيل السيناريو والقصة</span>
                  </button>
                )}

                {product.screenshots && product.screenshots.length > 0 && (
                  <button
                    onClick={() => setActiveTab('gallery')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                      activeTab === 'gallery'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Tv className="w-4 h-4" />
                    <span>معرض الصور ({product.screenshots.length})</span>
                  </button>
                )}
              </div>

              {/* TAB 1: INFO & FEATURES */}
              {activeTab === 'info' && (
                <div className="space-y-4 text-right">
                  <div>
                    <h4 className="text-sm font-black text-slate-300 mb-2">الوصف الكامل</h4>
                    <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-white/5 whitespace-pre-line">
                      {product.fullDescription}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-300 mb-2">أبرز المزايا والمواصفات</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {product.features.map((feat, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-200 font-medium">{feat}</span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mr-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SCENARIO */}
              {activeTab === 'scenario' && product.scenarioDetails && (
                <div className="space-y-4 text-right bg-slate-950/60 p-5 rounded-2xl border border-white/5">
                  <h4 className="text-sm font-black text-rose-400 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>تفاصيل قصة وسيناريو المود</span>
                  </h4>
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                    {product.scenarioDetails}
                  </p>
                </div>
              )}

              {/* TAB 3: GALLERY */}
              {activeTab === 'gallery' && product.screenshots && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {product.screenshots.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedGalleryImage(img)}
                        className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-white/10 cursor-pointer hover:border-rose-500 transition-all group"
                      >
                        <img
                          src={img}
                          alt={`Screenshot ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          draggable={false}
                          onContextMenu={(e) => e.preventDefault()}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3.5 bg-slate-950/90 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Overlay Asmaro - نظام الحماية والترخيص</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>

      {/* Image Preview Modal */}
      {selectedGalleryImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
          onClick={() => setSelectedGalleryImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={selectedGalleryImage}
              alt="Preview"
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl border border-white/20"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
            <button
              onClick={() => setSelectedGalleryImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
