import React, { useState, useEffect } from 'react';
import { X, Search, Key, ShieldCheck, Clock, AlertTriangle, CheckCircle2, MessageCircle, Gamepad2, Calendar, FileText } from 'lucide-react';
import { SubscriptionLicense, StoreProduct, StoreSettings } from '../types';

interface SubscriptionCheckerModalProps {
  subscriptions: SubscriptionLicense[];
  products: StoreProduct[];
  settings: StoreSettings;
  onClose: () => void;
  onSelectProduct?: (product: StoreProduct) => void;
}

export const SubscriptionCheckerModal: React.FC<SubscriptionCheckerModalProps> = ({
  subscriptions,
  products,
  settings,
  onClose,
  onSelectProduct
}) => {
  const [searchCode, setSearchCode] = useState('');
  const [searched, setSearched] = useState(false);
  const [foundSub, setFoundSub] = useState<SubscriptionLicense | null>(null);

  // Live countdown timer state
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = searchCode.trim().toUpperCase();
    if (!clean) return;

    const matched = subscriptions.find(s => s.code.toUpperCase() === clean);
    setFoundSub(matched || null);
    setSearched(true);
  };

  // Update countdown
  useEffect(() => {
    if (!foundSub) return;

    const updateTimer = () => {
      const expiry = new Date(foundSub.expiryDate).getTime();
      const now = Date.now();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [foundSub]);

  const assignedProducts = foundSub
    ? products.filter(p => foundSub.productIds.includes(p.id))
    : [];

  const handleRenewWhatsapp = () => {
    if (!foundSub) return;
    const cleanNumber = settings.whatsappNumber.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(`مرحباً ${settings.storeName}، أريد تجديد اشتراكي بكود الترخيص: ${foundSub.code} باسم: ${foundSub.customerName}`);
    window.open(`https://wa.me/${cleanNumber}?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl flex flex-col rounded-3xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-black text-white">فحص صلاحية الاشتراك والتراخيص</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="أدخل كود الترخيص (مثال: ASMARO-GTA-8921-VIP)"
                className="w-full pl-4 pr-11 py-3 rounded-xl bg-slate-950 border border-white/15 text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
              <Key className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-500" />
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-3 rounded-xl font-bold text-sm bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>فحص</span>
            </button>
          </form>

          {/* Quick Demo Keys pill suggestion */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
            <span>أكواد تجريبية للفحص:</span>
            {subscriptions.slice(0, 3).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSearchCode(s.code);
                  const matched = subscriptions.find(item => item.id === s.id);
                  setFoundSub(matched || null);
                  setSearched(true);
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 font-mono text-cyan-300 text-[11px] border border-cyan-500/20"
              >
                {s.code}
              </button>
            ))}
          </div>

          {/* Search Result Display */}
          {searched && foundSub && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-white/10 space-y-5">
              
              {/* Status Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <div className="text-xs text-slate-400">اسم المشترك:</div>
                  <div className="text-base font-black text-white">{foundSub.customerName}</div>
                </div>

                <div>
                  {timeLeft.isExpired ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      <AlertTriangle className="w-4 h-4" />
                      <span>منتهي الصلاحية</span>
                    </span>
                  ) : timeLeft.days <= 3 ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                      <Clock className="w-4 h-4" />
                      <span>قارب على الانتهاء</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>اشتراك نشط</span>
                    </span>
                  )}
                </div>
              </div>

              {/* LIVE COUNTDOWN DISPLAY */}
              <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/20">
                <div className="text-xs font-bold text-cyan-400 text-center mb-3">
                  {timeLeft.isExpired ? 'انتهت فترة الاشتراك' : 'العداد التنازلي المتبقي على انتهاء الصلاحية:'}
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-white/5">
                    <div className="text-xl sm:text-2xl font-black font-mono text-white">{timeLeft.days}</div>
                    <div className="text-[10px] text-slate-400 uppercase">يوم</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-white/5">
                    <div className="text-xl sm:text-2xl font-black font-mono text-white">{timeLeft.hours}</div>
                    <div className="text-[10px] text-slate-400 uppercase">ساعة</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-white/5">
                    <div className="text-xl sm:text-2xl font-black font-mono text-white">{timeLeft.minutes}</div>
                    <div className="text-[10px] text-slate-400 uppercase">دقيقة</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-white/5">
                    <div className="text-xl sm:text-2xl font-black font-mono text-rose-400">{timeLeft.seconds}</div>
                    <div className="text-[10px] text-slate-400 uppercase">ثانية</div>
                  </div>
                </div>
              </div>

              {/* Details & Dates */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                  <div className="text-slate-400 flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>تاريخ التفعيل:</span>
                  </div>
                  <div className="font-bold text-slate-200 font-mono">
                    {new Date(foundSub.startDate).toLocaleDateString('ar-EG')}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                  <div className="text-slate-400 flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>تاريخ الانتهاء:</span>
                  </div>
                  <div className="font-bold text-rose-400 font-mono">
                    {new Date(foundSub.expiryDate).toLocaleDateString('ar-EG')}
                  </div>
                </div>
              </div>

              {/* Assigned Games & Products */}
              {assignedProducts.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-2">الألعاب والسكربتات المشمولة في الاشتراك:</div>
                  <div className="space-y-2">
                    {assignedProducts.map(prod => (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-white/5 hover:border-rose-500/30 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Gamepad2 className="w-4 h-4 text-rose-500" />
                          <span className="text-xs sm:text-sm font-bold text-white">{prod.title}</span>
                        </div>
                        {onSelectProduct && (
                          <button
                            onClick={() => {
                              onSelectProduct(prod);
                              onClose();
                            }}
                            className="px-3 py-1 text-xs font-bold bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg transition-colors"
                          >
                            فتح الحزمة
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Renewal Action */}
              <div className="pt-2">
                <button
                  onClick={handleRenewWhatsapp}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-600/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>تجديد الاشتراك بالواتساب المباشر</span>
                </button>
              </div>

            </div>
          )}

          {searched && !foundSub && (
            <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
              <h4 className="text-base font-bold text-white">لم يتم العثور على الكود</h4>
              <p className="text-xs text-slate-400">
                تأكد من كتابة كود الاشتراك بشكل صحيح أو تواصل مع إدارة المتجر عبر الواتساب لتأكيد تفعيل اشتراكك.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
