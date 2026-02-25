#!/bin/bash

# Настройки
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/db_backup.sql"
DATE=$(date +"%Y-%m-%d %H:%M:%S")

# Создаем папку если нет
mkdir -p $BACKUP_DIR

echo "[$DATE] Starting backup..."

# Делаем дамп базы из Docker контейнера
docker exec familytree-db pg_dump -U postgres familytree > $BACKUP_FILE

# Проверяем изменения
if [[ -n $(git status -s $BACKUP_FILE) ]]; then
  echo "Changes detected, syncing to GitHub..."
  git add $BACKUP_FILE
  git commit -m "Auto-backup: $DATE"
  git push origin main
  echo "Sync complete!"
else
  echo "No changes in database, skipping sync."
fi
