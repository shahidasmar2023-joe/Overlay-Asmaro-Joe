import React from "react"; export const Header = () => null; export default Header;
import React from 'react';
import {
  Settings,
  Download,
  Search,
  MessageCircle,
  ShieldCheck,
  PackageCheck,
  Sparkles,
  Flame,
  Gamepad2,
  Crown,
  Shield,
  Zap,
  Layers,
  Star,
  Gem,
  Heart,
} from 'lucide-react';
import { StoreConfig } from '../types';
import { VoiceInputButton } from './VoiceInputButton';

interface HeaderProps {
  config: StoreConfig;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalGamesCount: number;
  totalAlertsCount: number;
  onOpenAdmin: () => void;
  onDownloadZip: () => void;
}

// Icon helper to render the customizable store icon
export const renderDynamicIcon = (iconName: string, className = 'w-6 h-6', style?: React.CSSProperties) => {
  switch (iconName) {
    case 'Flame':
      return <Flame className={className} style={style} />;
    case 'Gamepad2':
      return <Gamepad2 className={className} style={style} />;
    case 'Crown':
      return <Crown className={className} style={style} />;
    case 'Shield':
      return <Shield className={className} style={style} />;
    case 'Zap':
      return <Zap className={className} style={style} />;
    case 'Layers':
      return <Layers className={className} style={style} />;
    case 'Star':
      return <Star className={className} style={style} />;
    case 'Gem':
      return <Gem className={className} style={style} />;
    case 'Heart':
      return <Heart className={className} style={style} />;
    case 'Sparkles':
    default:
      return <Sparkles className={className} style={style} />;
  }
};

export const Header: React.FC<HeaderProps> = ({
  config,
  searchQuery,
  onSearchChange,
  totalGamesCount,
  totalAlertsCount,
  onOpenAdmin,
  onDownloadZip,
}) => {
  const iconCfg = config.iconConfig || {
    iconName: 'Sparkles',
    primaryColor: '#f43f5e',
    secondaryColor: '#3b82f6',
    glowColor: '#eab308',
    borderColor: 'rgba(255,255,255,0.2)',
    bgGradientFrom: '#0f172a',
    bgGradientTo: '#020617',
    size: 46,
  };

  return (
    <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-2xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.85)]">
      {/* Top contact & security bar */}
      <div className="bg-gradient-to-r from-rose-950/30 via-slate-900/40 to-blue-950/30 px-4 py-1.5 border-b border-white/5 text-xs flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-3 text-slate-300">
          <div className="px-2.5 py-0.5 bg-emerald-950/50 border border-emerald-500/40 rounded-full flex items-center gap-1.5 shadow-sm">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
            <span className="text-[11px] font-bold text-emerald-300 tracking-wider">متصل ومباشر</span>
          </div>
          <span className="hidden sm:inline text-white/15">•</span>
          <span className="flex items-center gap-1 text-slate-300 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>نظام المتجر الآمن وتنزيل الحزم</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href={`https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>واتساب / Wish Money: <strong className="text-amber-300 font-mono">{config.whatsappNumber}</strong></span>
          </a>
        </div>
      </div>

      {/* Main Brand & Search Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Store Picture Logo & Customizable Icon */}
        <div className="flex items-center gap-3.5 text-center md:text-right">
          {/* Dynamic Customizable Icon */}
          <div
            className="p-1 rounded-2xl flex-shrink-0 transition-all duration-300 transform hover:scale-105 shadow-xl"
            style={{
              background: `linear-gradient(135deg, ${iconCfg.primaryColor} 0%, ${iconCfg.secondaryColor} 100%)`,
              boxShadow: `0 0 20px ${iconCfg.glowColor}55`,
            }}
          >
            <div
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-[14px] flex items-center justify-center transition-colors"
              style={{
                background: `linear-gradient(180deg, ${iconCfg.bgGradientFrom || '#0c1017'} 0%, ${iconCfg.bgGradientTo || '#05070a'} 100%)`,
                border: `1px solid ${iconCfg.borderColor || 'rgba(255,255,255,0.2)'}`,
              }}
            >
              {renderDynamicIcon(iconCfg.iconName, 'w-6 h-6', {
                color: iconCfg.primaryColor,
                filter: `drop-shadow(0 0 8px ${iconCfg.glowColor})`,
              })}
            </div>
          </div>

          {/* Store Image Picture (Replaced the static "Arousal Overlay" text with Picture) */}
          <div className="flex flex-col items-center md:items-start">
            {config.storeLogoUrl ? (
              <img
                src={config.storeLogoUrl}
                alt={config.storeName || 'Store Logo'}
                className="object-contain max-h-[58px] sm:max-h-[64px] transition-all hover:brightness-110 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                style={{
                  maxWidth: `${config.storeLogoWidth || 280}px`,
                  borderRadius: `${config.storeLogoBorderRadius || 12}px`,
                }}
              />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-rose-500 to-amber-400">
                  {config.storeName || 'Store Overlay'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar with Voice Input Recording */}
        <div className="w-full md:w-96 relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث عن لعبة، سكربت، أو Alert..."
              className="w-full bg-white/5 border border-white/15 rounded-2xl px-4 py-2.5 pr-10 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:border-rose-500/60 focus:bg-white/10 focus:ring-2 focus:ring-rose-500/20 backdrop-blur-xl transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute left-3 top-2.5 text-xs text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
              >
                مسح
              </button>
            )}
          </div>

          {/* Voice Search Button */}
          <VoiceInputButton
            onTranscript={(text) => onSearchChange(text)}
            size="md"
            className="flex-shrink-0"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-center">
          {/* Download full store ZIP */}
          <button
            onClick={onDownloadZip}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-blue-950/50 hover:shadow-blue-900/60 transition-all transform hover:-translate-y-0.5 text-xs sm:text-sm border border-blue-400/30 cursor-pointer"
            title="تنزيل حزمة المتجر كاملة بملفات ZIP والملفات الأصلية"
          >
            <Download className="w-4 h-4" />
            <span>حزمة المتجر .Zip</span>
          </button>

          {/* Admin Button */}
          <button
            onClick={onOpenAdmin}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black px-5 py-2.5 rounded-2xl shadow-lg shadow-rose-950/50 hover:shadow-rose-900/60 transition-all transform hover:-translate-y-0.5 text-xs sm:text-sm border border-rose-400/30 cursor-pointer group"
            title="لوحة تحكم إدارة المتجر وإضافة وتعديل المحتوى"
          >
            <Settings className="w-4 h-4 animate-gear text-amber-300" />
            <span>إدارة</span>
          </button>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="bg-white/[0.02] px-4 py-1.5 border-t border-white/5 text-[11px] sm:text-xs text-gray-400 flex justify-center items-center gap-6">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
          <strong className="text-rose-400 font-bold">{totalGamesCount}</strong> ألعاب وسكربتات
        </span>
        <span className="text-white/10">•</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
          <strong className="text-blue-400 font-bold">{totalAlertsCount}</strong> تنبيهات وفيديوهات
        </span>
        <span className="text-white/10">•</span>
        <span className="flex items-center gap-1 text-amber-400 font-medium">
          <PackageCheck className="w-3.5 h-3.5" /> جاهز للتحميل والتشغيل مباشرة
        </span>
      </div>
    </header>
  );
};
