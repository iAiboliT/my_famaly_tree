# PC Spy - Parental Control & Activity Monitor

## Overview
A lightweight Windows activity monitoring system designed to track computer usage patterns (Study vs Gaming vs Entertainment) and report statistics via Telegram.

## Goal
To monitor:
1.  **Time spent on Study**: Tracking specific educational websites (e.g., G dz, Reshalka).
2.  **Time spent on Gaming**: Detecting game processes.
3.  **Time spent on Entertainment**: Tracking YouTube and video platforms.
4.  **Reporting**: Sending daily/weekly reports to a parent's Telegram account.

## Tech Stack
- **Language**: Python 3.10+
- **System Access**: `psutil`, `pywin32` (for active window titles and process monitoring).
- **Database**: SQLite (local storage of activity logs).
- **Interface**: Telegram Bot (`python-telegram-bot`).

## Architecture
1.  **Monitor Service**: Runs in the background, checks the active window every X seconds.
2.  **analyzer**: Classifies the active window title/process into categories (Study, Game, Video, Idle, Other).
3.  **Reporter**: Aggregates data and sends summaries via Telegram.

## Installation & Startup

### 1. Configure
Edit `monitor.py` and replace `TELEGRAM_BOT_TOKEN` and `PARENT_CHAT_ID` with your own values.

### 2. Manual Run (Testing)
To test if it works, run:
```bash
python monitor.py
```
You should see logs in the console.

### 3. Install to Startup (Hidden Mode)
To make the monitor start automatically when Windows boots (without a console window):
1.  Open PowerShell as Administrator (optional but recommended).
2.  Run the installation script:
    ```powershell
    .\install_startup.ps1
    ```
    This creates a shortcut in your Startup folder pointing to `run_hidden.vbs`.

To verify, press `Win + R`, type `shell:startup`, and check if `PC_Spy.lnk` exists.

### 4. Database
The activity logs are stored in `activity_log.db` (SQLite). You can view them using any SQLite browser or by running the bot's `/report` command.

