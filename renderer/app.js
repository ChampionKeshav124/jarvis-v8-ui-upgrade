/* ═══════════════════════════════════════════════════════════════
   JARVIS V8 — TITAN PRIME NEURAL LOGIC ENGINE
   BYTEFORGE SYSTEM // IRON MAN 1 FIDELITY
   ═══════════════════════════════════════════════════════════════ */

// ── DOM ELEMENTS ──
const input           = document.getElementById('commandInput');
const sendBtn         = document.getElementById('sendBtn');
const panel           = document.getElementById('responsePanel');
const clockDisplay    = document.getElementById('clockDisplay');
const btnVoiceToggle  = document.getElementById('btnVoiceToggle');
const statusIndicator = document.getElementById('statusIndicator');
const systemStatusText= document.getElementById('systemStatusText');
const cpuValue        = document.getElementById('cpuValue');
const ramValue        = document.getElementById('ramValue');

// ── STATE MANAGER ──
const APP_STATE = {
  OFFLINE: 'OFFLINE', BOOTING: 'BOOTING',
  IDLE: 'IDLE', LISTENING: 'LISTENING', PROCESSING: 'PROCESSING'
};

let currentState  = APP_STATE.OFFLINE;
let isVoiceEnabled= true;
let activeStreamElement = null;
let wakeWords     = ["jarvis", "jarvis wake up", "wake up jarvis"];

// ── V8 PROCEDURAL AUDIO ENGINE ──
const AudioEngine = {
  ctx: null,
  init() { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },

  playChirp(freq = 880, type = 'sine', duration = 0.1) {
    if (!this.ctx) return;
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.8, this.ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  playHum(duration = 2) {
    if (!this.ctx) return;
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(38, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(55, this.ctx.currentTime + duration);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  // Ascending triple-chirp sweep (Iron Man suit-up sound)
  playSweep() {
    [440,660,880,1100].forEach((f,i) => {
      setTimeout(() => this.playChirp(f, 'sine', 0.2), i * 100);
    });
  }
};

// ── TITAN PRIME: DIGITAL RAIN ENGINE ──
const DigitalRain = {
  canvas: null, ctx: null, cols: 0,
  drops: [], fontSize: 12,
  chars: 'JARVIS0123456789ABCDEF◈◉▣■◆▸⬡ΔΩΨ',

  init() {
    this.canvas = document.getElementById('digitalRain');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.draw();
  },

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.cols  = Math.floor(this.canvas.width / this.fontSize);
    this.drops = Array(this.cols).fill(1);
  },

  draw() {
    const now   = Date.now();
    const delta = now - (this.lastFrame || 0);
    if (delta < 60) { requestAnimationFrame(() => this.draw()); return; }
    this.lastFrame = now;

    const { ctx, canvas, drops, chars, fontSize } = this;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${fontSize}px "Share Tech Mono", monospace`;

    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const intensity = Math.random();
      if (intensity > 0.92)       ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
      else if (intensity > 0.65)  ctx.fillStyle = 'rgba(0, 240, 255, 0.14)';
      else                        ctx.fillStyle = 'rgba(0, 200, 200, 0.06)';

      ctx.fillText(char, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.974) drops[i] = 0;
      drops[i]++;
    }
    requestAnimationFrame(() => this.draw());
  }
};

// ── TITAN PRIME: CINEMATIC BOOT SEQUENCE ──
const BootManager = {
  async start() {
    AudioEngine.init();
    const overlay     = document.getElementById('introOverlay');
    const statusTxt   = document.getElementById('introStatusText');
    const dot         = document.querySelector('.intro-dot');
    const leftPanel   = document.querySelector('.panel--left');
    const rightPanel  = document.querySelector('.panel--right');
    const centerPanel = document.querySelector('.panel--center');

    // ── Pre-boot: hide HUD panels in 3D space ──
    overlay.style.display = 'flex';
    overlay.style.opacity  = '1';

    const hidePanel = (el, rotY, z) => {
      if (!el) return;
      el.style.transition = 'none';
      el.style.opacity    = '0';
      el.style.transform  = `rotateY(${rotY}deg) translateZ(${z}px)`;
    };
    hidePanel(leftPanel,  65, -200);
    hidePanel(rightPanel, -65, -200);
    hidePanel(centerPanel, 0, -300);
    if (centerPanel) centerPanel.style.transform += ' scale(0.4)';

    AudioEngine.playHum(14);
    statusTxt.style.opacity = '1';

    // ── Stage 0: System init text ──
    const phases = [
      { t: 200,  txt: 'TITAN V8 // INITIALIZING...' },
      { t: 1500, txt: 'NEURAL BRIDGE: ESTABLISHING LINK' },
      { t: 3000, txt: 'MEMORY CORE: LOADING ENCRYPTED MATRIX' },
      { t: 4500, txt: 'PERFORMING HARDWARE VERIFICATION...' },
      { t: 6000, txt: 'AEGIS DEFENSE GRID: ARMING PROTOCOLS' },
      { t: 7500, txt: 'HOLOGRAPHIC SYSTEMS: CALIBRATING DEPTH' },
      { t: 9000, txt: 'SYNCHRONIZING TITAN PROTOCOLS [99%]' },
      { t: 10500,txt: 'ALL SYSTEMS GO — DEPLOYING INTERFACE' },
    ];
    phases.forEach(({ t, txt }) => setTimeout(() => {
      statusTxt.innerText = txt;
      AudioEngine.playChirp(400 + Math.random() * 600, 'sine', 0.04);
    }, t));

    // ── Stage 1: Reactor dot appears (0.5s) ──
    setTimeout(() => {
      dot.style.opacity = '1';
    }, 500);

    // ── Stage 2: Hardware scan terminal (4-8s) ──
    setTimeout(() => this._runHardwareScan(), 4500);

    // ── Stage 3: Progress bar reveal (7.5s) ──
    setTimeout(() => {
      const prog = document.querySelector('.intro-progress');
      if (prog) prog.style.display = 'block';
    }, 7500);

    // ── Stage 4: Reactor dot EXPANDS → white flash (9.5s) ──
    setTimeout(() => {
      dot.style.transition  = 'transform 0.8s cubic-bezier(0.4,0,0.2,1), filter 0.8s ease, opacity 0.4s';
      dot.style.transform   = 'scale(600)';
      dot.style.filter      = 'blur(20px)';
      dot.style.opacity     = '0.7';
      AudioEngine.playChirp(1200, 'sine', 0.8);
    }, 9500);

    // ── Stage 5: Panels fold in with snap (10.2s) ──
    setTimeout(() => {
      const snapIn = 'transform 1.2s cubic-bezier(0.16,1,0.3,1), opacity 1s ease';
      if (leftPanel) {
        leftPanel.style.transition = snapIn;
        leftPanel.style.opacity    = '1';
        leftPanel.style.transform  = 'rotateY(8deg) translateZ(-20px)';
      }
      if (rightPanel) {
        rightPanel.style.transition = snapIn;
        rightPanel.style.opacity    = '1';
        rightPanel.style.transform  = 'rotateY(-8deg) translateZ(-20px)';
      }
      if (centerPanel) {
        centerPanel.style.transition = 'transform 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s, opacity 0.9s ease 0.2s';
        centerPanel.style.opacity    = '1';
        centerPanel.style.transform  = 'translateZ(60px)';
      }
      AudioEngine.playSweep();
    }, 10200);

    // ── Stage 6: Fade out overlay (11.8s) ──
    setTimeout(() => {
      overlay.style.transition = 'opacity 1.2s ease';
      overlay.style.opacity    = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
        this._finish();
      }, 1200);
    }, 11800);
  },

  _runHardwareScan() {
    const container = document.createElement('div');
    container.className = 'boot-scan-line';
    container.innerHTML = '<div class="scan-text-flow"></div>';
    document.body.appendChild(container);
    container.style.display = 'block';

    const flow  = container.querySelector('.scan-text-flow');
    const items = [
      'MEMORY_CHECK............. 16GB_ECC [PASS]',
      'GPU_SYNC................. HOLOGRAPHIC_ENGINE [ACTIVE]',
      'NEURAL_BRIDGE............ ESTABLISHED',
      'ENCRYPTION_MODULE........ AES-256 [LOCKED]',
      'AEGIS_CORE............... ARMED',
      'SYSCALL_BRIDGE........... CONNECTED',
      'VOICE_ENGINE............. CALIBRATING',
      'UPLINK_STABILITY......... 99.8%',
      'GEMINI_NEURAL_CORE....... ONLINE',
      'TITAN_V8................. [READY]',
    ];

    items.forEach((text, i) => {
      setTimeout(() => {
        const p = document.createElement('p');
        p.innerText = `> ${text}`;
        flow.appendChild(p);
        flow.scrollTop = flow.scrollHeight;
        AudioEngine.playChirp(500 + i * 80, 'sine', 0.02);
      }, i * 380);
    });

    setTimeout(() => container.remove(), 6000);
  },

  _finish() {
    setUIState(APP_STATE.IDLE);
    AudioEngine.playSweep();
    appendMessage('SYSTEM >', 'JARVIS V8 [TITAN PRIME] ONLINE. ALL SYSTEMS OPTIMAL.', 'system');
    initDataVisualization();
    startVoiceEngine();
  }
};

// ── DATA VISUALIZATION ENGINE ──
let cpuHistory = Array(50).fill(0);
let ramHistory = Array(50).fill(0);

function initDataVisualization() {
  const cpuCanvas = document.getElementById('cpuGraph');
  const ramCanvas = document.getElementById('ramGraph');

  function drawGraph(canvas, data, color) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width  = canvas.offsetWidth;
    const h = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    const step = w / (data.length - 1);
    data.forEach((val, i) => {
      const x = i * step;
      const y = h - (val / 100 * h);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.lineTo(w, h); ctx.lineTo(0, h);
    ctx.fillStyle = color.replace('1)', '0.08)');
    ctx.fill();
  }

  setInterval(async () => {
    try {
      const stats = await window.jarvis.getSystemStats();
      cpuHistory.push(stats.cpu); cpuHistory.shift();
      ramHistory.push(stats.ram); ramHistory.shift();
      drawGraph(cpuCanvas, cpuHistory, 'rgba(0,240,255,1)');
      drawGraph(ramCanvas, ramHistory, 'rgba(0,255,204,1)');
      cpuValue.textContent = stats.cpu + '%';
      ramValue.textContent = stats.ram + '%';
    } catch {}
  }, 1000);
}

// ── VOICE WAVEFORM ENGINE ──
let analyser = null, dataArray = null;

async function startVoiceEngine() {
  const canvas = document.getElementById('voiceWaveform');
  const ctx    = canvas.getContext('2d');
  try {
    const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioCtx = new window.AudioContext();
    const source   = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    function animate() {
      requestAnimationFrame(animate);
      analyser.getByteFrequencyData(dataArray);
      const w = canvas.width  = canvas.offsetWidth;
      const h = canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0,240,255,0.45)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < dataArray.length; i++) {
        const angle = (i / dataArray.length) * Math.PI * 2;
        const rad  = 55 + (dataArray[i] / 255) * 45;
        const x = w/2 + Math.cos(angle) * rad;
        const y = h/2 + Math.sin(angle) * rad;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
      const avg = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
      if (currentState === APP_STATE.IDLE && avg > 45) activateJarvis();
    }
    animate();
  } catch (err) { console.warn("Voice waveform:", err); }
}

// ── UI STATE MACHINE ──
function setUIState(state) {
  currentState = state;
  document.body.classList.remove('speaking-active', 'state-processing');

  switch (state) {
    case APP_STATE.IDLE:
      statusIndicator.textContent = 'ONLINE';
      statusIndicator.style.color  = '#00ffcc';
      systemStatusText.textContent = 'AWAITING NEURAL COMMAND';
      input.disabled   = false;
      input.placeholder = "SAY 'JARVIS' OR TYPE TO INITIATE...";
      break;
    case APP_STATE.LISTENING:
      statusIndicator.textContent = 'LISTENING';
      statusIndicator.style.color  = '#ff00ff';
      systemStatusText.textContent = 'ENCRYPTED UPLINK ACTIVE';
      input.placeholder = "CAPTURING...";
      break;
    case APP_STATE.PROCESSING:
      statusIndicator.textContent = 'NEURAL SYNC';
      statusIndicator.style.color  = '#ffaa00';
      systemStatusText.textContent = 'DECODING UPLINK FREQUENCY...';
      input.disabled = true;
      document.body.classList.add('state-processing');
      break;
  }
}

async function activateJarvis() {
  if (currentState !== APP_STATE.IDLE) return;
  AudioEngine.playChirp(440, 'sine', 0.1);
  setUIState(APP_STATE.LISTENING);
  await sendCommand("__system_startup__", true);
}

// ── SEND COMMAND ──
async function sendCommand(overrideText = null, isActivation = false) {
  const text = overrideText || input.value.trim();
  if (!text) return;

  if (!isActivation) {
    appendMessage('USER >', text, 'user');
    input.value = '';
    setUIState(APP_STATE.PROCESSING);
  }
  AudioEngine.playChirp(660, 'square', 0.05);

  try {
    const result = await window.jarvis.sendCommand({ text, voice: isVoiceEnabled });

    // ── TITAN PRIME: Post-Stream Handshake ──
    if (!activeStreamElement) {
      // If no chunks were streamed (e.g. local intent or error), type the final response
      typeMessage('JARVIS >', result.response, result.action === 'error' ? 'error' : 'system');
    }

    // Reset streaming reference for the next cycle
    activeStreamElement = null; 

    // Speak: use ElevenLabs audio if present
    speakResponse(result.audio_base64, result.response);
    
    setUIState(APP_STATE.IDLE);
  } catch (err) {
    appendMessage('SYSTEM >', 'CORE COMMUNICATION ERROR — CHECK NEURAL BRIDGE', 'error');
    setUIState(APP_STATE.IDLE);
  }
}

/**
 * JARVIS Message Logic: Factory for neural output.
 */
function createMessageContainer(prefix, type) {
  const msg = document.createElement('div');
  msg.className = `response-message response-message--${type}`;
  msg.innerHTML = `<span class="response-prefix">${prefix}</span><span class="response-text"></span>`;
  panel.appendChild(msg);
  panel.scrollTop = panel.scrollHeight;
  return msg;
}

// ── MESSAGE RENDERING ──
function typeMessage(prefix, text, type) {
  const msg = document.createElement('div');
  msg.className = `response-message response-message--${type}`;
  msg.innerHTML = `<span class="response-prefix">${prefix}</span><span class="response-text"></span>`;
  panel.appendChild(msg);
  const span = msg.querySelector('.response-text');
  let i = 0;
  const speed = 25; // Synchronized with 1.5x Verbalization
  function typeNext() {
    if (i < text.length) {
      span.textContent += text[i++];
      panel.scrollTop = panel.scrollHeight;
      setTimeout(typeNext, speed);
    }
  }
  typeNext();
}

function appendMessage(prefix, text, type) {
  const msg = document.createElement('div');
  msg.className = `response-message response-message--${type}`;
  msg.innerHTML = `<span class="response-prefix">${prefix}</span><span class="response-text">${text}</span>`;
  panel.appendChild(msg);
  panel.scrollTop = panel.scrollHeight;
}

function speakResponse(base64Audio, fallbackText) {
  if (!isVoiceEnabled) return;

  // Try ElevenLabs audio first (highest quality)
  if (base64Audio) {
    try {
      document.body.classList.add('speaking-active');
      const audio = new Audio('data:audio/mpeg;base64,' + base64Audio);
      audio.onended = () => document.body.classList.remove('speaking-active');
      audio.onerror = () => {
        document.body.classList.remove('speaking-active');
        // Fallback to Web Speech API if audio fails
        if (fallbackText) speakWithWebSpeech(fallbackText);
      };
      audio.play().catch(() => {
        document.body.classList.remove('speaking-active');
        if (fallbackText) speakWithWebSpeech(fallbackText);
      });
      return;
    } catch (e) {}
  }

  // Web Speech API fallback — always available, no API key needed
  if (fallbackText) speakWithWebSpeech(fallbackText);
}

function speakWithWebSpeech(text) {
  if (!isVoiceEnabled || !window.speechSynthesis) return;
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.slice(0, 500));
  // Try to pick a deep male voice (like JARVIS)
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.name.toLowerCase().includes('david') ||
    v.name.toLowerCase().includes('mark') ||
    v.name.toLowerCase().includes('google uk english male') ||
    v.name.toLowerCase().includes('daniel')
  );
  if (preferred) utterance.voice = preferred;
  utterance.rate   = 1.5;
  utterance.pitch  = 0.85;
  utterance.volume = 1.0;
  document.body.classList.add('speaking-active');
  utterance.onend = () => document.body.classList.remove('speaking-active');
  window.speechSynthesis.speak(utterance);
}

// ═══════════════════════════════════════════════════════════════
//  TITAN PRIME PARALLAX ENGINE
//  Fixed: Reduced tilt angles, gimbal has separate shallow depth
//  so side panel text stays perfectly sharp during rotation
// ═══════════════════════════════════════════════════════════════
function initParallax() {
  const hudGrid = document.getElementById('hudGrid');
  if (!hudGrid) return;

  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;

  // Track mouse — SHALLOW range (max ±4 deg) so panels never blur
  document.addEventListener('mousemove', (e) => {
    targetX = (window.innerWidth  / 2 - e.clientX) / window.innerWidth  * 6;
    targetY = (window.innerHeight / 2 - e.clientY) / window.innerHeight * 4;
  });

  function animateParallax() {
    // Smooth lerp for cinematic motion
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;

    // Apply to HUD — very subtle rotation so side panels stay readable
    hudGrid.style.setProperty('--rotate-y', `${currentX.toFixed(3)}deg`);
    hudGrid.style.setProperty('--rotate-x', `${currentY.toFixed(3)}deg`);

    // Gimbal SVG — independent deeper parallax for 3D depth illusion
    // It moves MORE than the HUD, creating "floating in front" effect
    const gimbal = document.querySelector('.gimbal-overlay');
    if (gimbal) {
      const gx = currentX * 2.2;
      const gy = currentY * 2.2;
      // Keep translateZ fixed — only rotateX/Y changes for depth
      gimbal.style.transform = `translate(-50%, -50%) rotateY(${gx}deg) rotateX(${gy}deg) translateZ(0)`;
    }

    requestAnimationFrame(animateParallax);
  }
  requestAnimationFrame(animateParallax);
}

// ── LIFECYCLE ──
window.addEventListener('DOMContentLoaded', async () => {
  const config = await window.jarvis.getConfig();
  wakeWords = config.wakeWords || ["jarvis"];

  DigitalRain.init();

  // Clock ticker
  setInterval(() => {
    clockDisplay.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
  }, 1000);

  // Button bindings
  document.getElementById('btnActivateSystem').addEventListener('click', () => {
    document.getElementById('activationOverlay').style.display = 'none';
    BootManager.start();
  });

  sendBtn.addEventListener('click', () => sendCommand());
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendCommand(); });

  document.getElementById('btnMinimize').addEventListener('click', () => window.jarvis.minimize());
  document.getElementById('btnMaximize').addEventListener('click', () => window.jarvis.maximize());
  document.getElementById('btnFullscreen').addEventListener('click', () => window.jarvis.fullscreen());
  document.getElementById('btnClose').addEventListener('click', () => window.jarvis.close());

  btnVoiceToggle.addEventListener('click', () => {
    isVoiceEnabled = !isVoiceEnabled;
    btnVoiceToggle.textContent = isVoiceEnabled ? '🔊' : '🔇';
    AudioEngine.playChirp(isVoiceEnabled ? 880 : 440, 'sine', 0.1);
  });

  // Parallax init
  initParallax();

  // ── TITAN PRIME: Neural Retry IPC Listener ──
  // ── TITAN PRIME: Neural Streaming Handshake ──

  window.jarvis.onNeuralChunk((data) => {
    if (!activeStreamElement) {
      // First chunk: Create the message container
      activeStreamElement = createMessageContainer('JARVIS >', 'system');
      document.body.classList.remove('state-processing'); // Clear loading state as data flows
    }
    
    // Append chunk to the span
    const span = activeStreamElement.querySelector('.response-text');
    if (span) {
      span.textContent += data.chunk;
      panel.scrollTop = panel.scrollHeight;
      
      // Visual pulse on new data
      activeStreamElement.classList.add('pulse-glow');
      setTimeout(() => activeStreamElement.classList.remove('pulse-glow'), 100);
    }
  });

  window.jarvis.onNeuralRetry((data) => {
    document.body.classList.add('state-warning');
    systemStatusText.textContent = `NEURAL STABILIZING... RETRYING`;
    statusIndicator.textContent  = 'RETRYING';
    statusIndicator.style.color  = '#ff8800';
    AudioEngine.playChirp(220, 'sine', 0.08);
  });

  // NOTE: Auto-history restoration disabled per user request to keep HUD clean.
  // History can be retrieved via "retrieve history" command.

  // ── TITAN PRIME: Neural Jitter Telemetry ──
  setInterval(() => {
    const bars = document.querySelectorAll('.depth-fill');
    bars.forEach(bar => {
      if (Math.random() > 0.7) {
        const jitter = 40 + Math.random() * 60;
        bar.style.width = `${jitter}%`;
      }
    });
  }, 1200);
});
