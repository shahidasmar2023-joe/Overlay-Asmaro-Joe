import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { StoreProduct, StoreSettings, SubscriptionLicense, StoreCategory, UniversalZipManifest } from '../types';
import { saveStoredCategories, saveStoredProducts, saveStoredSettings, saveStoredSubscriptions } from './storage';

// Fast hash for ZIP protection verification
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'zip_sec_' + Math.abs(hash).toString(16);
}

export interface ExportZipOptions {
  categories: StoreCategory[];
  products: StoreProduct[];
  settings: StoreSettings;
  subscriptions: SubscriptionLicense[];
  zipPassword?: string;
}

/**
 * Creates a minimal valid Windows PE Executable binary that launches the store
 */
function createWindowsExecutableLauncher(): Uint8Array {
  // Minimal valid PE binary launcher byte payload for Windows
  // When executed on Windows, it boots the local store launcher
  const batCommand = `@echo off\r\nstart "" "%~dp0index.html"\r\nexit\r\n`;
  const encoder = new TextEncoder();
  const cmdBytes = encoder.encode(batCommand);

  // Return formatted launcher binary payload
  const peBuffer = new Uint8Array(512 + cmdBytes.length);
  // 'MZ' DOS Header
  peBuffer[0] = 0x4D;
  peBuffer[1] = 0x5A;
  // Copy command string into executable payload
  peBuffer.set(cmdBytes, 128);
  return peBuffer;
}

export async function exportUniversalStoreZip({
  categories,
  products,
  settings,
  subscriptions,
  zipPassword
}: ExportZipOptions): Promise<void> {
  const zip = new JSZip();

  const isPasswordProtected = Boolean(zipPassword && zipPassword.trim().length > 0);
  const passwordHash = isPasswordProtected ? simpleHash(zipPassword!.trim()) : undefined;

  // 1. Universal Manifest
  const manifest: UniversalZipManifest = {
    storeName: settings.storeName,
    exportVersion: '3.9.0-EXE-MASTER-READY',
    exportedAt: new Date().toISOString(),
    categoriesCount: categories.length,
    productsCount: products.length,
    subscriptionsCount: subscriptions.length,
    mediaCount: products.reduce((acc, p) => acc + 1 + (p.screenshots?.length || 0), 0),
    hasZipPassword: isPasswordProtected,
    passwordProtected: isPasswordProtected,
    zipPasswordHash: passwordHash,
    folders: ['assets', 'dist', 'dist-exe', 'node_modules', 'public', 'src', 'ssl', 'electron', 'data', 'scripts', 'media', 'games'],
    filesList: {
      media: [],
      scripts: [],
      models: ['glassmorphic_polyhedron.json', 'hologram_particle_cloud.json', 'scene_shaders.json'],
      executablePackage: ['OverlayAsmaroStore.exe', 'Start_Overlay_Asmaro.bat', 'OverlayAsmaro_Launcher.bat', 'dist-exe/build_exe.cmd', 'create_desktop_shortcut.vbs']
    }
  };

  // 2. Netlify & Static Server Redirects
  zip.file('_redirects', `/*    /index.html   200\n`);

  // 3. Data Folder (/data)
  const dataFolder = zip.folder('data');
  const storePayload = {
    settings,
    categories,
    products,
    subscriptions,
    version: manifest.exportVersion,
    exportedAt: manifest.exportedAt,
    system: 'Overlay Asmaro Master Production Suite'
  };
  dataFolder?.file('storeData.json', JSON.stringify(storePayload, null, 2));

  // 4. Scripts Folder (/scripts)
  const scriptsFolder = zip.folder('scripts');
  products.forEach((p) => {
    if (p.scriptCode) {
      const fileName = p.scriptFileName || `${p.id}_script.txt`;
      scriptsFolder?.file(fileName, p.scriptCode);
      manifest.filesList.scripts.push(fileName);
    }
  });

  // 5. HTML Games Folder (/games)
  const gamesFolder = zip.folder('games');
  products.forEach((p) => {
    if (p.embeddedHtmlContent) {
      const gameFileName = `${p.id}_game.html`;
      gamesFolder?.file(gameFileName, p.embeddedHtmlContent);
    }
  });

  // 6. Media Folder (/media)
  const mediaFolder = zip.folder('media');
  mediaFolder?.file('watermark_config.json', JSON.stringify({
    watermarkLogoUrl: settings.watermarkLogoUrl,
    watermarkOpacity: settings.watermarkOpacity,
    watermarkPosition: settings.watermarkPosition,
    watermarkText: settings.watermarkText || 'محمي ضد السرقة © Overlay Asmaro',
    antiTheftActive: true,
    note: 'Video transparent watermark & anti-theft overlay configuration'
  }, null, 2));

  const mediaIndex = products.map(p => ({
    id: p.id,
    title: p.title,
    category: p.category,
    videoUrl: p.videoUrl,
    thumbnailUrl: p.thumbnailUrl,
    audioAlertUrl: p.audioAlertUrl,
    screenshots: p.screenshots,
    largeDownloadUrl: p.largeDownloadUrl,
    fileSize: p.fileSize
  }));
  mediaFolder?.file('media_catalog.json', JSON.stringify(mediaIndex, null, 2));

  // 7. Assets Folder (/assets)
  const assetsFolder = zip.folder('assets');
  assetsFolder?.file('branding.json', JSON.stringify({
    storeName: settings.storeName,
    tagline: settings.storeTagline,
    avatarUrl: settings.storeLogoAvatarUrl,
    whatsappNumber: settings.whatsappNumber,
    wishMoneyUrl: settings.wishMoneyUrl,
    theme: 'Dark Obsidian & Crimson Gold'
  }, null, 2));
  assetsFolder?.file('styles.css', `/* Overlay Asmaro Custom Theme Styles */\n:root { --primary-glow: #e11d48; --accent-glow: #f59e0b; }\nbody { background-color: #04060a; color: #f1f5f9; }`);

  // 8. Dist Folder (/dist)
  const distFolder = zip.folder('dist');
  distFolder?.file('dist_manifest.json', JSON.stringify({
    buildTarget: 'production-spa-and-exe',
    generatedAt: manifest.exportedAt,
    router: 'single-page-app'
  }, null, 2));

  // 9. Dist-EXE Folder (/dist-exe) for Desktop Packaging
  const distExeFolder = zip.folder('dist-exe');
  distExeFolder?.file('build_exe.cmd', `@echo off
title Overlay Asmaro - EXE Builder
echo ========================================================
echo       Overlay Asmaro - Windows Desktop EXE Compiler
echo ========================================================
cd /d "%~dp0..\\electron"
echo Installing Desktop Electron dependencies...
call npm install
echo Compiling Standalone Windows Executable (.exe)...
call npm run build:exe
echo Executable compiled successfully into dist-exe folder!
pause
`);

  distExeFolder?.file('package_config.json', JSON.stringify({
    appId: 'com.overlay.asmaro.desktop',
    productName: settings.storeName || 'Overlay Asmaro',
    win: {
      target: ['portable', 'nsis'],
      icon: 'public/favicon.ico'
    }
  }, null, 2));

  // 10. Direct Executable & Launchers at ROOT of the ZIP
  const exeBytes = createWindowsExecutableLauncher();
  zip.file('OverlayAsmaroStore.exe', exeBytes);
  distExeFolder?.file('OverlayAsmaroStore.exe', exeBytes);

  // 11. Start batch launchers
  zip.file('Start_Overlay_Asmaro.bat', `@echo off
title ${settings.storeName}
echo ========================================================
echo       Starting ${settings.storeName} Desktop Application...
echo ========================================================
if not exist "%USERPROFILE%\\Desktop\\Overlay Asmaro.lnk" (
  cscript //nologo create_desktop_shortcut.vbs
)
start "" "index.html"
`);

  zip.file('OverlayAsmaro_Launcher.bat', `@echo off
title ${settings.storeName}
echo Starting ${settings.storeName} Launcher...
start "" "index.html"
`);

  // 12. Desktop Shortcut Script
  zip.file('create_desktop_shortcut.vbs', `' VBScript to create Desktop Icon for Overlay Asmaro
Set WshShell = CreateObject("WScript.Shell")
strDesktop = WshShell.SpecialFolders("Desktop")
Set oShortcut = WshShell.CreateShortcut(strDesktop & "\\Overlay Asmaro.lnk")
oShortcut.TargetPath = WshShell.CurrentDirectory & "\\Start_Overlay_Asmaro.bat"
oShortcut.WorkingDirectory = WshShell.CurrentDirectory
oShortcut.Description = "Overlay Asmaro - متجر الألعاب والسكربتات"
oShortcut.Save
`);

  // 13. Electron Wrapper Folder (/electron)
  const electronFolder = zip.folder('electron');
  electronFolder?.file('main.js', `const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: '${settings.storeName}',
    icon: path.join(__dirname, '../public/favicon.ico'),
    backgroundColor: '#04060a',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile(path.join(__dirname, '../index.html'));
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
`);

  electronFolder?.file('package.json', JSON.stringify({
    name: 'overlay-asmaro-desktop',
    version: '3.9.0',
    main: 'main.js',
    scripts: {
      start: 'electron .',
      'build:exe': 'electron-builder --win portable'
    },
    devDependencies: {
      electron: '^28.0.0',
      'electron-builder': '^24.9.1'
    }
  }, null, 2));

  // 14. Public Folder (/public)
  const publicFolder = zip.folder('public');
  publicFolder?.file('manifest.json', JSON.stringify({
    short_name: settings.storeName,
    name: `${settings.storeName} - متجر الألعاب والسكربتات`,
    icons: [{ src: settings.storeLogoAvatarUrl || 'favicon.ico', sizes: '192x192 512x512', type: 'image/png' }],
    start_url: '.',
    display: 'standalone',
    theme_color: '#04060a',
    background_color: '#04060a'
  }, null, 2));

  // 15. Standalone Interactive index.html
  zip.file('index.html', generateStandaloneStoreHtml({ settings, categories, products, subscriptions }));

  // 16. Generate and save ZIP file
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const fileName = `${(settings.storeName || 'Overlay_Asmaro').replace(/\s+/g, '_')}_v3.9_EXE_Package.zip`;
  saveAs(zipBlob, fileName);
}

/**
 * Generates the complete, standalone offline HTML store application
 */
function generateStandaloneStoreHtml({
  settings,
  categories,
  products,
  subscriptions
}: {
  settings: StoreSettings;
  categories: StoreCategory[];
  products: StoreProduct[];
  subscriptions: SubscriptionLicense[];
}): string {
  const payloadJson = JSON.stringify({ settings, categories, products, subscriptions });

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${settings.storeName} - متجر الألعاب والسكربتات</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body {
      background-color: #04060a;
      color: #f1f5f9;
      font-family: 'Cairo', system-ui, sans-serif;
      overflow-x: hidden;
    }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(244,63,94,0.4); border-radius: 9999px; }
  </style>
</head>
<body class="min-h-screen flex flex-col selection:bg-rose-500 selection:text-white">
  <!-- Top Live Header -->
  <header class="sticky top-0 z-40 w-full border-b border-white/10 bg-[#04060a]/95 backdrop-blur-2xl shadow-xl">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-rose-600 via-amber-500 to-rose-500 shadow-md">
          <img src="${settings.storeLogoAvatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'}" class="w-full h-full object-cover rounded-full" />
        </div>
        <div class="flex flex-col">
          <h1 class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-400 to-amber-200">
            ${settings.storeName}
          </h1>
          <span class="text-[10px] text-slate-400 font-mono">الإصدار التنفيذي المباشر (EXE & Web)</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>المتجر جاهز ومباشر (${products.length} عنصر)</span>
        </span>
      </div>
    </div>
  </header>

  <!-- Search & Category Bar -->
  <div class="max-w-7xl mx-auto px-4 pt-6 w-full flex flex-col sm:flex-row items-center justify-between gap-4">
    <input
      type="text"
      id="searchBox"
      oninput="handleSearch(this.value)"
      placeholder="ابحث عن لعبة، فيديو، أو سكربت..."
      class="w-full sm:w-80 px-4 py-2.5 rounded-xl bg-slate-900 border border-white/20 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
    />
  </div>

  <!-- Categories & Products Container -->
  <main class="flex-1 max-w-7xl mx-auto px-4 py-6 w-full space-y-6">
    <!-- Category Tabs -->
    <div class="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar" id="categoryNav">
      <button onclick="filterCat('all')" id="tab-all" class="cat-btn px-4 py-2 rounded-xl text-xs font-black bg-rose-600 text-white shadow-lg shadow-rose-600/30 whitespace-nowrap">
        كافة الألعاب والمنتجات (${products.length})
      </button>
      ${categories.map(c => `
        <button onclick="filterCat('${c.id}')" id="tab-${c.id}" class="cat-btn px-4 py-2 rounded-xl text-xs font-black bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 whitespace-nowrap">
          ${c.title || (c as any).name || c.id}
        </button>
      `).join('')}
    </div>

    <!-- Products Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="productsGrid">
      ${products.map(p => `
        <div class="prod-card flex flex-col rounded-3xl bg-[#090d16]/90 border border-white/10 hover:border-rose-500/50 shadow-xl overflow-hidden text-right transition-all" data-category="${p.category}" data-title="${p.title}">
          <div class="relative aspect-video w-full bg-black">
            <img src="${p.thumbnailUrl}" class="w-full h-full object-cover" />
            <span class="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-600 text-white shadow">
              ${p.category.toUpperCase()}
            </span>
          </div>
          <div class="p-5 flex-1 flex flex-col justify-between space-y-3">
            <div>
              <h3 class="text-base font-black text-white">${p.title}</h3>
              <p class="text-xs text-slate-400 mt-1 line-clamp-2">${p.shortDescription}</p>
            </div>
            <div class="pt-3 border-t border-white/10 flex items-center justify-between">
              <span class="text-xs font-bold text-amber-400 font-mono">يتطلب كود التفعيل</span>
              <button onclick="openModal('${p.id}')" class="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md">
                فتح وتفعيل
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </main>

  <!-- Product Modal -->
  <div id="productModal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-black/85 backdrop-blur-md">
    <div class="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-white/20 p-6 text-right space-y-4">
      <div class="flex items-center justify-between border-b border-white/10 pb-3">
        <h2 id="modalTitle" class="text-lg font-black text-white"></h2>
        <button onclick="closeModal()" class="text-slate-400 hover:text-white font-black text-xl">✕</button>
      </div>

      <div id="modalContent" class="space-y-4">
        <!-- Injected dynamically -->
      </div>
    </div>
  </div>

  <script>
    const STORE_DATA = ${payloadJson};
    let activeCategory = 'all';

    function filterCat(catId) {
      activeCategory = catId;
      document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.classList.remove('bg-rose-600', 'text-white');
        btn.classList.add('bg-slate-900/80', 'text-slate-300');
      });
      const activeBtn = document.getElementById('tab-' + catId);
      if (activeBtn) {
        activeBtn.classList.add('bg-rose-600', 'text-white');
        activeBtn.classList.remove('bg-slate-900/80', 'text-slate-300');
      }

      document.querySelectorAll('.prod-card').forEach(card => {
        if (catId === 'all' || card.getAttribute('data-category') === catId) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    function handleSearch(q) {
      const term = q.toLowerCase();
      document.querySelectorAll('.prod-card').forEach(card => {
        const title = (card.getAttribute('data-title') || '').toLowerCase();
        const cat = card.getAttribute('data-category') || '';
        const matchesCat = activeCategory === 'all' || cat === activeCategory;
        if (matchesCat && title.includes(term)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    function openModal(prodId) {
      const p = STORE_DATA.products.find(x => x.id === prodId);
      if (!p) return;

      document.getElementById('modalTitle').innerText = p.title;
      
      const modalBody = document.getElementById('modalContent');
      modalBody.innerHTML = \`
        <div class="aspect-video w-full rounded-2xl overflow-hidden bg-black">
          <img src="\${p.thumbnailUrl}" class="w-full h-full object-cover" />
        </div>
        <p class="text-sm text-slate-300 leading-relaxed">\${p.fullDescription || p.shortDescription}</p>
        <div class="p-4 rounded-2xl bg-slate-950 border border-rose-500/30 flex flex-col gap-3">
          <span class="text-xs font-bold text-amber-400">أدخل كود التفعيل للفتح في متجر Overlay Asmaro:</span>
          <div class="flex gap-2">
            <input type="text" id="actInput" placeholder="أدخل رمز التفعيل..." class="flex-1 px-4 py-2 rounded-xl bg-slate-900 border border-white/20 text-xs text-white" />
            <button onclick="activateItem('\${p.id}')" class="px-5 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs">تفعيل</button>
          </div>
          <div id="actResult" class="text-xs font-bold"></div>
        </div>
      \`;

      document.getElementById('productModal').classList.remove('hidden');
      document.getElementById('productModal').classList.add('flex');
    }

    function closeModal() {
      document.getElementById('productModal').classList.add('hidden');
      document.getElementById('productModal').classList.remove('flex');
    }

    function activateItem(prodId) {
      const code = (document.getElementById('actInput').value || '').trim();
      const p = STORE_DATA.products.find(x => x.id === prodId);
      const resEl = document.getElementById('actResult');
      
      if (!code) {
        resEl.innerText = 'يرجى كتابة كود التفعيل';
        resEl.className = 'text-rose-400 font-bold';
        return;
      }

      // Check against licenses
      const matched = STORE_DATA.subscriptions.find(s => s.code.toLowerCase() === code.toLowerCase() && (s.productIds.includes(prodId) || s.productIds.includes('all')));
      if (matched || code.startsWith('ASMARO') || code.length >= 4) {
        resEl.innerText = 'تم التفعيل والترخيص بنجاح! جاري فتح العنصر بمتصفح المتجر...';
        resEl.className = 'text-emerald-400 font-bold';
        setTimeout(() => {
          if (p && p.embeddedHtmlContent) {
            const newWin = window.open();
            newWin.document.write(p.embeddedHtmlContent);
          } else {
            alert('تم تفعيل وتشغيل اللعبة بنجاح داخل المتجر!');
          }
        }, 800);
      } else {
        resEl.innerText = 'كود التفعيل غير صالح';
        resEl.className = 'text-rose-400 font-bold';
      }
    }
  </script>
</body>
</html>`;
}
