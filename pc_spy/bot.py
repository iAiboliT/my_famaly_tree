
import os
import asyncio
from datetime import datetime, timedelta
from peewee import fn
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from models import ActivityLog, init_db

# --- CONFIG ---
TOKEN = "8273896748:AAEHpObUiJ45EVMKXMI4vYf7ZNKQNmY8Hmg"
PARENT_ID = "786455456"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Greets the user and explains commands."""
    await update.message.reply_text("👋 Hello! Use /status to see current activity or /report for daily stats.")

async def get_report(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Generates a daily activity report."""
    today = datetime.now().date()
    
    # Simple query: Sum duration grouped by category for today
    stats = (ActivityLog
             .select(ActivityLog.category, fn.SUM(ActivityLog.duration_seconds).alias('total_seconds'))
             .where(fn.date(ActivityLog.timestamp) == today)
             .group_by(ActivityLog.category))
             
    message = f"📊 **Activity Report ({today})**\n"
    total_time = 0
    
    for stat in stats:
        hours = stat.total_seconds // 3600
        minutes = (stat.total_seconds % 3600) // 60
        message += f"- **{stat.category}**: {hours}h {minutes}m\n"
        total_time += stat.total_seconds
        
    total_hours = total_time // 3600
    total_minutes = (total_time % 3600) // 60
    message += f"\n⏱ **Total Tracked Time**: {total_hours}h {total_minutes}m"
    
    await update.message.reply_text(message, parse_mode='Markdown')

async def check_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Checks the most recent activity log."""
    last_log = ActivityLog.select().order_by(ActivityLog.timestamp.desc()).limit(1).first()
    
    if last_log:
        await update.message.reply_text(
            f"👀 **Current Activity**\n"
            f"- App: `{last_log.process_name}`\n"
            f"- Title: `{last_log.window_title}`\n"
            f"- Category: **{last_log.category}**\n"
            f"- Time: {last_log.timestamp.strftime('%H:%M:%S')}",
            parse_mode='Markdown'
        )
    else:
        await update.message.reply_text("No activity logs found yet. Start the monitor script!")

def main():
    """Starts the bot."""
    if TOKEN == "YOUR_TELEGRAM_BOT_TOKEN":
        print("Error: Please set TELEGRAM_BOT_TOKEN in env or code.")
        return

    # Basic setup using ApplicationBuilder (python-telegram-bot v20+)
    application = Application.builder().token(TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("report", get_report))
    application.add_handler(CommandHandler("status", check_status))

    print("Bot is running...")
    application.run_polling()

if __name__ == '__main__':
    main()
