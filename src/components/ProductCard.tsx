import React, { useState, useEffect } from 'react';
import { MessageCircle, ExternalLink, Sparkles, Download, Eye, Flame, Lock, Key, ShieldCheck, MonitorPlay, Play } from 'lucide-react';
import { StoreProduct, StoreSettings } from '../types';
import { VideoWithWatermark } from './VideoWithWatermark';
import { TiltCard } from './TiltCard';
import { checkIsItemActive } from '../utils/storage';

interface ProductCardProps {
  product: StoreProduct;
  settings: StoreSettings;
  currentUserEmail?: string;
  onOpenDetails: (product: StoreProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  settings,
  currentUserEmail,
  onOpenDetails,
}) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const check = () => {
      const status = checkIsItemActive(product.id, product.category, currentUserEmail);
      setIsActive(status.isActive);
    };
    check();
    window.addEventListener('asmaro_store_updated', check);
    return () => window.removeEventListener('asmaro_store_updated', check);
  }, [product.id, product.category, currentUserEmail]);

  return (
    <TiltCard
      onClick={() => onOpenDetails(product)}
      className={`group flex flex-col rounded-3xl bg-[#090d16]/90 border ${
        isActive ? 'border-emerald-500/40 hover:border-emerald-400' : 'border-white/10 hover:border-rose-500/50'
      } shadow-xl overflow-hidden cursor-pointer transition-colors duration-300`}
      maxTilt={16}
      scale={1.035}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-30 flex flex-col gap-1.5 pointer-events-none">
        {isActive ? (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-600/90 text-white shadow-lg shadow-emerald-600/50 backdrop-blur-md">
            <ShieldCheck className="w-3 h-3" />
            <span>مفعل ومرخص</span>
          </span>
        ) : (
          <>
            {product.isHot && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-600/90 text-white shadow-lg shadow-rose-600/50 backdrop-blur-md">
                <Flame className="w-3 h-3 fill-current animate-bounce" />
                <span>الأكثر طلباً</span>
              </span>
            )}
            {product.isNew && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-cyan-600/90 text-white shadow-lg shadow-cyan-600/50 backdrop-blur-md">
                <Sparkles className="w-3 h-3" />
                <span>إصدار جديد</span>
              </span>
            )}
          </>
        )}
      </div>

      {/* Video & Thumbnail with Anti-Theft Watermark Overlay */}
      <div className="relative aspect-video w-full p-2 pb-0">
        <VideoWithWatermark
          videoUrl={product.videoUrl}
          thumbnailUrl={product.thumbnailUrl}
          title={product.title}
          settings={settings}
          audioAlertUrl={product.audioAlertUrl}
          className="w-full h-full rounded-2xl"
        />
      </div>

      {/* Body Content */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-3 text-right">
        <div>
          {/* Tags & File Size */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {product.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-900 text-slate-300 border border-white/5"
              >
                #{tag}
              </span>
            ))}
            {product.fileSize && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Download className="w-3 h-3" />
                {product.fileSize}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-black text-white group-hover:text-rose-400 transition-colors leading-snug line-clamp-1">
            {product.title}
          </h3>

          {/* Short Description */}
          <p className="mt-1.5 text-xs text-slate-300/90 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Glowing subtle gradient line accent */}
          <div className={`mt-3 h-1 w-full rounded-full ${
            isActive ? 'bg-gradient-to-r from-emerald-500 via-cyan-400 to-transparent' : 'bg-gradient-to-r from-rose-500 via-amber-400 to-transparent'
          } opacity-80`} />
        </div>

        {/* Access Status & Action Button */}
        <div className="pt-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            {isActive ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>الاشتراك مفعل وجاهز</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                <Key className="w-3.5 h-3.5" />
                <span>يتطلب كود التفعيل</span>
              </div>
            )}

            {isActive ? (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                <span>مرخص بالكامل</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold">
                <Lock className="w-3 h-3 text-rose-400" />
                <span>مغلق برمز أمان</span>
              </div>
            )}
          </div>

          {/* Action Button: When active => "فتح" (Open in In-App Browser), when locked => "إدخال كود التفعيل" */}
          {isActive ? (
            <button
              onClick={() => onOpenDetails(product)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/30 transition-all duration-300 active:scale-95"
            >
              <MonitorPlay className="w-4 h-4" />
              <span>فتح وتشغيل</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenDetails(product)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-600 text-white shadow-lg shadow-rose-600/30 border border-rose-400/30 transition-all duration-300 active:scale-95"
            >
              <Key className="w-4 h-4" />
              <span>إدخال كود التفعيل</span>
            </button>
          )}
        </div>
      </div>
    </TiltCard>
  );
};
