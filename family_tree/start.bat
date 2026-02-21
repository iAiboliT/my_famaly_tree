@echo off
echo Starting Family Tree...
docker-compose up -d
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b
)
echo.
echo Application started at http://localhost:3000
pause
