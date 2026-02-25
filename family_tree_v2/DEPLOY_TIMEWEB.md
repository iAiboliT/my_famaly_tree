# Инструкция по развертыванию на Timeweb Cloud

Этот проект подготовлен для развертывания с использованием **Docker** и **Docker Compose**. Это самый надежный способ запустить Next.js приложение и базу данных PostgreSQL на VDS.

## Шаг 1: Подготовка сервера (VDS)

1. Зайдите в панель [Timeweb Cloud](https://timeweb.cloud/).
2. Создайте новый сервер (Облачный сервер):
   - **Образ:** Ubuntu 22.04 или 24.04.
   - **Конфигурация:** Минимум 1 vCPU, 2 ГБ RAM (Next.js может быть требователен к памяти при сборке).
   - **Локация:** По вашему выбору (Москва/СПб для минимального пинга в РФ).
3. При создании выберите установку **Docker** (в разделе "Маркетплейс" или "Дополнительное ПО"), чтобы не ставить его вручную.

## Шаг 2: Настройка переменных окружения

На сервере создайте файл `.env` в корневой папке проекта со следующими параметрами:

```env
# URL вашей базы данных (если используете Docker Compose, оставьте как есть)
DATABASE_URL="postgresql://postgres:REPLACE_WITH_STRONG_PASSWORD@familytree-db:5432/familytree?schema=public"

# Секретный ключ для авторизации (сгенерируйте любой длинный случайный набор символов)
NEXTAUTH_SECRET="your-super-secret-random-string"

# Полный URL вашего сайта
NEXTAUTH_URL="https://your-domain.com"
```

## Шаг 3: Перенос проекта на сервер

Самый простой способ — использовать Git:

```bash
git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ>
cd <ПАПКА_ПРОЕКТА>
```

Или через SCP/SFTP, если проект лежит локально.

## Шаг 4: Запуск проекта

1. Убедитесь, что вы находитесь в папке проекта.
2. В файле `docker-compose.yml` замените пароль `postgres` на свой надежный пароль (тот же, что указали в `.env`).
3. Запустите сборку и старт контейнеров:

```bash
docker compose up -d --build
```

Команда `--build` соберет проект внутри контейнера (это займет 2-5 минут), а `-d` запустит его в фоновом режиме.

## Шаг 5: Настройка домена и SSL

Для того, чтобы сайт работал по HTTPS на вашем домене, рекомендуется установить **Nginx** как Reverse Proxy.

1. Установите Nginx: `sudo apt update && sudo apt install nginx`
2. Создайте конфиг `/etc/nginx/sites-available/familytree`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

3. Активируйте конфиг и установите SSL через Certbot:
```bash
sudo ln -s /etc/nginx/sites-available/familytree /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Полезные команды

- **Просмотр логов:** `docker compose logs -f familytree-app`
- **Перезапуск проекта:** `docker compose restart`
- **Обновление кода:** `git pull && docker compose up -d --build`

---
*Подготовлено Antigravity для проекта "Фамильное Древо"*
