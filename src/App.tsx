import React, { useState, useEffect } from 'react';
import {
  Search, Shield, Sparkles, Gamepad2, Radio, Code2, Layers,
  Download, MessageCircle, ExternalLink, Key, Lock, CheckCircle2,
  Flame, ChevronRight, HelpCircle, Film, Play, Volume2, ShieldCheck, ArrowRight, Sparkle
} from 'lucide-react';
import { StoreProduct, StoreSettings, SubscriptionLicense, StoreCategory } from './types';
import {
  getStoredCategories,
  getStoredProducts,
  getStoredSettings,
  getStoredSubscriptions
} from './utils/storage';
import { exportUniversalStoreZip } from './utils/zipManager';
import { ThreeScene } from './components/ThreeScene';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { SubscriptionCheckerModal } from './components/SubscriptionCheckerModal';
import { AdminPanel } from './components/AdminPanel';
import { VideoWithWatermark } from './components/VideoWithWatermark';
import { GmailAuthModal } from './components/GmailAuthModal';
import { OnlineGuard } from './components/OnlineGuard';
import { InAppBrowserModal } from './components/InAppBrowserModal';

export default function App() {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(getStoredSettings());
  const [subscriptions, setSubscriptions] = useState<SubscriptionLicense[]>([]);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [runningBrowserProduct, setRunningBrowserProduct] = useState<StoreProduct | null>(null);

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSubCheckerOpen, setIsSubCheckerOpen] = useState(false);
  const [isGmailAuthOpen, setIsGmailAuthOpen] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    return localStorage.getItem('asmaro_current_user_email') || '';
  });

  // Load data & subscribe to storage updates
  const refreshData = () => {
    setCategories(getStoredCategories());
    setProducts(getStoredProducts());
    setSettings(getStoredSettings());
    setSubscriptions(getStoredSubscriptions());
  };

  useEffect(() => {
    refreshData();

    const handleUpdate = () => refreshData();
    window.addEventListener('asmaro_store_updated', handleUpdate);
    return () => window.removeEventListener('asmaro_store_updated', handleUpdate);
  }, []);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const activeCategoryObj = categories.find(c => c.id === activeCategory);

  const handleQuickZipExport = async () => {
    await exportUniversalStoreZip({
      categories,
      products,
      settings,
      subscriptions,
      zipPassword: settings.zipProtectionPassword
    });
  };

  const handleDirectWhatsapp = () => {
    const cleanNumber = settings.whatsappNumber.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(`مرحباً Asmaro Overlay، أريد الاستفسار عن الألعاب والسكربتات.`);
    window.open(`https://wa.me/${cleanNumber}?text=${msg}`, '_blank');
  };

  const handleGmailLoginSuccess = (email: string) => {
    setCurrentUserEmail(email);
    localStorage.setItem('asmaro_current_user_email', email);
    refreshData();
  };

  return (
    <OnlineGuard requireOnline={settings.requireInternetConnection !== false}>
      <div className="relative min-h-screen text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
        {/* 1. Interactive 3D Fluid Liquid Shader Background (Royal Red & Obsidian Black) */}
        <ThreeScene />

        {/* 2. Streamlined Navigation Bar with Dynamic Categories */}
        <Navbar
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenGmailAuth={() => setIsGmailAuthOpen(true)}
          onQuickZipExport={handleQuickZipExport}
          settings={settings}
          totalProductsCount={products.length}
          currentUserEmail={currentUserEmail}
        />

        {/* 3. Main Streamlined Content Area */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-8">
          
          {/* Dynamic Categories Grid (High-Res Cover Images with High-Contrast Floating Titles) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span>أقسام وتصنيفات المتجر</span>
              </h3>
            </div>
          </section>

          {/* Search Input Bar */}
          <section className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="font-bold text-white">المنتجات المعروضة:</span>
              <span className="px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-500/40 text-rose-300 font-mono font-bold text-xs">
                {filteredProducts.length} عنصر
              </span>
            </div>

            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن لعبة، سكربت، أو فيديو..."
                className="w-full pl-4 pr-10 py-2 rounded-xl bg-slate-900/90 border border-white/15 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-rose-500 transition-colors shadow-inner"
              />
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            </div>
          </section>

          {/* 3D Products Grid */}
          <section>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    settings={settings}
                    currentUserEmail={currentUserEmail}
                    onOpenDetails={setSelectedProduct}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-3xl bg-slate-950/80 text-center space-y-4 border border-white/10">
                <Gamepad2 className="w-12 h-12 text-slate-500 mx-auto" />
                <h4 className="text-lg font-bold text-white">لا توجد عناصر في هذا التصنيف</h4>
                <button
                  onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                >
                  عرض كافة المنتجات
                </button>
              </div>
            )}
          </section>

        </main>

        {/* Footer */}
        <footer className="w-full border-t border-white/10 bg-[#030407]/95 backdrop-blur-xl mt-16 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-500" />
              <span className="font-bold text-white font-mono">{settings.storeName}</span>
              <span>- كافة الحقوق محفوظة © {new Date().getFullYear()}</span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setIsSubCheckerOpen(true)}
                className="hover:text-cyan-400 transition-colors flex items-center gap-1"
              >
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>فحص ترخيص واشتراك</span>
              </button>

              <button
                onClick={() => {
                  const url = settings.tiktokUrl || (settings.tiktokUsername ? `https://tiktok.com/@${settings.tiktokUsername.replace('@', '')}` : 'https://tiktok.com');
                  window.open(url, '_blank');
                }}
                className="hover:text-rose-400 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5 fill-current text-rose-400" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.69a6.34 6.34 0 0 0 10.86 4.43 6.32 6.32 0 0 0 1.91-4.47V9.22a8.16 8.16 0 0 0 4.82 1.58v-3.5a4.85 4.85 0 0 1-1-.61z" />
                </svg>
                <span>تيك توك</span>
              </button>

              <a
                href={settings.wishMoneyUrl || 'https://wishmoney.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-400 transition-colors flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                <span>Wish Money</span>
              </a>

              <button
                onClick={handleDirectWhatsapp}
                className="hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>واتساب: {settings.whatsappNumber || '76774306'}</span>
              </button>
            </div>
          </div>
        </footer>

        {/* Product Details Modal */}
        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            settings={settings}
            currentUserEmail={currentUserEmail}
            onClose={() => setSelectedProduct(null)}
            onOpenInAppBrowser={(p) => setRunningBrowserProduct(p)}
          />
        )}

        {/* In-App Browser Modal (For Games, HTML5 & Script Simulators) */}
        {runningBrowserProduct && (
          <InAppBrowserModal
            product={runningBrowserProduct}
            onClose={() => setRunningBrowserProduct(null)}
          />
        )}

        {/* Subscription Checker Modal */}
        {isSubCheckerOpen && (
          <SubscriptionCheckerModal
            subscriptions={subscriptions}
            products={products}
            settings={settings}
            onClose={() => setIsSubCheckerOpen(false)}
            onSelectProduct={(p) => setSelectedProduct(p)}
          />
        )}

        {/* Admin Panel Modal */}
        {isAdminOpen && (
          <AdminPanel
            categories={categories}
            products={products}
            settings={settings}
            subscriptions={subscriptions}
            onClose={() => setIsAdminOpen(false)}
            onRefreshData={refreshData}
          />
        )}

        {/* Gmail Google Login Modal */}
        {isGmailAuthOpen && (
          <GmailAuthModal
            settings={settings}
            currentEmail={currentUserEmail}
            onClose={() => setIsGmailAuthOpen(false)}
            onSuccess={handleGmailLoginSuccess}
          />
        )}
      </div>
    </OnlineGuard>
  );
}
