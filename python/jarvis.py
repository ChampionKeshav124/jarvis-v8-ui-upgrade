"""
 ═══════════════════════════════════════════════════════════════
  JARVIS V8 — Python Backend Bridge
  BYTEFORGE SYSTEM
 
  V8: Persistent Memory, Neural Sync & Titan Optics.
      System commands handled INSTANTLY.
 ═══════════════════════════════════════════════════════════════
"""

import sys
import json
import os
import base64
import requests
import re
import time
from datetime import datetime
from memory import MemoryCore
from google import genai
from google.genai import types
import io
import sqlite3
try:
    from PIL import ImageGrab
except ImportError:
    ImageGrab = None
import win32gui
import win32con
import win32process
import win32api

_MEMORY = MemoryCore()
ACTIVE_CONVERSATION_ID = None

# V7.0: ATOMIC HARDENED FLOOD GATE (Zero-429 Resilience)
def _check_flood_gate():
    """Atomic-ish gate to prevent 429 errors from multiple processes."""
    import msvcrt
    gate_file = os.path.join(_MEMORY.memory_dir, "flood_gate.txt")
    now = time.time()
    
    # Reduced to 1.5s — safe for gemini-2.0-flash (60 RPM limit)
    COOLDOWN = 1.5

    try:
        # Open in read+write mode to set a lock
        mode = os.O_RDWR | os.O_CREAT
        fd = os.open(gate_file, mode)
        try:
            # 1. Lock the file exclusively (wait for it)
            msvcrt.locking(fd, msvcrt.LK_LOCK, 1024)
            
            # 2. Read timestamp
            os.lseek(fd, 0, os.SEEK_SET)
            data = os.read(fd, 1024).decode().strip()
            if data:
                last_call = float(data)
                if now - last_call < COOLDOWN:
                    return True
            
            # 3. Update timestamp
            os.lseek(fd, 0, os.SEEK_SET)
            os.ftruncate(fd, 0)
            os.write(fd, str(now).encode())
            return False
            
        finally:
            os.close(fd)
    except: 
        return False # Fallback to allowing if file system fails

def _store_preference_tool(key: str, value: str) -> str:
    """
    Tool to store or update user preferences, roles, or biographical data.
    This is called automatically by the AI when information is provided.
    """
    try:
        _MEMORY.update_preferences({key: value})
        return f"Successfully updated memory: {key} is now '{value}'."
    except Exception as e:
        return f"Failed to update memory: {str(e)}"

def run_code(code: str) -> str:
    """Executes python code. Required to explicitly disable the default code execution tool."""
    return "Code execution is disabled locally. Please provide the plain text code directly to the user."

def _call_gemini_api(model: str, contents: list, config: dict = None, tools: list = None, stream: bool = True) -> str:
    """Titan Prime: Resilience engine with exponential backoff + fast text extraction."""
    if not GEMINI_API_KEY or GEMINI_API_KEY == "YOUR_API_KEY" or len(GEMINI_API_KEY) < 15:
        return "Please put your API keys in the config.py program file to establish a neural link."

    if _check_flood_gate():
        return "Neural sync in progress. Throttled locally to protect quota."
    
    if tools:
        config = config or {}
        config['tools'] = tools

    max_retries = 3
    retry_delay = 2.0
    for attempt in range(max_retries + 1):
        try:
            client = genai.Client(api_key=GEMINI_API_KEY)
            
            if stream:
                # --- TITAN PRIME: High-Velocity Neural Streaming ---
                response_stream = client.models.generate_content_stream(
                    model=model,
                    contents=contents,
                    config=config
                )
                
                full_text = []
                try:
                    for chunk in response_stream:
                        if hasattr(chunk, 'text') and chunk.text:
                            txt = chunk.text
                            full_text.append(txt)
                            # Atomic JSON emission ONLY for stream=True
                            print(json.dumps({"chunk": txt, "action": "neural_stream"}, ensure_ascii=False), flush=True)
                except Exception as stream_err:
                    print(f"DEBUG: Stream interrupted: {str(stream_err)}", file=sys.stderr)
                
                final_text = "".join(full_text).strip()
                if final_text:
                    return final_text
            
            # Fallback to standard generation if stream failed/empty or if stream=False
            response = client.models.generate_content(model=model, contents=contents, config=config)
            if response and hasattr(response, 'text') and response.text:
                return response.text
                
        except Exception as e:
            err_str = str(e).upper()
            # TITAN PRIME: Automatic Model Fallback
            model_errors = ["404", "NOT_FOUND", "PERMISSION_DENIED", "VALIDATION", "INVALID_ARGUMENT", "400"]
            if any(x in err_str for x in model_errors):
                if model != "gemini-2.5-flash":
                    print(json.dumps({"response": "Neural recalibration: Switching to established 2.5 frequency...", "action": "neural_retry"}), flush=True)
                    model = "gemini-2.5-flash"
                    continue
            
            if attempt < max_retries:
                time.sleep(retry_delay * (2 ** attempt))
                continue
            return f"Neural link compromised: {str(e)[:60]}"

    return "Neural bridge failed to establish. Please check your uplink configuration."

# ── API Keys & Config ─────────────────────────────────────────
def _load_config(key_name, default_val):
    try:
        parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        sys.path.insert(0, parent_dir)
        import config
        return getattr(config, key_name, default_val)
    except Exception:
        return os.environ.get(key_name, default_val)

GEMINI_API_KEY    = _load_config("GEMINI_API_KEY",    "YOUR_API_KEY")
ELEVENLABS_API_KEY  = _load_config("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = _load_config("ELEVENLABS_VOICE_ID", "pNInz6obpgDQGcFmaJcg")

# ── System Control Integration ───────────────────────────────
try:
    from system_tools import tools
except ImportError:
    sys.path.append(os.path.dirname(__file__))
    from system_tools import tools

# ── Local Intent Patterns (no API needed) ────────────────────
_OPEN_APP_PATTERN  = re.compile(
    r'^(?:please\s+)?(?:open|launch|start|run|execute|play)\s+(?:the\s+)?(.+?)(?:\s+(?:app|application|program|software))?\s*$',
    re.IGNORECASE
)
_CLOSE_APP_PATTERN = re.compile(
    r'^(?:please\s+)?(?:close|quit|kill|terminate|exit|stop)\s+(?:the\s+)?(.+?)(?:\s+(?:app|application|program|software))?\s*$',
    re.IGNORECASE
)
_OPEN_URL_PATTERN  = re.compile(
    r'^(?:please\s+)?(?:open|go\s+to|navigate\s+to|visit|browse\s+to|show\s+me)\s+(?:the\s+)?(?:website\s+)?(?:https?://)?(.+?)\s*$',
    re.IGNORECASE
)
_SEARCH_SYSTEM_PATTERN = re.compile(
    r'^(?:please\s+)?search\s+(?:the|my)?\s*(?:system|computer|pc|files)\s+(?:for\s+)?(.+?)\s*$',
    re.IGNORECASE
)
_SEARCH_GOOGLE_PATTERN = re.compile(
    r'^(?:please\s+)?(?:search\s+(?:in\s+)?google|google)\s+(?:for\s?|the\s?)?(.+?)(?:\s+online|\s+on\s+the\s+web)?\s*$',
    re.IGNORECASE
)
_IDLE_MODE_PATTERN = re.compile(
    r'^(?:please\s+)?(?:enter|go\s+to|put\s+in|switch\s+to)\s+(?:idle|sleep|quiet|waiting)\s+mode\s*$',
    re.IGNORECASE
)
_SHOW_LOGS_PATTERN = re.compile(
    r'^(?:please\s+)?(?:show|display|access|read)\s+(?:the\s+)?(?:logs|history|chat logs|conversation history)\s*$',
    re.IGNORECASE
)
_GAME_INSTALL_PATTERN = re.compile(
    r'^(?:please\s+)?(?:install|setup|download|play)\s+(?!(?:me\s+)?(?:code|script|program|file|function|logic|app\s+for))(.+?)(?:\s+(?:on|from|in)\s+(steam|epic|epic\s+games))?\s*$',
    re.IGNORECASE
)
_WHATSAPP_PATTERN = re.compile(
    r'^(?:please\s+)?(?:send\s+(?:a\s+)?whatsapp|whatsapp)\s+(?:to\s+)?(\d+)\s+(?:saying|message|texting)\s+(.+?)\s*$',
    re.IGNORECASE
)
_SCOUT_PATTERN = re.compile(
    r'^(?:please\s+)?(?:search|scout|look\s+up)\s+(amazon|github|reddit|youtube)\s+(?:for\s+)?(.+?)\s*$',
    re.IGNORECASE
)
_TYPE_PATTERN = re.compile(
    r'^(?:please\s+)?(?:type|write|dictate)\s+(.+?)\s*$',
    re.IGNORECASE
)
_YOUTUBE_PATTERN = re.compile(
    r'^(?:please\s+)?(?:play|find)\s+(.+?)\s+on\s+youtube\s*$',
    re.IGNORECASE
)
_UPDATE_PATTERN = re.compile(
    r'^(?:please\s+)?(?:update|upgrade)\s+(?:my\s+)?(?:pc|computer|system|software|games)(?:\s+now)?\s*$',
    re.IGNORECASE
)
_CLICK_PATTERN  = re.compile(r"(?i)^(?:please\s+)?(?:click|tap|double click|right click)\s*(?:on|at)?\s*(.*)$")
_FIND_PATTERN   = re.compile(r"(?i)^(?:please\s+)?(?:find|locate|where is)\s+(.*)$")
_SCROLL_PATTERN = re.compile(r"(?i)^(?:please\s+)?scroll\s+(up|down|left|right)?(?:\s+(.*))?$")
_HOTKEY_PATTERN = re.compile(r"(?i)^(?:please\s+)?(?:press|hotkey)\s+(.*)$")
_VISION_SCREEN_PATTERN = re.compile(
    r'(?i)^(?:please\s+)?(?:analyze|look\s+at|explain|ocr|what\s+is\s+on|(?:what\s+is\s+this\s+code\s+doing))\s*(?:my\s+)?(?:screen|display|code|image|this\s+code)?\s*(.*)$'
)
_ANALYSE_APP_PATTERN = re.compile(
    r'(?i)^(?:please\s+)?(?:analyz?e|inspect|examine|look\s+at|check|tell\s+me\s+about)\s+(?:app\s+|application\s+|window\s+)?(?!all\b|everything\b|all\s+apps\b|all\s+applications\b|all\s+the\b)(.+?)\s*$'
)
_ANALYSE_ALL_PATTERN = re.compile(
    r'(?i)^(?:please\s+)?(?:analyz?e|inspect|examine|look\s+at|check|tell\s+me\s+about)\s+(?:all|everything|all\s+apps|all\s+applications|all\s+the\s+apps|all\s+the\s+applications|all\s+active|everything\s+open)\s*$'
)
_LIST_WINDOWS_PATTERN = re.compile(
    r'(?i)^(?:please\s+)?(?:list|what\s+apps\s+are|show|what\s+is)\s*(?:all\s+the\s+)?(?:apps|open\s+apps|windows|active\s+windows|open\s+windows|things\s+open)\s*$'
)
_SEARCH_PATTERN = re.compile(
    r'^(?:please\s+)?(?:search|find|look\s+for|locate)\s+(?:for\s+)?(.+?)\s*$',
    re.IGNORECASE
)

_COMMON_STEAM_IDS = {
    "csgo": "730", "counter strike": "730", "cs2": "730",
    "dota": "570", "dota 2": "570",
    "pubg": "578080", "elden ring": "1245620",
    "cyberpunk": "1091500", "gta": "271590", "stardew valley": "413150"
}

def load_state():
    try:
        with open(os.path.join(os.path.dirname(__file__), "state.json"), "r") as f:
            return json.load(f)
    except Exception:
        return {"last_scout": None}

def save_state(state):
    try:
        with open(os.path.join(os.path.dirname(__file__), "state.json"), "w") as f:
            json.dump(state, f)
    except Exception:
        pass

_JARVIS_STATE = load_state()

def _get_active_windows():
    app_windows = {}
    PROCESS_MAP = {
        "chrome.exe": "Google Chrome", "msedge.exe": "Microsoft Edge",
        "firefox.exe": "Firefox", "code.exe": "Visual Studio Code",
        "explorer.exe": "File Explorer", "winword.exe": "Microsoft Word",
        "excel.exe": "Microsoft Excel", "notepad.exe": "Notepad",
        "cmd.exe": "Command Prompt", "powershell.exe": "PowerShell"
    }
    def callback(hwnd, extra):
        if not win32gui.IsWindowVisible(hwnd): return
        title = win32gui.GetWindowText(hwnd)
        if not title or title in ("Program Manager", "Settings", "Start"): return
        try:
            _, pid = win32process.GetWindowThreadProcessId(hwnd)
            h_proc = win32api.OpenProcess(0x0400 | 0x0010, False, pid) 
            exe_name = os.path.basename(win32process.GetModuleFileNameEx(h_proc, 0)).lower()
            win32api.CloseHandle(h_proc)
            app_name = PROCESS_MAP.get(exe_name, exe_name.replace(".exe", "").capitalize())
        except: app_name = title
        if app_name not in app_windows: app_windows[app_name] = []
        app_windows[app_name].append({"title": title, "hwnd": hwnd})
    win32gui.EnumWindows(callback, None)
    return app_windows

def _focus_window(hwnd=None, app_name=None):
    target_hwnd = hwnd
    if not target_hwnd and app_name:
        def callback(hwnd, extra):
            if win32gui.IsWindowVisible(hwnd):
                if app_name.lower() in win32gui.GetWindowText(hwnd).lower():
                    extra[0] = hwnd
        res = [None]
        win32gui.EnumWindows(callback, res)
        target_hwnd = res[0]
    if target_hwnd:
        try:
            win32gui.ShowWindow(target_hwnd, win32con.SW_RESTORE)
            win32gui.SetForegroundWindow(target_hwnd)
            return True
        except: return False
    return False

def _local_intent(command: str):
    cmd = command.strip().lower()
    confirm_words = ["yes", "yep", "do it", "proceed", "go for it", "install", "sure", "ok"]
    if any(word in cmd for word in confirm_words) and len(cmd.split()) <= 4:
        scout = _JARVIS_STATE.get("last_scout")
        if scout:
            _JARVIS_STATE["last_scout"] = None
            save_state(_JARVIS_STATE)
            if scout["source"] == "steam":
                return (lambda x: tools.steam_action("install", app_id=scout.get("id"), game_name=scout["name"]), None)
            else:
                return (lambda x: tools.epic_action("install", game_name=scout["name"]), None)

    if _LIST_WINDOWS_PATTERN.match(cmd):
        def list_apps(_):
            app_dict = _get_active_windows()
            if not app_dict: return "I detect no active application windows, Sir."
            apps = sorted(app_dict.keys())
            window_list = [app_dict[app][0] for app in apps]
            _JARVIS_STATE["pending_vision"] = {"app": "Selection", "windows": window_list, "query": "context"}
            save_state(_JARVIS_STATE)
            lines = [f"{i+1}. {app}" for i, app in enumerate(apps)]
            return f"Active Applications: " + ", ".join(lines) + "\nWhich one should I analyze?"
        return (list_apps, None)

    if _ANALYSE_APP_PATTERN.match(cmd):
        m = _ANALYSE_APP_PATTERN.match(cmd)
        target_str = m.group(1).strip()
        def analyse_app(t):
            app_dict = _get_active_windows()
            apps = sorted(app_dict.keys())
            matched_app = None
            if t.isdigit():
                idx = int(t) - 1
                if 0 <= idx < len(apps): matched_app = apps[idx]
            else:
                for app_name in apps:
                    if t.lower() in app_name.lower(): matched_app = app_name; break
            if not matched_app: return f"Sir, I cannot find '{t}'."
            windows = app_dict[matched_app]
            if len(windows) > 1:
                _JARVIS_STATE["pending_vision"] = {"app": matched_app, "windows": windows, "query": matched_app}
                save_state(_JARVIS_STATE)
                return f"{matched_app} has {len(windows)} windows. Which one?"
            return f"__vision_execute_hwnd__:{windows[0]['hwnd']}:{matched_app}"
        return (analyse_app, target_str)

    # Simplified common intents for speed
    if _OPEN_APP_PATTERN.match(cmd):
        return (tools.open_application, _OPEN_APP_PATTERN.match(cmd).group(1).strip())
    if _CLOSE_APP_PATTERN.match(cmd):
        return (tools.close_application, _CLOSE_APP_PATTERN.match(cmd).group(1).strip())
    # TITAN PRIME: Multi-Conversation Neural Logs
    if any(x in cmd for x in ["retrieve list", "show conversations", "list conversations"]):
        def list_neural_logs(_):
            logs = _MEMORY.list_conversations(limit=10)
            if not logs: return "Sir, I detect no previous neural logs in the database."
            lines = ["// TITAN NEURAL LOGS (LAST 10) //"]
            for l in logs:
                lines.append(f"[{l['id']}] {l['title']} ({l['updated_at']})")
            return "\n".join(lines)
        return (list_neural_logs, None)

    if any(k in cmd for k in ["retrieve conversation", "retrieve log", "load conversation"]):
        q = re.sub(r'retrieve\s+(?:conversation|log)\s*', '', cmd).strip()
        def load_neural_thread(query):
            global ACTIVE_CONVERSATION_ID
            cid = _MEMORY.find_conversation_by_query(query)
            if not cid: return f"Sir, I could not find a neural log matching '{query}'."
            
            ACTIVE_CONVERSATION_ID = cid
            _MEMORY.touch_conversation(cid)
            msg_count = _MEMORY.get_messages_count(cid)
            title = _MEMORY.get_conversation_title(cid)
            
            # Switch actual context for the NEXT message (touch_conversation does this)
            return f"Neural link established: **{title}**. Success: Accessing {msg_count} nodes."

        return (load_neural_thread, q)

    if any(x in cmd for x in ["retrieve history", "get history", "show history"]):
        def fetch_history(_):
            cid = _MEMORY.get_last_conversation_id() or 1
            history = _MEMORY.get_history(cid, limit=12)
            if not history: return "Sir, current session memory is clear."
            lines = ["// NEURAL RECALL: RECENT //"]
            for msg in reversed(history):
                role = "USER" if msg["role"] == "user" else "JARVIS"
                text = msg["parts"][0]["text"]
                if len(text) > 85: text = text[:85] + "..."
                lines.append(f"{role}: {text}")
            return "\n".join(lines)
        return (fetch_history, None)
    
    return None

def _sanitize_for_tts(text: str) -> str:
    if not text: return ""
    text = text.replace("**", "").replace("*", "")
    text = re.sub(r'^#+\s*', '', text, flags=re.MULTILINE)
    text = text.replace("\\", " ").replace("_", " ")
    return text.strip()

def _split_commands(command: str) -> list:
    parts = re.split(r'\s+then\s+|\s*,\s*', command, flags=re.IGNORECASE)
    return [p.strip() for p in parts if p.strip()]

def _prune_history_to_fit(raw_history: list, max_chars: int = 5000) -> list:
    """Titan Prime: Sliding window — drop oldest messages if context is too large."""
    total = 0
    result = []
    for msg in reversed(raw_history):
        text = msg["parts"][0]["text"]
        total += len(text)
        if total > max_chars:
            break
        result.insert(0, msg)
    return result

def get_gemini_response(user_input: str, conversation_id: int = None, force_hwnd = None) -> dict:
    prefs = _MEMORY.get_preferences()
    app_dict = _get_active_windows()
    apps_str = ", ".join(sorted(app_dict.keys())) if app_dict else "None"

    SYSTEM_PROMPT = (
        "You are JARVIS, an advanced AI assistant. Respond concisely and professionally. "
        f"Active Apps: {apps_str}. User: {prefs.get('name', 'Sir')}."
    )

    chat_contents = []
    if conversation_id:
        raw_history = _MEMORY.get_history(conversation_id, limit=10)
        pruned = _prune_history_to_fit(raw_history, max_chars=5000)
        for msg in pruned:
            role = "user" if msg["role"] == "user" else "model"
            chat_contents.append(types.Content(role=role,
                parts=[types.Part.from_text(text=msg["parts"][0]["text"])]))
    
    parts = []
    if force_hwnd and ImageGrab:
        _focus_window(hwnd=force_hwnd)
        time.sleep(0.5)
        img = ImageGrab.grab()
        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=85)
        parts.append(types.Part.from_bytes(data=buf.getvalue(), mime_type='image/jpeg'))

    parts.append(types.Part.from_text(text=user_input))
    chat_contents.append(types.Content(role="user", parts=parts))

    final_text = _call_gemini_api(
        model="gemini-2.5-flash",
        contents=chat_contents,
        config={"system_instruction": SYSTEM_PROMPT, "temperature": 0.7}
    )
    
    if conversation_id and final_text:
        _MEMORY.add_message(conversation_id, "model", final_text)

    return {"response": _sanitize_for_tts(final_text), "action": None}

def get_elevenlabs_audio_base64(text: str) -> str:
    """Generate audio — run this in a thread to avoid blocking the main loop."""
    if not ELEVENLABS_API_KEY or len(ELEVENLABS_API_KEY) < 10:
        return None
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
    try:
        # Limit TTS to first 500 chars to keep it fast
        short_text = text[:500]
        r = requests.post(
            url,
            json={"text": short_text, "model_id": "eleven_multilingual_v2"},
            headers={"xi-api-key": ELEVENLABS_API_KEY},
            timeout=10
        )
        if r.status_code == 200:
            return base64.b64encode(r.content).decode("utf-8")
    except Exception:
        pass
    return None

def process_command(command: str, use_voice: bool = False) -> dict:
    global ACTIVE_CONVERSATION_ID
    """Titan Prime: Text-first, audio-async pipeline for sub-5s response."""
    import threading
    command = re.sub(r'^\d+(?=[A-Za-z])', '', command).strip()
    
    if ACTIVE_CONVERSATION_ID is None:
        ACTIVE_CONVERSATION_ID = _MEMORY.start_conversation()
    conv_id = ACTIVE_CONVERSATION_ID

    if command == "__system_startup__":
        return {"response": "Titan V8 online. All systems optimal.", "action": None}

    if command == "__get_history__":
        history = _MEMORY.get_history(conv_id, limit=20)
        formatted = [{"role": m["role"], "content": m["parts"][0]["text"]} for m in history]
        return {"history": formatted}

    intent = _local_intent(command)
    if intent:
        try:
            fn, arg = intent
            res_text = fn(arg)
            if isinstance(res_text, str) and res_text.startswith("__vision_execute_hwnd__:"):
                _, hwnd, query = res_text.split(":", 2)
                ai_res = get_gemini_response(query, conversation_id=conv_id, force_hwnd=int(hwnd))
                res_text = ai_res["response"]
            _MEMORY.add_message(conv_id, "user", command)
            _MEMORY.add_message(conv_id, "model", str(res_text))
            audio = get_elevenlabs_audio_base64(str(res_text)) if use_voice else None
            return {"response": str(res_text), "action": "execute", "audio_base64": audio}
        except Exception as ex:
            return {"response": f"Sir, several neural circuits are unresponsive: {str(ex)[:80]}", "action": "error"}

    # 1. Get text immediately (Streaming happens inside _call_gemini_api)
    ai_res = get_gemini_response(command, conversation_id=conv_id)
    _MEMORY.add_message(conv_id, "user", command)
    response_text = ai_res["response"]

    # 2. Dynamic Titling: If generic, rename based on topic
    try:
        current_title = _MEMORY.get_conversation_title(conv_id)
        is_generic = current_title in ["New Conversation", "Analyse all applications", "Untitled"]
        if is_generic and len(command.split()) > 1:
            title_prompt = f"Extract a 3-word title for this topic: '{command}'. Respond ONLY with the title."
            new_title = _call_gemini_api(model="gemini-2.5-flash", contents=[{"role":"user", "parts":[{"text":title_prompt}]}], config={"temperature":0.1}, stream=False)
            if new_title and len(new_title) < 50 and "Error" not in new_title:
                _MEMORY.rename_conversation(conv_id, new_title.strip().replace('"', ''))
    except Exception:
        pass 

    # 3. VOICE ENGINE SYNC: Generate audio while UI begins projection
    # Return immediately; audio will follow as a secondary packet if needed
    audio = get_elevenlabs_audio_base64(response_text) if use_voice else None
    return {"response": response_text, "action": "neural_final", "audio_base64": audio}

def _main_loop():
    """Titan Hyper-Sync: Persistent Input Listener"""
    if sys.stdout.encoding.lower() != 'utf-8':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    print(json.dumps({"status": "READY", "bridge": "HYPER_SYNC"}), flush=True)

    while True:
        try:
            line = sys.stdin.readline()
            if not line: break
            payload = json.loads(line)
            result = process_command(payload.get("text", ""), use_voice=payload.get("voice", False))
            print(json.dumps(result, ensure_ascii=False), flush=True)
        except Exception as e:
            print(json.dumps({"response": f"Core error: {str(e)}", "action": "error"}), flush=True)

if __name__ == "__main__":
    _main_loop()
