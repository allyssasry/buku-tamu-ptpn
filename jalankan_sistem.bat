@echo off
title Holding GateKeeper - Guest & Security Monitoring System
echo ========================================================
echo   MENJALANKAN GUEST & SECURITY MONITORING SYSTEM
echo ========================================================
echo.

echo 1. Memulai PostgreSQL Database (Port 5433)...
start "PostgreSQL Server" /B "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D "C:\Users\Allyssa\pgdata" -p 5433

timeout /t 2 >nul

echo 2. Memulai Backend Laravel REST API (Port 8000)...
start "Laravel Backend API" cmd /k "cd backend && php artisan serve --port=8000"

timeout /t 2 >nul

echo 3. Memulai Frontend React (Port 5173)...
start "React Frontend Vite" cmd /k "cd frontend && npm run dev"

timeout /t 2 >nul

echo.
echo ========================================================
echo   SISTEM SUDAH AKTIF BERJALAN!
echo   Buka di Browser: http://localhost:5173
echo ========================================================
start http://localhost:5173
pause
