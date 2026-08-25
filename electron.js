/**
 * Overlay Asmaro - Standalone Desktop Launcher (Electron.js)
 * Enables packaging the whole platform into a standalone .EXE application.
 */

import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function startLocalDistServer() {
  const distDir = path.join(__dirname, 'dist');
  
  const server = createServer((req, res) => {
    let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    
    // Fallback for SPA routing
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.woff2': 'font/woff2'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });

  server.listen(3928, '127.0.0.1');
}

function createWindow() {
  // Start the internal lightweight server
  startLocalDistServer();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#090b10',
    title: 'Overlay Asmaro - متجر ألعاب التخريب والتنبيهات RTS HD',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      allowRunningInsecureContent: true
    }
  });

  Menu.setApplicationMenu(null);

  // Load after short boot delay
  setTimeout(() => {
    mainWindow.loadURL('http://127.0.0.1:3928');
  }, 600);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
