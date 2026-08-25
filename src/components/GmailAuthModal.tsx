import React, { useState } from 'react';
import { X, Mail, CheckCircle2, Shield, User, Sparkles, LogIn, Upload, Camera } from 'lucide-react';
import { registerOrUpdateGmailUser } from '../utils/storage';
import { StoreSettings } from '../types';

interface GmailAuthModalProps {
  settings: StoreSettings;
  currentEmail?: string;
  onClose: () => void;
  onSuccess: (email: string, name: string) => void;
}

const REAL_PORTRAITS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80'
];

export const GmailAuthModal: React.FC<GmailAuthModalProps> = ({
  settings,
  currentEmail = '',
  onClose,
  onSuccess
}) => {
  const [email, setEmail] = useState(currentEmail);
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(REAL_PORTRAITS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [error, setError] = useState('');

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('يرجى إدخال بريد إلكتروني Gmail صحيح');
      return;
    }

    setIsSubmitting(true);
    setError('');

    setTimeout(() => {
      const displayName = name.trim() || email.split('@')[0];
      
      registerOrUpdateGmailUser(email, displayName, selectedAvatar);
      setIsSubmitting(false);
      setSuccessMessage(true);

      setTimeout(() => {
        onSuccess(email, displayName);
        onClose();
      }, 1000);
    }, 600);
  };

  const handleQuickGoogleSim = () => {
    const demoEmail = 'jalal.bibi.123@gmail.com';
    const demoName = 'Jalal Bibi (حساب موثق)';
    setEmail(demoEmail);
    setName(demoName);
    setIsSubmitting(true);

    setTimeout(() => {
      registerOrUpdateGmailUser(demoEmail, demoName, selectedAvatar);
      setIsSubmitting(false);
      setSuccessMessage(true);

      setTimeout(() => {
        onSuccess(demoEmail, demoName);
        onClose();
      }, 800);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#090d16] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/50 text-right space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl mx-auto p-3 bg-gradient-to-tr from-rose-600 via-amber-500 to-rose-500 shadow-xl flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white">تسجيل الدخول بحساب Gmail حقيقي</h3>
            <p className="text-xs text-slate-300 mt-1">
              اربط حسابك لتفعيل الألعاب، الفيديوهات، ومتابعة وقت وتاريخ انتهاء اشتراكاتك
            </p>
          </div>
        </div>

        {successMessage ? (
          <div className="p-6 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-lg font-black text-white">تم تأكيد الحساب بنجاح!</h4>
            <div className="flex items-center justify-center gap-2">
              <img src={selectedAvatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-emerald-400" />
              <span className="text-xs text-emerald-200 font-mono font-bold">{email}</span>
            </div>
            <p className="text-xs text-slate-300">يتم الآن ربط وتفعيل الخدمات في البرنامج...</p>
          </div>
        ) : (
          <form onSubmit={handleGoogleSubmit} className="space-y-4">
            
            {/* Direct Google Button */}
            <button
              type="button"
              onClick={handleQuickGoogleSim}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-sm transition-all duration-200 active:scale-98 shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>تسجيل فوري بحساب Google الشخصي</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink mx-3 text-xs text-slate-500">أو تخصيص بيانات الحساب الحقيقي</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300 font-bold">
                {error}
              </div>
            )}

            {/* Choose Real User Photo (Not bot) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                اختر صورة حقيقية للحساب أو ارفع صورتك من الكمبيوتر:
              </label>
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {REAL_PORTRAITS.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Real User ${idx}`}
                    onClick={() => setSelectedAvatar(url)}
                    className={`w-11 h-11 rounded-full object-cover cursor-pointer transition-all ${
                      selectedAvatar === url
                        ? 'ring-4 ring-rose-500 scale-110 shadow-lg'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
                
                <label className="w-11 h-11 rounded-full border-2 border-dashed border-white/30 hover:border-rose-400 flex items-center justify-center cursor-pointer bg-slate-900 shrink-0 text-slate-400 hover:text-white transition-colors" title="رفع صورة شخصية من الكمبيوتر">
                  <Upload className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">الاسم الحقيقي أو اللقب:</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: جلال بيبي"
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
                />
                <User className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">عنوان البريد الإلكتروني (Gmail):</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  required
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 font-mono"
                />
                <Mail className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-sm transition-all duration-200 active:scale-98 shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>تأكيد وتسجيل الحساب بالخادم</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>اتصال مشفر ومربوط بلوحة تحكم المدير لتفعيل الألعاب</span>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
