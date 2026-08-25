import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface OnlineGuardProps {
  children: React.ReactNode;
  requireOnline?: boolean;
}

export const OnlineGuard: React.FC<OnlineGuardProps> = ({ children, requireOnline = true }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [checking, setChecking] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic heartbeat verification
    const interval = setInterval(() => {
      setIsOnline(navigator.onLine);
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleRetry = () => {
    setChecking(true);
    setTimeout(() => {
      setIsOnline(navigator.onLine);
      setChecking(false);
    }, 800);
  };

  if (!isOnline && requireOnline) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-2xl text-slate-100 select-none">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-rose-500/40 shadow-2xl shadow-rose-950/60 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center shadow-lg shadow-rose-600/30">
            <WifiOff className="w-10 h-10 text-rose-400 animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-black border border-rose-500/30">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>تنبيه الاتصال بالخادم المركزي</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              برنامج Overlay Asmaro يتطلب اتصالاً نشطاً بالإنترنت
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              لتشغيل خدمات التراخيص، مزامنة الخوادم، والتأكد من أمان الحزم بصيغة AXA / EXE، يجب أن يكون جهازك متصلاً بشبكة الإنترنت.
            </p>
          </div>

          <button
            onClick={handleRetry}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-sm font-black bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-xl shadow-rose-600/40 active:scale-95 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'جاري التحقق من الشبكة...' : 'إعادة فحص الاتصال بالإنترنت'}</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
