// ═══════════════════════════════════════════════════════════════
//  JARVIS V8 — Electron Main Process
//  BYTEFORGE SYSTEM
//  Manages window lifecycle, Python IPC bridge, and system stats
// ═══════════════════════════════════════════════════════════════

const { app, BrowserWindow, ipcMain, dialog, session, globalShortcut } = require('electron');
const path = require('path');
const readline = require('readline');
const { spawn, execSync, exec } = require('child_process');
const os = require('os');

// Check for Administrative Elevation (Required for system control)
let isElevated = false;
try {
  if (os.platform() === 'win32') {
    execSync('net session', { stdio: 'ignore' });
    isElevated = true;
  } else {
    isElevated = process.getuid && process.getuid() === 0;
  }
} catch (e) {
  isElevated = false;
}

app.whenReady().then(() => {
  if (!isElevated) {
    dialog.showMessageBox({
      type: 'warning',
      title: 'JARVIS: High-Level Elevation Required',
      message: 'Administrative Access is Limited.',
      detail: 'To physically control applications like Steam, JARVIS needs full Administrative Authority.',
      buttons: ['I Understand (Continue User-Mode)', 'Exit to restart correctly'],
      defaultId: 0
    }).then(result => {
      if (result.response === 1) app.quit();
    });
  }
});

let mainWindow;
let pythonProcess = null;
let pendingCommand = null;

// ── Window Creation ─────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 820,
    minHeight: 620,
    frame: false,
    transparent: false,
    backgroundColor: '#06060a',
    title: 'JARVIS V8 [TITAN]',
    fullscreen: true, // Titan Hyper-Sync: Auto-Fullscreen
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true
    },
  });

  const ret = globalShortcut.register('Alt+Space', () => {
    mainWindow.webContents.send('wake-jarvis');
    mainWindow.show();
    mainWindow.focus();
  });

  if (!ret) { console.log('shortcut registration failed'); }

  const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'speech_listener.ps1')]);
  ps.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('WAKE_DETECTED')) {
      mainWindow.webContents.send('wake-jarvis');
      mainWindow.show();
      mainWindow.focus();
    }
  });

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') callback(true);
    else callback(false);
  });

  app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  
  // Start Persistent Python Bridge
  startPythonBridge();

  mainWindow.on('closed', () => { 
    if (pythonProcess) pythonProcess.kill();
    mainWindow = null; 
  });
}

// ── Titan Hyper-Sync Bridge ──────────────────────────────────
function startPythonBridge() {
  const scriptPath = path.join(__dirname, 'python', 'jarvis.py');
  
  pythonProcess = spawn('python', [scriptPath], {
    cwd: path.join(__dirname, 'python'),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  const rl = readline.createInterface({
    input: pythonProcess.stdout,
    terminal: false
  });

  rl.on('line', (line) => {
    if (!line.trim()) return;
    console.log(`[Python Stdout]: ${line}`);
    
    try {
      const result = JSON.parse(line);
      
      // ── TITAN PRIME: Neural Event Dispatcher ──
      if (result.bridge === 'HYPER_SYNC_ACTIVE') {
        console.log('Hyper-Sync Bridge Established.');
        return;
      }
      
      if (result.action === 'neural_retry') {
        if (mainWindow) mainWindow.webContents.send('neural-retry', result);
        return;
      }
      
      if (result.action === 'neural_stream') {
        if (mainWindow) mainWindow.webContents.send('neural-chunk', result);
        return; 
      }

      // Only real final responses resolve the promise
      if (pendingCommand) {
        pendingCommand.resolve(result);
        pendingCommand = null;
      }
    } catch (err) {
      console.warn('[Bridge Warning] Neural data integrity compromised:', line, err);
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Python Stderr]: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python bridge closed with code ${code}. Restarting...`);
    if (pendingCommand) {
      pendingCommand.reject(new Error("Neural bridge collapsed. Restarting link..."));
      pendingCommand = null;
    }
    pythonProcess = null;
    if (mainWindow) setTimeout(startPythonBridge, 1000);
  });
}

ipcMain.handle('send-command', async (_event, payload) => {
  if (!pythonProcess) {
    return { response: "Neural link offline. Re-establishing link...", action: "restarting" };
  }

  return new Promise((resolve, reject) => {
    // Timeout: 3 retries max = 2+4+8=14s sleep + API time, so 75s is safe
    const timeoutId = setTimeout(() => {
      if (pendingCommand) {
        pendingCommand = null;
        resolve({ response: "Sir, the neural bridge timed out. The API may be heavily loaded. Please try again in a few seconds.", action: "timeout" });
      }
    }, 75000);

    pendingCommand = {
      resolve: (data) => {
        clearTimeout(timeoutId);
        resolve(data);
      },
      reject
    };

    pythonProcess.stdin.write(JSON.stringify(payload) + '\n');
  });
});

ipcMain.handle('get-chat-history', async () => {
    // For now history is handled by the persistent process if we want,
    // but a one-off call is also fine. Let's make it a bridge command.
    return new Promise((resolve) => {
        // Special case for history: we could add a flag to the bridge
        // or just keep it as is. For Hyper-Sync, let's just make it a bridge call.
        const timeoutId = setTimeout(() => resolve({history: []}), 5000);
        pendingCommand = { 
            resolve: (data) => { clearTimeout(timeoutId); resolve(data); },
            reject: () => resolve({history: []})
        };
        pythonProcess.stdin.write(JSON.stringify({text: "__get_history__"}) + '\n');
    });
});

// ── System Stats & Controls ───────────────────────────
ipcMain.handle('get-system-stats', async () => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const ramPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);
  const cpuPercent = await new Promise((resolve) => {
    const cpus1 = os.cpus();
    setTimeout(() => {
      const cpus2 = os.cpus();
      let idleDiff = 0, totalDiff = 0;
      for (let i = 0; i < cpus2.length; i++) {
        const t1 = cpus1[i].times, t2 = cpus2[i].times;
        const total1 = t1.user + t1.nice + t1.sys + t1.idle + t1.irq;
        const total2 = t2.user + t2.nice + t2.sys + t2.idle + t2.irq;
        idleDiff += t2.idle - t1.idle;
        totalDiff += total2 - total1;
      }
      resolve(totalDiff === 0 ? 0 : Math.round(100 - (idleDiff / totalDiff) * 100));
    }, 500);
  });
  return { cpu: cpuPercent, ram: ramPercent };
});

ipcMain.handle('get-config', async () => {
  try {
    const configPath = path.join(__dirname, 'config.py');
    const fs = require('fs');
    const content = fs.readFileSync(configPath, 'utf8');
    const wakeMatch = content.match(/WAKE_WORDS\s*=\s*\[(.*?)\]/s);
    let wakeWords = ["jarvis wake up"];
    if (wakeMatch) wakeWords = wakeMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
    return { wakeWords };
  } catch (err) { return { wakeWords: ["jarvis wake up"] }; }
});

ipcMain.on('win-minimize', () => mainWindow?.minimize());
ipcMain.on('win-maximize', () => { if (mainWindow) mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize(); });
ipcMain.on('win-fullscreen', () => { if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen()); });
ipcMain.on('win-close', () => mainWindow?.close());

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
