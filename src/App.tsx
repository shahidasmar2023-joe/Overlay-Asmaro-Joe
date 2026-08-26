import React, { useState, useEffect, useMemo } from 'react';
import { StoreData, StoreItem } from './types';
import { INITIAL_STORE_DATA } from './lib/defaultData';
import { Header, renderDynamicIcon } from './components/Header';
import { CategoryNav } from './components/CategoryNav';
import { CategoryBanner } from './components/CategoryBanner';
import { StoreGrid } from './components/StoreGrid';
import { BuyModal } from './components/BuyModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { AdminModal } from './components/AdminModal';
import { PasswordPromptModal } from './components/PasswordPromptModal';
import { exportFullStoreZip } from './lib/exportUtils';
import { openDatabase, getMediaBlob } from './lib/db';
import { MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'OVERLAY_ASMARO_STORE_DATA_V5';

export default function App() {
  const [storeData, setStoreData] = useState<StoreData>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.items) && parsed.config) {
          return {
            ...INITIAL_STORE_DATA,
            ...parsed,
            config: {
              ...INITIAL_STORE_DATA.config,
              ...parsed.config,
              iconConfig: {
                ...INITIAL_STORE_DATA.config.iconConfig,
                ...(parsed.config.iconConfig || {}),
              },
            },
          };
        }
      }
    } catch (e) {
      console.warn('LocalStorage load error:', e);
    }
    return INITIAL_STORE_DATA;
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [activeBuyItem, setActiveBuyItem] = useState<StoreItem | null>(null);
  const [activePreviewVideoItem, setActivePreviewVideoItem] = useState<StoreItem | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);

  // Initialize DB and load any stored media blobs (e.g. custom store logo from IndexedDB)
  useEffect(() => {
    openDatabase()
      .then(async () => {
        // Load custom store logo blob from IndexedDB if key exists
        if (storeData.config.storeLogoKey) {
          try {
            const logoMedia = await getMediaBlob(storeData.config.storeLogoKey);
            if (logoMedia) {
              const url = URL.createObjectURL(logoMedia.blob);
              setStoreData((prev) => ({
                ...prev,
                config: {
                  ...prev.config,
                  storeLogoUrl: url,
                },
              }));
            }
          } catch (err) {
            console.warn('Could not load custom store logo from IndexedDB:', err);
          }
        }
      })
      .catch((err) => console.error('IndexedDB init error:', err));
  }, []);

  const handleUpdateStoreData = (newData: StoreData) => {
    setStoreData(newData);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
    } catch (err) {
      console.warn('Failed to save to localStorage:', err);
    }
  };

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return storeData.items.filter((item) => {
      const matchesCat = selectedCategoryId === 'all' || item.categoryId === selectedCategoryId;
      if (!matchesCat) return false;

      if (!query) return true;
      const titleMatch = item.title.toLowerCase().includes(query);
      const descMatch = (item.description || '').toLowerCase().includes(query);
      const tagsMatch = (item.tags || []).some((t) => t.toLowerCase().includes(query));
      const priceMatch = (item.price || '').toLowerCase().includes(query);
      return titleMatch || descMatch || tagsMatch || priceMatch;
    });
  }, [storeData.items, selectedCategoryId, searchQuery]);

  const itemsCountByCat = useMemo(() => {
    const counts: Record<string, number> = {};
    storeData.categories.forEach((cat) => {
      counts[cat.id] = storeData.items.filter((i) => i.categoryId === cat.id).length;
    });
    return counts;
  }, [storeData.categories, storeData.items]);

  const totalGamesCount = useMemo(
    () => storeData.items.filter((i) => i.type === 'game' || i.type === 'script').length,
    [storeData.items]
  );

  const totalAlertsCount = useMemo(
    () => storeData.items.filter((i) => i.type === 'video').length,
    [storeData.items]
  );

  const currentCategory = useMemo(() => {
    if (selectedCategoryId === 'all') return null;
    return storeData.categories.find((c) => c.id === selectedCategoryId) || null;
  }, [selectedCategoryId, storeData.categories]);

  const handleTriggerDownloadZip = () => {
    setIsPasswordPromptOpen(true);
  };

  const handleExecuteZipExport = () => {
    exportFullStoreZip(storeData);
  };

  const iconCfg = storeData.config.iconConfig;

  return (
    <div className="min-h-screen bg-[#050505] text-[#f1f5f9] flex flex-col font-sans selection:bg-rose-500 selection:text-white relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[35rem] h-[35rem] rounded-full blur-[140px] opacity-30 animate-pulse"
          style={{ backgroundColor: iconCfg?.primaryColor || '#f43f5e' }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[40rem] h-[40rem] rounded-full blur-[160px] opacity-25 animate-pulse"
          style={{ backgroundColor: iconCfg?.secondaryColor || '#3b82f6' }}
        />
        <div
          className="absolute bottom-10 left-1/4 w-[30rem] h-[30rem] rounded-full blur-[130px] opacity-20"
          style={{ backgroundColor: iconCfg?.glowColor || '#fbbf24' }}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header with Store Picture Logo & Icon Color Customizer */}
        <Header
          config={storeData.config}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalGamesCount={totalGamesCount}
          totalAlertsCount={totalAlertsCount}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onDownloadZip={handleTriggerDownloadZip}
        />

        {/* Category Navigation Bar */}
        <CategoryNav
          categories={storeData.categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          itemsCountByCat={itemsCountByCat}
          totalItemsCount={storeData.items.length}
        />

        {/* Category Banner if a category is selected */}
        <CategoryBanner category={currentCategory} itemsCount={filteredItems.length} />

        {/* Main Grid of Store Items */}
        <main className="flex-1">
          <StoreGrid
            items={filteredItems}
            categories={storeData.categories}
            selectedCategoryId={selectedCategoryId}
            searchQuery={searchQuery}
            onOpenBuyModal={(item) => setActiveBuyItem(item)}
            onPreviewVideoModal={(item) => setActivePreviewVideoItem(item)}
          />
        </main>

        {/* Clean Luxury Footer */}
        <footer className="bg-black/60 backdrop-blur-2xl border-t border-white/10 mt-16 py-8 px-4 sm:px-6 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center p-1"
                style={{
                  background: `linear-gradient(135deg, ${iconCfg?.primaryColor || '#f43f5e'} 0%, ${iconCfg?.secondaryColor || '#3b82f6'} 100%)`,
                }}
              >
                <div
                  className="w-full h-full rounded-[14px] flex items-center justify-center"
                  style={{ background: iconCfg?.bgGradientFrom || '#0c1017' }}
                >
                  {renderDynamicIcon(iconCfg?.iconName || 'Sparkles', 'w-5 h-5', {
                    color: iconCfg?.primaryColor || '#f43f5e',
                  })}
                </div>
              </div>

              <div>
                <div className="text-base font-black text-white">
                  {storeData.config.storeName || 'Overlay Store'}
                </div>
                <p className="text-xs text-slate-400">
                  {storeData.config.storeSubtitle || 'منصة الألعاب والبث التفاعلي'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold text-slate-300 flex-wrap justify-center">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>كود الأدمن: {storeData.config.adminPasswordHash || '2255'}</span>
              </span>

              <a
                href={`https://wa.me/${storeData.config.whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/70 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>دعم الواتساب: {storeData.config.whatsappNumber}</span>
              </a>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>© {new Date().getFullYear()} {storeData.config.storeName}</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <BuyModal
        item={activeBuyItem}
        config={storeData.config}
        onClose={() => setActiveBuyItem(null)}
      />

      <VideoPlayerModal
        item={activePreviewVideoItem}
        onClose={() => setActivePreviewVideoItem(null)}
        onOpenBuyModal={(item) => setActiveBuyItem(item)}
      />

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        storeData={storeData}
        onUpdateStoreData={handleUpdateStoreData}
      />

      <PasswordPromptModal
        isOpen={isPasswordPromptOpen}
        correctPassword={storeData.config.adminPasswordHash || '2255'}
        onClose={() => setIsPasswordPromptOpen(false)}
        onSuccess={handleExecuteZipExport}
      />
    </div>
  );
}
