import React, { useState } from 'react';
import {
  Shield, Sparkles, Settings as SettingsIcon, MessageCircle,
  ArrowDownToLine, Mail, UserCheck
} from 'lucide-react';
import { StoreCategory, StoreSettings } from '../types';

interface NavbarProps {
  categories: StoreCategory[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenAdmin: () => void;
  onOpenGmailAuth: () => void;
  onQuickZipExport: () => void;
  settings: StoreSettings;
  totalProductsCount: number;
  currentUserEmail?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  onOpenAdmin,
  onOpenGmailAuth,
  onQuickZipExport,
  settings,
  currentUserEmail
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const handleDirectWhatsapp = () => {
    const cleanNumber = settings.whatsappNumber ? settings.whatsappNumber.replace(/[^0-9]/g, '') : '76774306';
    const msg = encodeURIComponent(`مرحباً ${settings.storeName || 'Asmaro Overlay'}، أريد الاستفسار عن الألعاب والسكربتات المتاحة.`);
    window.open(`https://wa.me/${cleanNumber}?text=${msg}`, '_blank');
  };

  const avatarUrl = settings.storeLogoAvatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80';

  // دالة لتنفيذ تلوين كل حرف على حدة إذا تم تفعيل ميزة الألوان المخصصة للأحرف
  const renderCustomColoredTitle = (text: string, customColors?: string[]) => {
    if (!text) return null;
    const letters = Array.from(text);
    return letters.map((char, idx) => {
      const color = (customColors && customColors[idx]) ? customColors[idx] : undefined;
      return (
        <span
          key={idx}
          style={color ? { color } : undefined}
          className={!color ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-slate-200" : ""}
        >
          {char}
        </span>
      );
    });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#04060a]/95 backdrop-blur-2xl transition-all shadow-2xl shadow-black/80">
      
      {/* Top Essential Clean Bar */}
      <div className="w-full bg-[#020306]/90 border-b border-white/5 py-1.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs font-semibold text-slate-300">
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950/70 border border-rose-500/40 text-rose-300 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="font-mono tracking-wider">LIVE</span>
            </div>

            <div className="flex items-center gap-1 text-emerald-400 text-[11px]">
              <Shield className="w-3.5 h-3.5" />
              <span>مشفر ومحمي للكمبيوتر</span>
            </div>
          </div>

          {/* User Gmail Login Status & Direct WhatsApp & TikTok Contact */}
          <div className="flex items-center gap-2.5">
            
            {/* TikTok Button */}
            <button
              onClick={() => {
                const url = settings.tiktokUrl || (settings.tiktokUsername ? `https://tiktok.com/@${settings.tiktokUsername.replace('@', '')}` : 'https://tiktok.com');
                window.open(url, '_blank');
              }}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-all"
              title="حساب تيك توك الرسمي"
            >
              <svg className="w-3 h-3 fill-current text-rose-400" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.69a6.34 6.34 0 0 0 10.86 4.43 6.32 6.32 0 0 0 1.91-4.47V9.22a8.16 8.16 0 0 0 4.82 1.58v-3.5a4.85 4.85 0 0 1-1-.61z" />
              </svg>
              <span>تيك توك</span>
            </button>

            {/* Google / Gmail Sign In Trigger */}
            <button
              onClick={onOpenGmailAuth}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                currentUserEmail
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              {currentUserEmail ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-mono">{currentUserEmail.split('@')[0]}</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5 text-rose-400" />
                  <span>تسجيل الدخول (Gmail)</span>
                </>
              )}
            </button>

            <button
              onClick={handleDirectWhatsapp}
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors text-[11px]"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="font-mono font-bold">واتساب: {settings.whatsappNumber || '76774306'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Brand Hub & Clean Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo & Custom Typographic Brand with Flaming Circular Avatar */}
          <div
            className="flex items-center gap-3.5 cursor-pointer group select-none"
            onClick={() => onSelectCategory('all')}
          >
            {/* Flaming Ring Avatar */}
            <div className="relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full p-[2px] bg-gradient-to-tr from-rose-600 via-amber-500 to-rose-500 shadow-lg shadow-rose-600/40 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full rounded-full overflow-hidden bg-black border border-white/20">
                <img
                  src={avatarUrl}
                  alt={settings.storeName || "Asmaro Overlay"}
                  className="w-full h-full object-cover group-hover:rotate-6 transition-transform duration-500"
                />
              </div>
              {/* Flame Sparkle Accent */}
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-rose-600 flex items-center justify-center shadow-md animate-pulse">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>

            {/* Custom Styled Dynamic Title */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                {/* Prefix Part / Title 1 */}
                <span
                  style={settings.titlePrefixColor ? { color: settings.titlePrefixColor } : undefined}
                  className={`text-xl sm:text-2xl md:text-3xl font-black tracking-tight drop-shadow-[0_0_15px_rgba(244,63,94,0.5)] ${
                    !settings.titlePrefixColor ? "text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-400 to-amber-200" : ""
                  }`}
                >
                  {settings.storeTitlePrefix || 'Overlay'}
                </span>

                {/* Main Part / Title 2 with per-letter coloring support */}
                <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] font-mono">
                  {renderCustomColoredTitle(
                    settings.storeName || 'أسماره',
                    settings.titleLetterColors
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Action Tools: Discrete Zip & Admin (إدارة) */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Subtle Zip Export Button */}
            <button
              onClick={onQuickZipExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-white/10 transition-all active:scale-95 shadow-sm"
              title="تصدير حزمة المتجر .Zip وتحديث الإصدار"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono">Zip</span>
            </button>

            {/* Clean Admin Gear Button */}
            <button
              onClick={onOpenAdmin}
              className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-slate-200 hover:text-white bg-slate-900/90 hover:bg-rose-950/80 border border-white/15 hover:border-rose-500/50 transition-all duration-300 active:scale-95 shadow-md shadow-black/40"
              title="لوحة تحكم وإدارة المتجر"
            >
              <SettingsIcon className="w-4 h-4 text-slate-300 group-hover:rotate-90 group-hover:text-rose-400 transition-all duration-500" />
              <span>إدارة</span>
            </button>

          </div>
        </div>

        {/* Dynamic Categories Showcase */}
        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
          
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            const isHovered = hoveredCategory === cat.id;

            return (
              <div
                key={cat.id}
                onMouseEnter={() => setHoveredCategory(cat.id)}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => onSelectCategory(cat.id)}
                className={`relative group shrink-0 h-14 sm:h-16 rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300 ${
                  isActive
                    ? 'w-44 sm:w-52 border-rose-500/80 shadow-lg shadow-rose-600/30 scale-[1.02]'
                    : isHovered
                    ? 'w-44 sm:w-52 border-amber-400/60 shadow-md shadow-black/60 -translate-x-1'
                    : 'w-36 sm:w-40 border-white/15 hover:border-white/30'
                }`}
              >
                <img
                  src={cat.coverImage}
                  alt={cat.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 group-hover:brightness-110"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 group-hover:from-rose-950/90 transition-colors" />

                <div className="absolute inset-0 p-2.5 flex flex-col justify-between z-10">
                  <div className="flex items-center justify-between">
                    {cat.badge ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-amber-300 border border-amber-500/30 backdrop-blur-sm">
                        {cat.badge}
                      </span>
                    ) : <span />}
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-500" />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs sm:text-sm font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] truncate group-hover:text-amber-200 transition-colors">
                      {cat.title}
                    </h4>
                  </div>
                </div>

                {isActive && (
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 to-amber-400" />
                )}
              </div>
            );
          })}

        </div>

      </div>
    </header>
  );
};