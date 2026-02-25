
import psutil
import win32gui
import win32process
import time
import requests
from models import ActivityLog, init_db
from datetime import datetime

# --- CONFIG ---
TELEGRAM_BOT_TOKEN = "8273896748:AAEHpObUiJ45EVMKXMI4vYf7ZNKQNmY8Hmg" # Get from BotFather
PARENT_CHAT_ID = "786455456"       # Get from @userinfobot

STUDY_KEYWORDS = ["гдз", "решебник", "дневник.ру", "класс", "учебник", "school", "math", "physics", "python", "vscode"]
GAME_PROCESSES = ["minecraft", "csgo", "valorant", "dota2", "steam", "discord", "roblox"]
VIDEO_KEYWORDS = ["youtube", "twitch", "rutube", "kinopoisk", "netflix"]

# Alert Thresholds
GAME_ALERT_THRESHOLD = 30 * 60  # 30 minutes
CHECK_INTERVAL = 5

def send_telegram_alert(message):
    """Sends a message directly to the parent's chat."""
    if TELEGRAM_BOT_TOKEN == "YOUR_BOT_TOKEN" or PARENT_CHAT_ID == "YOUR_CHAT_ID":
        print(f"[Would send Telegram]: {message}")
        return

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": PARENT_CHAT_ID,
        "text": message,
        "parse_mode": "Markdown"
    }
    try:
        requests.post(url, json=payload)
    except Exception as e:
        print(f"Failed to send alert: {e}")

def get_active_window_info():
    """Returns (process_name, window_title) of the active window."""
    try:
        hwnd = win32gui.GetForegroundWindow()
        window_title = win32gui.GetWindowText(hwnd)
        
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        process = psutil.Process(pid)
        process_name = process.name().lower()
        
        return process_name, window_title
    except Exception as e:
        return "unknown", "unknown"

def classify_activity(window_title, process_name):
    """Determines the category: 'Study', 'Game', 'Video', 'Other'."""
    title_lower = window_title.lower()
    proc_lower = process_name.lower()
    
    for game in GAME_PROCESSES:
        if game in proc_lower or game in title_lower:
            return "Game"
            
    for keyword in STUDY_KEYWORDS:
        if keyword in title_lower:
            return "Study"
            
    for keyword in VIDEO_KEYWORDS:
        if keyword in title_lower:
            return "Video"
            
    return "Other"

def main_loop():
    print("Initializing DB...")
    init_db()
    print("Starting monitoring...")
    
    consecutive_game_seconds = 0
    last_alert_time = 0

    while True:
        process_name, window_title = get_active_window_info()
        category = classify_activity(window_title, process_name)
        timestamp = datetime.now()
        
        # Log to DB
        if window_title and window_title != "unknown":
             print(f"[{timestamp.strftime('%H:%M:%S')}] {category}: {process_name}")
             ActivityLog.create(
                 process_name=process_name,
                 window_title=window_title,
                 category=category,
                 duration_seconds=CHECK_INTERVAL
             )

        # Alert Logic
        if category == "Game":
            consecutive_game_seconds += CHECK_INTERVAL
        else:
            consecutive_game_seconds = 0
            
        # Send alert if gaming for too long (and haven't alerted in last 30 mins)
        if consecutive_game_seconds >= GAME_ALERT_THRESHOLD:
            if time.time() - last_alert_time > 1800: # Don't spam, alert every 30m
                send_telegram_alert(f"⚠️ **Alert**: Child has been gaming for {consecutive_game_seconds // 60} minutes!\nApp: `{process_name}`")
                last_alert_time = time.time()
        
        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main_loop()
