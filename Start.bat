@echo off
chcp 65001 >nul
cd /d "%~dp0"
title ClearWork launcher

echo ================================
echo    ClearWork - запуск
echo ================================
echo.

REM Проверка Node.js
where node >nul 2>&1
if errorlevel 1 (
  echo ОШИБКА: Node.js не найден.
  echo Установите Node.js с сайта https://nodejs.org и запустите снова.
  pause
  exit /b 1
)

REM Зависимости
if exist node_modules goto deps_ok
echo Установка зависимостей, это может занять минуту...
call npm install
if errorlevel 1 goto fail
:deps_ok

REM Сборка проекта (продакшен-режим - без панели разработчика)
if exist ".next\BUILD_ID" goto build_ok
echo Первая сборка проекта, подождите около минуты...
call npm run build
if errorlevel 1 goto fail
:build_ok

REM База данных
echo Проверка базы данных...
call npx prisma migrate deploy
if errorlevel 1 goto fail

REM Освобождаем порт 3000 от прошлых запусков
echo Проверка порта 3000...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr LISTENING ^| findstr ":3000 "') do taskkill /f /pid %%p >nul 2>&1
ping -n 2 127.0.0.1 >nul

set "USE_CURL=1"
where curl >nul 2>&1 || set "USE_CURL=0"

REM Запуск сервера в отдельном окне
echo Запуск сервера...
start "ClearWork server" cmd /k "npm start"

echo Ожидание сервера (до 3 минут)
set /a tries=0
:wait
if "%USE_CURL%"=="1" (
  curl -s -o nul --max-time 5 http://localhost:3000 >nul 2>&1
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest 'http://localhost:3000' -UseBasicParsing -TimeoutSec 5 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
)
if not errorlevel 1 goto ready
set /a tries+=1
if %tries% geq 30 goto timeout
<nul set /p "=."
ping -n 3 127.0.0.1 >nul
goto wait

:timeout
echo.
echo Сервер не поднялся за 3 минуты.
echo Откройте окно "ClearWork server" - там будет описание ошибки.
echo Сообщите, что в нём написано.
pause
exit /b 1

:ready
echo.
echo Готово! Открываю ClearWork в браузере...
start "" http://localhost:3000
echo.
echo Сервер работает в отдельном окне - не закрывайте его.
echo Чтобы остановить - запустите Stop.bat.
echo.
pause
exit /b 0

:fail
echo.
echo ОШИБКА: не удалось запустить ClearWork.
echo Проверьте: node -v   и   npm -v
echo Также порт 3000 не должен быть занят другой программой.
pause
exit /b 1