# PC Spy - Implementation Plan

## Goal
A Windows monitoring agent to track child PC usage (Games, Study, YouTube) and report to a Telegram chat.

## Phase 1: Foundation (P0)
- [ ] Requirements & Setup (Python, Git, `.gitignore`).
- [ ] `README.md` and basic structure.

## Phase 2: Monitoring Core (P1)
- [ ] `monitor.py`: Continuous loop checking the active window title.
    - [ ] Get active window title on Windows (`pywin32` or `ctypes`).
    - [ ] Get process name of active window (`psutil`).
    - [ ] Measure duration of focus.
- [ ] `classifier.py`: Rule engine to tag window titles.
    - [ ] **Study**: Keywords like "gdz", "resheba", "homework".
    - [ ] **Video**: Keywords like "YouTube", "Netflix", "Anime".
    - [ ] **Game**: Process names (Steam, Valorant, Minecraft) or window titles.

## Phase 3: Data Storage (P2)
- [ ] `database.py`: SQLite schema `activities` (timestamp, window_title, process_name, duration, category).
- [ ] Function to log active sessions.

## Phase 4: Reporting via Telegram (P1)
- [ ] `bot.py`: Telegram bot setup.
    - [ ] `/status`: Get current activity (real-time).
    - [ ] `/report`: Get daily summary (Time spent per category).
    - [ ] Alert system: Notify if gaming exceeds X hours.

## Phase 5: Packaging & Background Run (P3)
- [ ] Make script run on startup.
- [ ] Hide console window.
