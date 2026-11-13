@echo off
chcp 65001 >nul

echo Остановка ClearWork...

REM Закрываем окно сервера
taskkill /f /fi "WINDOWTITLE eq ClearWork server*" >nul 2>&1

REM На всякий случай освобождаем порт 3000
for /f "tokens=5" %%p in ('netstat -ano ^| findstr LISTENING ^| findstr ":3000 "') do taskkill /f /pid %%p >nul 2>&1

ping -n 2 127.0.0.1 >nul
echo Готово. Сервер остановлен.
ping -n 3 127.0.0.1 >nul
exit /b 0