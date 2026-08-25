import React, { useState, useEffect, useRef } from 'react';
import {
  X, Maximize2, Minimize2, RotateCcw, Shield, Clock, Play,
  Camera, Upload, FolderOpen, Save, CheckCircle2, Image as ImageIcon,
  Download, Trash2, Sparkles, FileText, Check
} from 'lucide-react';
import { StoreProduct } from '../types';
import {
  getStoredGameFiles,
  saveStoredGameFile,
  deleteStoredGameFile,
  SavedGameFile
} from '../utils/storage';

interface InAppBrowserModalProps {
  product: StoreProduct;
  onClose: () => void;
  userGrantedExpiry?: string;
}

export const InAppBrowserModal: React.FC<InAppBrowserModalProps> = ({
  product,
  onClose,
  userGrantedExpiry
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(Date.now());
  const [savedFiles, setSavedFiles] = useState<SavedGameFile[]>([]);
  const [isFilesDrawerOpen, setIsFilesDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load saved files on mount
  useEffect(() => {
    const loadFiles = () => {
      setSavedFiles(getStoredGameFiles(product.id));
    };
    loadFiles();
    window.addEventListener('asmaro_store_updated', loadFiles);
    return () => window.removeEventListener('asmaro_store_updated', loadFiles);
  }, [product.id]);

  // Listen to messages from game iframe (e.g. screenshot taken or save state)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'ASMARO_GAME_SCREENSHOT') {
        const file: SavedGameFile = {
          id: `scr-${Date.now()}`,
          productId: product.id,
          fileName: `لقطة شاشة - ${product.title} - ${new Date().toLocaleTimeString('ar-LB')}`,
          fileType: 'screenshot',
          dataUrl: event.data.dataUrl,
          size: 'لقطة شاشة مباشرة',
          createdAt: new Date().toISOString()
        };
        saveStoredGameFile(file);
        showToast('تم حفظ لقطة الشاشة بنجاح مع ملفات اللعبة في البرنامج!');
      }

      if (event.data.type === 'ASMARO_SAVE_GAME_STATE') {
        try {
          localStorage.setItem(`asmaro_game_state_${product.id}`, JSON.stringify(event.data.state));
          showToast('تم حفظ تقدم وبيانات اللعبة بنجاح!');
        } catch (e) {
          console.error(e);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [product.id, product.title]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleCaptureScreenshot = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'CAPTURE_SCREENSHOT_REQUEST' }, '*');
    }
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newSavedFile: SavedGameFile = {
        id: `file-${Date.now()}`,
        productId: product.id,
        fileName: file.name,
        fileType: file.type.startsWith('image/') ? 'image' : 'custom_file',
        dataUrl: dataUrl,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        createdAt: new Date().toISOString()
      };
      saveStoredGameFile(newSavedFile);
      showToast(`تم حفظ وتخزين "${file.name}" بنجاح مع اللعبة في البرنامج!`);

      // Inform running game iframe about new image/texture
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'CUSTOM_ASSET_LOADED',
          asset: newSavedFile
        }, '*');
      }
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const handleDeleteFile = (fileId: string) => {
    deleteStoredGameFile(fileId, product.id);
    showToast('تم حذف الملف من تخزين اللعبة');
  };

  const handleRestart = () => {
    setKey(Date.now());
  };

  // Generate safe HTML5 runner iframe content with persistence and image loader capabilities
  const generateGameHtml = () => {
    if (product.embeddedHtmlContent) {
      return product.embeddedHtmlContent;
    }

    const savedStateStr = localStorage.getItem(`asmaro_game_state_${product.id}`) || '{}';

    return `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${product.title}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
          body {
            background: radial-gradient(circle at center, #1b0e26 0%, #060209 100%);
            color: #f1f5f9;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            overflow: hidden;
            text-align: center;
          }
          .game-canvas-wrapper {
            position: relative;
            width: 95vw;
            max-width: 880px;
            height: 530px;
            background: #020617;
            border-radius: 24px;
            border: 2px solid rgba(244, 63, 94, 0.4);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(244, 63, 94, 0.2);
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .game-header {
            background: rgba(15, 23, 42, 0.95);
            padding: 10px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          .game-title {
            font-size: 14px;
            font-weight: 900;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .game-badge {
            background: #e11d48;
            color: #fff;
            padding: 2px 8px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: bold;
          }
          .stats-bar {
            display: flex;
            gap: 14px;
            font-size: 12px;
            font-family: monospace;
            color: #38bdf8;
            font-weight: bold;
          }
          canvas {
            flex: 1;
            width: 100%;
            height: 100%;
            display: block;
            background: #090d16;
            cursor: crosshair;
          }
          .game-footer {
            background: rgba(15, 23, 42, 0.95);
            padding: 8px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }
          .key-hint {
            display: inline-block;
            background: #334155;
            color: #f8fafc;
            padding: 2px 6px;
            border-radius: 4px;
            margin: 0 3px;
            font-family: monospace;
          }
          .save-indicator {
            color: #4ade80;
            font-size: 11px;
            display: flex;
            align-items: center;
            gap: 4px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="game-canvas-wrapper">
          <div class="game-header">
            <div class="game-title">
              <span>🎮 ${product.title}</span>
              <span class="game-badge">محفوظ تلقائياً بالبرنامج</span>
            </div>
            <div class="stats-bar">
              <span>النقاط: <span id="scoreVal" style="color:#4ade80">0</span></span>
              <span>أعلى رقم: <span id="highScoreVal" style="color:#facc15">0</span></span>
              <span>الصحة: <span id="hpVal" style="color:#fb7185">100%</span></span>
            </div>
          </div>

          <canvas id="gameCanvas" width="880" height="430"></canvas>

          <div class="game-footer">
            <div>
              التحكم: <span class="key-hint">WASD / الأسهم</span> للحركة | <span class="key-hint">المسافة Space / زر الفأرة</span> للتصويب
            </div>
            <div class="save-indicator">
              <span>💾 الحفظ الدائم مفعل</span>
            </div>
          </div>
        </div>

        <script>
          const canvas = document.getElementById('gameCanvas');
          const ctx = canvas.getContext('2d');
          const scoreVal = document.getElementById('scoreVal');
          const highScoreVal = document.getElementById('highScoreVal');
          const hpVal = document.getElementById('hpVal');

          // Restored State
          let savedState = {};
          try {
            savedState = ${savedStateStr};
          } catch(e){}

          let score = 0;
          let highScore = savedState.highScore || 0;
          highScoreVal.innerText = highScore;

          let player = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: 18,
            color: savedState.playerColor || '#f43f5e',
            speed: 5,
            vx: 0,
            vy: 0,
            angle: 0,
            customTexture: null
          };

          let bullets = [];
          let enemies = [];
          let particles = [];
          let keys = {};

          // Handle incoming messages from Parent App (Screenshots, Custom Images)
          window.addEventListener('message', (e) => {
            if (!e.data) return;
            if (e.data.type === 'CAPTURE_SCREENSHOT_REQUEST') {
              try {
                const dataUrl = canvas.toDataURL('image/png');
                window.parent.postMessage({
                  type: 'ASMARO_GAME_SCREENSHOT',
                  dataUrl: dataUrl
                }, '*');
              } catch(err) {
                console.error(err);
              }
            }
            if (e.data.type === 'CUSTOM_ASSET_LOADED' && e.data.asset) {
              const img = new Image();
              img.onload = () => {
                player.customTexture = img;
              };
              img.src = e.data.asset.dataUrl;
            }
          });

          window.addEventListener('keydown', e => {
            keys[e.code] = true;
            if (e.code === 'Space') {
              shoot();
            }
          });

          window.addEventListener('keyup', e => {
            keys[e.code] = false;
          });

          canvas.addEventListener('mousemove', e => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
            const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
            player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);
          });

          canvas.addEventListener('mousedown', e => {
            shoot();
          });

          function shoot() {
            bullets.push({
              x: player.x + Math.cos(player.angle) * player.radius,
              y: player.y + Math.sin(player.angle) * player.radius,
              vx: Math.cos(player.angle) * 12,
              vy: Math.sin(player.angle) * 12,
              radius: 4,
              color: '#38bdf8'
            });
          }

          function spawnEnemy() {
            if (enemies.length < 8) {
              const edge = Math.floor(Math.random() * 4);
              let ex = 0, ey = 0;
              if (edge === 0) { ex = Math.random() * canvas.width; ey = -20; }
              else if (edge === 1) { ex = canvas.width + 20; ey = Math.random() * canvas.height; }
              else if (edge === 2) { ex = Math.random() * canvas.width; ey = canvas.height + 20; }
              else { ex = -20; ey = Math.random() * canvas.height; }

              enemies.push({
                x: ex,
                y: ey,
                radius: 14 + Math.random() * 10,
                speed: 1.5 + Math.random() * 1.5,
                color: '#eab308'
              });
            }
          }

          setInterval(spawnEnemy, 1200);

          function saveGameProgress() {
            if (score > highScore) {
              highScore = score;
              highScoreVal.innerText = highScore;
            }
            window.parent.postMessage({
              type: 'ASMARO_SAVE_GAME_STATE',
              state: {
                highScore: highScore,
                lastScore: score,
                playerColor: player.color,
                lastPlayed: new Date().toISOString()
              }
            }, '*');
          }

          // Auto-save state every 10 seconds
          setInterval(saveGameProgress, 10000);

          function update() {
            if (keys['KeyW'] || keys['ArrowUp']) player.y -= player.speed;
            if (keys['KeyS'] || keys['ArrowDown']) player.y += player.speed;
            if (keys['KeyA'] || keys['ArrowLeft']) player.x -= player.speed;
            if (keys['KeyD'] || keys['ArrowRight']) player.x += player.speed;

            player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
            player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

            // Bullets
            for (let i = bullets.length - 1; i >= 0; i--) {
              bullets[i].x += bullets[i].vx;
              bullets[i].y += bullets[i].vy;

              if (bullets[i].x < 0 || bullets[i].x > canvas.width || bullets[i].y < 0 || bullets[i].y > canvas.height) {
                bullets.splice(i, 1);
                continue;
              }

              for (let j = enemies.length - 1; j >= 0; j--) {
                const dist = Math.hypot(bullets[i].x - enemies[j].x, bullets[i].y - enemies[j].y);
                if (dist < bullets[i].radius + enemies[j].radius) {
                  for (let p = 0; p < 8; p++) {
                    particles.push({
                      x: enemies[j].x,
                      y: enemies[j].y,
                      vx: (Math.random() - 0.5) * 6,
                      vy: (Math.random() - 0.5) * 6,
                      life: 20,
                      color: enemies[j].color
                    });
                  }
                  enemies.splice(j, 1);
                  bullets.splice(i, 1);
                  score += 100;
                  scoreVal.innerText = score;
                  if (score > highScore) {
                    highScore = score;
                    highScoreVal.innerText = highScore;
                  }
                  break;
                }
              }
            }

            for (let i = 0; i < enemies.length; i++) {
              const angle = Math.atan2(player.y - enemies[i].y, player.x - enemies[i].x);
              enemies[i].x += Math.cos(angle) * enemies[i].speed;
              enemies[i].y += Math.sin(angle) * enemies[i].speed;
            }

            for (let i = particles.length - 1; i >= 0; i--) {
              particles[i].x += particles[i].vx;
              particles[i].y += particles[i].vy;
              particles[i].life--;
              if (particles[i].life <= 0) {
                particles.splice(i, 1);
              }
            }
          }

          function draw() {
            ctx.fillStyle = '#050811';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Grid lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.lineWidth = 1;
            for (let x = 0; x < canvas.width; x += 40) {
              ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += 40) {
              ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
            }

            // Bullets
            bullets.forEach(b => {
              ctx.fillStyle = b.color;
              ctx.shadowColor = b.color;
              ctx.shadowBlur = 8;
              ctx.beginPath();
              ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
            });

            // Particles
            particles.forEach(p => {
              ctx.fillStyle = p.color;
              ctx.beginPath();
              ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
              ctx.fill();
            });

            // Enemies
            enemies.forEach(e => {
              ctx.fillStyle = e.color;
              ctx.beginPath();
              ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
              ctx.fill();
            });

            // Player or Custom Saved Image
            ctx.save();
            ctx.translate(player.x, player.y);
            ctx.rotate(player.angle);

            if (player.customTexture) {
              ctx.drawImage(player.customTexture, -player.radius, -player.radius, player.radius * 2, player.radius * 2);
            } else {
              ctx.fillStyle = player.color;
              ctx.shadowColor = '#f43f5e';
              ctx.shadowBlur = 15;
              ctx.beginPath();
              ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = '#fff';
              ctx.fillRect(0, -3, player.radius + 10, 6);
            }
            ctx.restore();
          }

          function loop() {
            update();
            draw();
            requestAnimationFrame(loop);
          }

          loop();
        </script>
      </body>
      </html>
    `;
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl ${isFullscreen ? 'p-0' : ''}`}>
      <div className={`relative w-full ${isFullscreen ? 'h-full max-w-full rounded-none' : 'max-w-6xl h-[90vh] rounded-3xl'} flex flex-col bg-slate-950 border border-white/20 shadow-2xl overflow-hidden transition-all duration-300`}>
        
        {/* App Bar & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900 border-b border-white/10 shrink-0">
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-black">
              <Play className="w-3.5 h-3.5 fill-rose-400" />
              <span>متصفح الألعاب الداخلي</span>
            </div>
            
            <h3 className="text-sm font-black text-white truncate max-w-xs sm:max-w-sm">
              {product.title}
            </h3>

            {userGrantedExpiry && (
              <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono font-bold text-amber-300 bg-amber-950/50 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>ينتهي: {new Date(userGrantedExpiry).toLocaleDateString('ar-LB')}</span>
              </div>
            )}
          </div>

          {/* Action Toolbar: Screenshot, Upload Image, Saved Media Drawer, Fullscreen, Restart, Close */}
          <div className="flex items-center gap-2">
            
            {/* Take & Save Screenshot */}
            <button
              onClick={handleCaptureScreenshot}
              className="px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-900/40 active:scale-95 transition-all"
              title="التقاط وحفظ صورة من اللعبة في البرنامج"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden md:inline">التقاط وحفظ صورة</span>
            </button>

            {/* Upload & Save Custom Image / File */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/40 active:scale-95 transition-all"
              title="حفظ وإضافة صور أو ملفات جديدة للعبة"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden md:inline">حفظ صورة/ملف جديد</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.json,.txt"
              onChange={handleCustomFileUpload}
              className="hidden"
            />

            {/* Saved Files & Images Drawer Toggle */}
            <button
              onClick={() => setIsFilesDrawerOpen(!isFilesDrawerOpen)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 border border-amber-500/30 transition-colors"
              title="عرض الصور والملفات المحفوظة مع اللعبة"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>المحفوظات ({savedFiles.length})</span>
            </button>

            <button
              onClick={handleRestart}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="إعادة تحميل اللعبة"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title={isFullscreen ? 'تصغير الشاشة' : 'تكبير الشاشة الكاملة'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition-colors"
              title="إغلاق المتصفح"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toast Floating Notification */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-emerald-950/95 border border-emerald-400/60 text-emerald-200 text-xs sm:text-sm font-bold shadow-2xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Content Area - Clean Game Canvas & Drawer */}
        <div className="flex-1 relative bg-black overflow-hidden flex">
          <iframe
            ref={iframeRef}
            key={key}
            srcDoc={generateGameHtml()}
            title={product.title}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
          />

          {/* Saved Files & Media Drawer */}
          {isFilesDrawerOpen && (
            <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-slate-950/95 border-l border-white/15 backdrop-blur-2xl z-40 p-4 flex flex-col justify-between shadow-2xl">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-black text-white">الصور والملفات المحفوظة</h4>
                  </div>
                  <button
                    onClick={() => setIsFilesDrawerOpen(false)}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 mt-2">
                  أي لقطة شاشة أو صورة جديدة يتم إضافتها للعبة تُحفظ تلقائياً في ذاكرة البرنامج:
                </p>

                {/* List of files */}
                <div className="mt-4 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                  {savedFiles.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 text-center text-xs text-slate-500 space-y-2">
                      <ImageIcon className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                      <p>لا توجد صور أو ملفات محفوظة بعد.</p>
                      <p className="text-[10px] text-slate-600">استخدم زر التقاط صورة أو رفع ملف لحفظ صور جديدة مع اللعبة.</p>
                    </div>
                  ) : (
                    savedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="p-2.5 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-between gap-3 group hover:border-amber-400/40 transition-colors"
                      >
                        <div
                          className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                          onClick={() => {
                            if (file.fileType === 'image' || file.fileType === 'screenshot') {
                              setSelectedPreviewImage(file.dataUrl);
                            }
                          }}
                        >
                          {file.fileType === 'image' || file.fileType === 'screenshot' ? (
                            <img
                              src={file.dataUrl}
                              alt={file.fileName}
                              className="w-10 h-10 rounded-lg object-cover bg-black border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1 text-right">
                            <p className="text-xs font-bold text-white truncate">{file.fileName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{file.size || 'ملف لعبة'} • {new Date(file.createdAt).toLocaleTimeString('ar-LB')}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={file.dataUrl}
                            download={file.fileName}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="تنزيل إلى جهازك"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Check className="w-3 h-3" />
                  <span>تخزين آمن ومحمي</span>
                </span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors"
                >
                  + إضافة ملف/صورة
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status Ribbon */}
        <div className="px-4 py-2 bg-slate-900/90 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>تشغيل آمن بمتصفح المتجر - نظام الحفظ التلقائي للصور والملفات نشط</span>
          </div>
          <span className="font-mono text-slate-500">Overlay Asmaro Sandbox Engine</span>
        </div>

      </div>

      {/* Image Preview Modal */}
      {selectedPreviewImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedPreviewImage}
              alt="Game Saved Image"
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl border border-white/20 shadow-2xl"
            />
            <button
              onClick={() => setSelectedPreviewImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
