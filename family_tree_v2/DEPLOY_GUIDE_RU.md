# Инструкция по развертыванию Family Tree на Timeweb Cloud (Ubuntu 22.04)

Эта инструкция предназначена для ручной установки проекта (без Docker) с настройкой базы данных, PM2 (для автозапуска) и HTTPS (для безопасности).

---

## Часть 1: Подготовка сервера

1. Создайте облачный сервер на Timeweb Cloud с ОС **Ubuntu 22.04**.
2. Зайдите на сервер через **Консоль** в панели управления.

---

## Часть 2: Установка окружения (Node.js и PostgreSQL)

### 1. Установка Node.js (Версия 20)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Установка PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib -y
```

### 3. Настройка Базы Данных
Создаем базу данных и пользователя:
```bash
sudo -u postgres psql -c "CREATE DATABASE familytree;"
sudo -u postgres psql -c "CREATE USER familyuser WITH PASSWORD 'my_strong_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE familytree TO familyuser;"
```

**ВАЖНО (Исправление ошибки прав для PostgreSQL 15+):**
Если при деплое возникнет ошибка `permission denied for schema public`, выполните:
```bash
sudo -u postgres psql -d familytree -c "GRANT ALL ON SCHEMA public TO familyuser; ALTER SCHEMA public OWNER TO familyuser;"
```

---

## Часть 3: Загрузка и сборка проекта

### 1. Скачивание кода
```bash
git clone -b family_tree_v2 https://github.com/iAiboliT/my_famaly_tree.git
cd my_famaly_tree
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка .env (Файл параметров)
Создайте файл:
```bash
nano .env
```
Вставьте туда настройки (замените `ВАШ_IP_ИЛИ_ДОМЕН` на реальный адрес):
```env
DATABASE_URL="postgresql://familyuser:my_strong_password@localhost:5432/familytree"
NEXTAUTH_SECRET="lyubov_k_istorii_123"
NEXTAUTH_URL="http://ВАШ_IP_ИЛИ_ДОМЕН"
```
*(После настройки домена на Шаге 4 смените http на https)*

### 4. Подготовка базы и сборка сайта
```bash
npx prisma generate
npx prisma db push
npm run build
```

---

## Часть 4: Настройка HTTPS (Замочек безопасности)

### 1. Установка Nginx
```bash
sudo apt install nginx -y
```

### 2. Привязка домена к проекту
```bash
sudo nano /etc/nginx/sites-available/familytree
```
Вставьте этот блок (замените `ВАШ_ДОМЕН` на, например, `history.ru`):
```nginx
server {
    listen 80;
    server_name ВАШ_ДОМЕН;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Активируйте:
```bash
sudo ln -s /etc/nginx/sites-available/familytree /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

### 3. Получение сертификата (Бесплатно)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d ВАШ_ДОМЕН
```

---

## Часть 5: Автозапуск через PM2

Чтобы сайт работал 24/7 и запускался сам при перезагрузке сервера:
```bash
npm install -g pm2
pm2 start npm --name "family-tree" -- start
pm2 save
pm2 startup
```

*(Если нужно перезапустить сайт после обновления кода: `pm2 restart family-tree`)*
