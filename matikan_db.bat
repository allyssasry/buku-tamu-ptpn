@echo off
title Matikan Database Buku Tamu (Port 5433)
echo Menghentikan PostgreSQL di Port 5433...
"C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" stop -D "C:\Users\Allyssa\pgdata" -m fast
echo.
echo Database Port 5433 telah dimatikan.
pause
