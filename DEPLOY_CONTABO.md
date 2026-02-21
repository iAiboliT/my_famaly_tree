# Инструкция по развертыванию на Contabo (Cloud VPS S)

Contabo — это "монстр" по соотношению цены и ресурсов (16 ГБ RAM на тарифе VPS S). Проект "Генеалогическое Древо", почтовый сервер и VPN будут работать здесь идеально.

## Шаг 1: Покупка и выбор ОС
1. Зайдите на [contabo.com](https://contabo.com/).
2. Выберите тариф **Cloud VPS S**.
3. **Region:** Выбирайте Германию (минимальная задержка и цена).
4. **Storage:** 200 GB SSD (стандарт).
5. **Image:** **Ubuntu 24.04** (LTS).
6. **Login & Password:** Сохраните пароль `root`.
7. **Оплата:** Если нет зарубежной карты, используйте сервисы-посредники (например, через бота в Telegram или Plati.Market для оплаты счетов PayPal/Card).

## Шаг 2: Базовая настройка сервера
Подключитесь по SSH:
```bash
ssh root@IP_ВАШЕГО_СЕРВЕРА
```

Обновите систему и установите Docker (он понадобится и для Древа, и для Почты):
```bash
apt update && apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install -y docker-compose-v2 git nginx certbot python3-certbot-nginx
```

## Шаг 3: Развертывание Генеалогического Древа
1. Клонируйте проект:
   ```bash
   git clone https://github.com/iAiboliT/my_famaly_tree.git
   cd my_famaly_tree
   ```
2. Настройте `.env` (см. инструкцию в `DEPLOY_TIMEWEB.md` для деталей по паролям).
3. Запустите:
   ```bash
   docker compose up -d --build
   ```

## Шаг 4: Настройка Почтового Сервера (Mailcow)
Contabo идеально подходит для Mailcow благодаря 16 ГБ RAM.
1. Подготовьте DNS для домена: установите `A` запись `mail.your-domain.com` на IP сервера.
2. Установите Mailcow:
   ```bash
   cd ~
   git clone https://github.com/mailcow/mailcow-dockerized
   cd mailcow-dockerized
   ./generate_config.sh  # Укажите hostname: mail.your-domain.com
   docker compose up -d
   ```
3. Админка почты будет доступна по адресу `https://mail.your-domain.com`.

## Шаг 5: Настройка VPN (VLESS + Reality)
Для обхода блокировок и скрытого VPN:
1. Запустите консольную панель 3X-UI:
   ```bash
   bash <(curl -Ls https://raw.githubusercontent.com/maci0648/3X-UI/master/install.sh)
   ```
2. Откройте нужный порт в фаерволе (если включен) и зайдите в панель по IP:порту. Создайте подключение типа **VLESS** с протоколом **Reality**.

## Важные нюансы Contabo:
- **Reverse DNS:** Для работы почты обязательно зайдите в панель Contabo -> **Reverse DNS** и пропишите для своего IP имя `mail.your-domain.com`. Без этого письма будут в спаме.
- **Порт 25:** Contabo по умолчанию открывает порт 25 для новых аккаунтов. Если почта не отправляется — напишите в поддержку (Support), они открывают его по запросу в течение пары часов.
- **Производительность:** На тарифе VPS S запуск 3 таких проектов даже не нагрузит процессор на 10%.

---
*Подготовлено Antigravity для iAiboliT. Приятного пользования 🌳🚀*
