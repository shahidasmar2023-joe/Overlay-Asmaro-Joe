import { StoreProduct, StoreSettings, SubscriptionLicense, StoreCategory } from '../types';

export const DEFAULT_CATEGORIES: StoreCategory[] = [
  {
    id: 'gta',
    title: 'قائمة الألعاب التخريبية',
    description: 'مودات وسكربتات فوضى وتخريب شاملة لـ GTA V و FiveM مع ربط مباشر بالبثوث والتصويت التفاعلي.',
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    iconName: 'Gamepad2',
    badge: 'حارق 🔥',
    order: 1,
  },
  {
    id: 'pubg',
    title: 'تنبيهات PUBG RTS HD',
    description: 'نظام تنبيهات سينمائي ثلاثي الأبعاد بصوتيات 8D وتأثيرات هولوغرام مع الكيل والكلتشات والبثوث.',
    coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    iconName: 'Radio',
    badge: 'RTS HD ⚡',
    order: 2,
  },
  {
    id: 'scripts',
    title: 'قسم السكربتات والمودات',
    description: 'محررات وسكربتات برمجية بلغات Lua و Python و JS قابلة للتشغيل المباشر والتصدير للحزم المشفرة.',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
    iconName: 'Code2',
    badge: 'أكواد حصرية 💻',
    order: 3,
  },
  {
    id: 'alerts',
    title: 'حزم الأوفرلاي الزجاجية',
    description: 'شاشات Starting Soon، إطارات كاميرا زجاجية ثلاثية الأبعاد بتأثيرات Three.js فخمة للبث.',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    iconName: 'Sparkles',
    badge: '3D Glass 💎',
    order: 4,
  },
  {
    id: 'videos',
    title: 'قسم الفيديوهات والعروض',
    description: 'عروض فيديو سينمائية عالية الدقة 4K و 1080p 60FPS مع تجربة صوتية تفاعلية محمية بالعلامة المائية.',
    coverImage: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80',
    iconName: 'Film',
    badge: '4K 60FPS 🎬',
    order: 5,
  }
];

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Asmaro Overlay',
  storeTagline: 'متجر ألعاب التخريب، تنبيهات الـ ALERTS، ومؤثرات RTS HD',
  storeLogoAvatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  whatsappNumber: '76774306',
  whatsappMessageTemplate: 'مرحباً Asmaro Overlay، أريد الاستفسار والاشتراك في: {product_name} - كود المنتج: {product_id}',
  wishMoneyUrl: 'https://wishmoney.com',
  wishMoneyAccount: '76774306',
  watermarkLogoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  watermarkOpacity: 0.70,
  watermarkPosition: 'top-right',
  adminPasswordHash: 'admin123', // Initial master admin password
  zipProtectionPassword: 'asmaro-secure-2026', // Initial ZIP encryption password
  requireZipPasswordOnExport: true,
  currency: '$',
  themeColor: '#e11d48',
  lastBackupDate: new Date().toISOString(),
};

export const DEFAULT_PRODUCTS: StoreProduct[] = [
  {
    id: 'gta-chaos-v5',
    title: 'مود التخريب الشامل لـ GTA V (Chaos Mod Pro)',
    category: 'gta',
    price: 35,
    discountPrice: 25,
    shortDescription: 'أقوى حزمة تخريب وتأثيرات عشوائية للعبة GTA V مع ربط مباشر بالبثوث التفاعلية والتصويت الحي.',
    fullDescription: 'حزمة GTA V Chaos Mod الحصرية تتيح إشعال الفوضى التلقائية كل 30 ثانية في اللعبة، أو عبر هدايا وتفاعلات البث الحي (TikTok / Kick / Twitch). تشمل أكثر من 180 تأثيراً خارقاً (الجاذبية الصفرية، تفجير المركبات، تبديل الشخصيات، وضع الراكيت، وغيرها).',
    features: [
      'أكثر من 180 تأثيراً عشوائياً وتخريبياً فائق السلاسة',
      'دعم كامل لـ FiveM و GTA V Story Mode',
      'ربط فوري بأحداث الشات والتبرعات في البث المباشر',
      'لوحة تحكم شفافة تظهر على الشاشة (Overlay Glass UI)',
      'تحديثات تلقائية وحماية ضد الكراش'
    ],
    tags: ['GTA V', 'Chaos Mod', 'FiveM', 'تخريب', 'Stream Overlay'],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-city-with-flying-cars-and-traffic-41544-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80'
    ],
    scriptFileName: 'gta_chaos_engine.lua',
    scriptCode: `-- [Overlay Asmaro] GTA V Chaos Mod Engine v5.2
local effects = {"SuperJump", "ExplodeVehicle", "LowGravity", "ZeroFriction", "TeleportToSky", "SpawnTank"}
local currentEffect = nil

Citizen.CreateThread(function()
    print("^2[Overlay Asmaro] Chaos Engine Initialized Successfully^7")
    while true do
        Citizen.Wait(30000) -- Trigger random effect every 30 seconds
        local randIndex = math.random(1, #effects)
        currentEffect = effects[randIndex]
        TriggerEvent("asmaro:chaos:trigger", currentEffect)
    end
end)`,
    largeDownloadUrl: 'https://drive.google.com/drive/folders/gta-chaos-package-asmaro',
    fileSize: '4.8 GB',
    isHot: true,
    isNew: true,
    audioAlertUrl: 'https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3',
    version: 'v5.4.1',
    supportedPlatforms: ['PC (Windows)', 'FiveM', 'OBS Studio', 'Streamlabs'],
    viewsCount: 1420
  },
  {
    id: 'pubg-rts-alert-pack',
    title: 'حزمة تنبيهات PUBG RTS التفاعلية HD',
    category: 'pubg',
    price: 40,
    discountPrice: 29,
    shortDescription: 'نظام تنبيهات سينمائي ثلاثي الأبعاد بصوتيات 8D وتأثيرات زجاجية تظهر فوراً مع الكيل والكلتشات.',
    fullDescription: 'تنبيهات البث الحصرية للعبة PUBG مع ميزة RTS (Real-Time Synchronizer). بمجرد إحراز فوز أو كيل أو تلقي دونيشن، يتم تشغيل مجسم زجاجي ثلاثي الأبعاد مع هولوغرام وعداد كيلات حي وتأثير صوتي ثلاثي الأبعاد.',
    features: [
      'تنبيهات Kill Feed سينمائية ثلاثية الأبعاد',
      'مؤثرات صوتية محيطية بدقة WAV فائقة النقاء',
      'دعم كامل لبرامج البث OBS, Prism, Streamlabs',
      'تخصيص كامل للألوان والشعار واسم الاستريمر',
      'استهلاك شبه معدوم لمعالج الرسوميات GPU'
    ],
    tags: ['PUBG', 'RTS Alerts', 'Stream Alert', '3D Glass', 'Sound FX'],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-game-animation-of-a-character-in-a-futuristic-robot-suit-42861-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80'
    ],
    scriptFileName: 'pubg_overlay_tracker.js',
    scriptCode: `// [Overlay Asmaro] PUBG RTS Stream Synchronizer
const socket = new WebSocket("wss://stream-events.overlayasmaro.local:8080");

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'PUBG_KILL' || data.type === 'DONATION') {
    window.trigger3DAlert({
      title: data.player + " DESTROYED ENEMY!",
      kills: data.kills,
      tier: "MYTHIC_GLASS"
    });
  }
};`,
    largeDownloadUrl: 'https://mega.nz/file/pubg-rts-ultra-pack-asmaro',
    fileSize: '1.2 GB',
    isHot: true,
    isNew: false,
    audioAlertUrl: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
    version: 'v2.8.0',
    supportedPlatforms: ['PC / Mobile Stream', 'OBS Browser Source', 'StreamElements'],
    viewsCount: 2310
  },
  {
    id: 'alerts-hd-glass-pack',
    title: 'حزمة شاشات وأوفرلاي زجاجي ثلاثي الأبعاد (Glassmorphic Alerts HD)',
    category: 'alerts',
    price: 30,
    discountPrice: 20,
    shortDescription: 'قوالب أوفرلاي زجاجية فخمة لغرف البث وثيمات Starting Soon و Be Right Back مع حركات Three.js.',
    fullDescription: 'حزمة البث الاحترافية الشاملة بتصميم زجاجي عائم (Glassmorphism 3D). تشمل شاشة البداية، شاشة الاستراحة، إطارات الكاميرا (Webcam Frames)، وتنبيهات المتابعة والدعم.',
    features: [
      'إطارات كاميرا زجاجية تفاعلية مع حواف نيون ناعمة',
      'مشاهد بث كاملة (Starting Soon, BRB, Ending)',
      'متوافقة 100% مع البث على تيك توك، تويتش، يوتيوب وكيك',
      'أداء خفيف جداً يضمن 60FPS أثناء اللعب والبث معاً'
    ],
    tags: ['Overlays', 'Glass UI', 'OBS Theme', 'Twitch', 'Kick'],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-loop-with-lights-flowing-42358-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80'
    ],
    scriptFileName: 'glass_overlay_config.json',
    scriptCode: `{
  "theme": "glassmorphic_asmaro",
  "blurIntensity": "24px",
  "borderGlow": "rgba(225, 29, 72, 0.4)",
  "enable3DParticles": true,
  "fpsCap": 60
}`,
    largeDownloadUrl: 'https://drive.google.com/drive/folders/glass-overlays-hd',
    fileSize: '850 MB',
    isHot: false,
    isNew: true,
    audioAlertUrl: 'https://assets.mixkit.co/active_storage/sfx/2871/2871-preview.mp3',
    version: 'v4.0.0',
    supportedPlatforms: ['OBS Studio', 'Prism Live', 'vMix'],
    viewsCount: 980
  },
  {
    id: 'scripts-mod-injector-pro',
    title: 'أداة تشغيل وسكربتات التخريب التلقائي (Asmaro Script Suite)',
    category: 'scripts',
    price: 45,
    discountPrice: 35,
    shortDescription: 'أداة تنفيذ سكربتات الألعاب مع محرر كود مدمج وحماية متقدمة ومكتبة أوامر جاهزة.',
    fullDescription: 'حزمة برمجية متقدمة لتنفيذ السكربتات في ألعاب العالم المفتوح وألعاب الشوتر. تحتوي على محرر أكواد داخلي، ومكتبة تضم أكثر من 50 سكربت تخريب مبرمج ومختبر مسبقاً، مع واجهة سهلة للتبديل بين السكربتات بضغطة زر.',
    features: [
      'أكثر من 50 سكربت حصري جاهز للاستخدام الفوري',
      'محرر أكواد مدمج يدعم لغات Lua, Python, AutoHotkey',
      'إمكانية تصدير وحفظ السكربتات داخل حزم ZIP المشفرة',
      'ميزة المفاتيح السريعة (Hotkeys) للتبديل الفوري أثناء اللعب'
    ],
    tags: ['Scripting', 'Lua', 'Automation', 'Trainer', 'Mod Engine'],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-typing-on-a-keyboard-in-a-dark-room-42398-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80'
    ],
    scriptFileName: 'asmaro_script_runner.py',
    scriptCode: `# [Overlay Asmaro] High-Speed Script Execution Gateway
import time
import os

print("[+] Initializing Asmaro Script Gateway...")
def run_chaos_sequence(target_game):
    print(f"[!] Hooking sequence to: {target_game}")
    time.sleep(1)
    print("[SUCCESS] Script injected safely without footprint.")

run_chaos_sequence("GTA5_Chaos_v5")`,
    largeDownloadUrl: 'https://mega.nz/file/asmaro-scripts-injector',
    fileSize: '340 MB',
    isHot: true,
    isNew: true,
    audioAlertUrl: 'https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3',
    version: 'v3.2.0',
    supportedPlatforms: ['Windows 10 / 11 64-bit', 'Steam', 'Epic Games'],
    viewsCount: 3120
  },
  {
    id: 'video-showcase-trailer-4k',
    title: 'عرض سينمائي شامل 4K - فوضى وألعاب التخريب (Cinematic Trailer)',
    category: 'videos',
    price: 15,
    discountPrice: 10,
    shortDescription: 'فيديو استعراض سينمائي كامل بدقة 4K و 60 إطار بالثانية يوضح كافة تأثيرات التخريب والتنبيهات المباشرة.',
    fullDescription: 'حزمة وسائط مرئية تشمل فيديو تسويقي واستعراضي كامل بدقة Ultra HD 4K، معد بتقنيات ما بعد الإنتاج مع مؤثرات بصرية وصوتية احترافية لاستخدامها في إعلانات البث وغرف الديسكورد والإنترو.',
    features: [
      'دقة 4K فائقة الوضوح ومعدل 60FPS سلس',
      'موسيقى تصويرية ومؤثرات صوتية حصرية مرخصة',
      'جاهز للاستخدام كـ Intro أو Teaser للبثوث الحية',
      'ملفات خام جاهزة للمونتاج والتعديل'
    ],
    tags: ['4K Video', 'Trailer', 'Intro', 'Media Pack', 'Showcase'],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-charts-and-data-31912-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&auto=format&fit=crop&q=80'
    ],
    largeDownloadUrl: 'https://drive.google.com/drive/folders/4k-cinematic-trailer-asmaro',
    fileSize: '2.1 GB',
    isHot: true,
    isNew: true,
    audioAlertUrl: 'https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3',
    version: 'v1.0.0 (4K 60FPS)',
    supportedPlatforms: ['OBS Studio', 'Premiere Pro', 'DaVinci Resolve', 'TikTok / YouTube'],
    viewsCount: 4500
  }
];

export const DEFAULT_SUBSCRIPTIONS: SubscriptionLicense[] = [
  {
    id: 'sub-demo-1',
    code: 'ASMARO-GTA-8921-VIP',
    customerName: 'كريم الأحمد (ستريمر)',
    customerPhone: '+96170123456',
    productIds: ['gta-chaos-v5', 'pubg-rts-alert-pack'],
    durationDays: 30,
    startDate: new Date(Date.now() - 10 * 86400000).toISOString(),
    expiryDate: new Date(Date.now() + 20 * 86400000).toISOString(),
    status: 'active',
    notes: 'اشتراك شهر كامل مع تنبيهات البثوث',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-demo-2',
    code: 'ASMARO-PUBG-4500-PRO',
    customerName: 'محمد الخالد',
    customerPhone: '+96176112233',
    productIds: ['pubg-rts-alert-pack', 'scripts-mod-injector-pro'],
    durationDays: 45,
    startDate: new Date(Date.now() - 43 * 86400000).toISOString(),
    expiryDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: 'expiring',
    notes: 'تحديد مخصص 45 يوماً - قارب على الانتهاء',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-demo-3',
    code: 'ASMARO-CHAOS-9900-EXP',
    customerName: 'جاد شاهين',
    customerPhone: '+96171998877',
    productIds: ['gta-chaos-v5'],
    durationDays: 15,
    startDate: new Date(Date.now() - 20 * 86400000).toISOString(),
    expiryDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    status: 'expired',
    notes: 'اشتراك 15 يوماً مخصص - منتهي',
    createdAt: new Date().toISOString(),
  }
];
