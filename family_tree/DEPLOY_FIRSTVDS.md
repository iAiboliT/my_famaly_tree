# Инструкция по развертыванию на FirstVDS

Этот проект подготовлен для развертывания на серверах **FirstVDS** с использованием Docker. FirstVDS — один из старейших и надежных провайдеров в РФ, отлично подходит для Next.js приложений.

## Шаг 1: Заказ сервера

1. Перейдите на [FirstVDS](https://firstvds.ru/).
2. Выберите тариф (например, "VDS Разгон" или "VDS Старт"):
   - **ОС:** Ubuntu 22.04 LTS или 24.04 LTS.
   - **Конфигурация:** Минимум 2 ГБ RAM (для стабильной сборки проекта).
   - **Предустановленное ПО:** Если есть возможность, выберите образ с **Docker**. Если нет — установим вручную.
3. Дождитесь активации сервера и сохраните IP-адрес и пароль root, которые придут на почту.

## Шаг 2: Первичная настройка сервера

Подключитесь к серверу через SSH (в Windows используйте PowerShell или PuTTY):
```bash
ssh root@IP_ВАШЕГО_СЕРВЕРА
```

Если Docker не был установлен при заказе, выполните:
```bash
apt update && apt upgrade -y
apt install -y docker.io docker-compose-v2 nginx certbot python3-certbot-nginx
systemctl enable --now docker
```

## Шаг 3: Развертывание проекта

1. **Клонируйте проект с GitHub:**
   ```bash
   git clone https://github.com/iAiboliT/my_famaly_tree.git
   cd my_famaly_tree
   ```

2. **Настройте переменные окружения:**
   ```bash
   cp .env.example .env
   nano .env
   ```
   *В редакторе nano ОБЯЗАТЕЛЬНО измените:*
   - `DATABASE_URL`: замените пароль `postgres` в ссылке на свой сложный.
   - `POSTGRES_PASSWORD`: поставьте тот же пароль, что и в строке выше.
   - `NEXTAUTH_SECRET`: вставьте любую длинную случайную строку.
   - `NEXTAUTH_URL`: укажите `https://ваш-домен.рф`.
   *(Нажмите Ctrl+O, Enter, Ctrl+X для сохранения)*

3. **Запустите проект:**
   ```bash
   docker compose up -d --build
   ```

## Шаг 4: Настройка домена и SSL (Бесплатно)

Чтобы сайт открывался по домену и имел замочек (SSL):

1. **Настройте Nginx как прокси:**
   ```bash
   nano /etc/nginx/sites-available/familytree
   ```
   Вставьте этот конфиг (заменив `your-domain.com` на ваш):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com; # ВАШ ДОМЕН

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

2. **Активируйте конфиг:**
   ```bash
   ln -s /etc/nginx/sites-available/familytree /etc/nginx/sites-enabled/
   nginx -t && systemctl restart nginx
   ```

3. **Получите сертификат Let's Encrypt:**
   ```bash
   certbot --nginx -d your-domain.com
   ```
   *Следуйте инструкциям: введите email и согласитесь на редирект (Option 2).*

## Особенности FirstVDS
- **Swap:** Если на сервере мало оперативной памяти, FirstVDS позволяет легко создать swap-файл, чтобы сборка `npm run build` не падала.
- **Поддержка:** Если возникнут проблемы с сетевым доступом, проверьте раздел "Брандмауэр" в личном кабинете.

---
*Инструкция актуальна для 2026 года. Antigravity.*
