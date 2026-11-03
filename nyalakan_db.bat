@echo off
title Nyalakan Database Buku Tamu (Port 5433)
echo Menyalakan PostgreSQL di Port 5433...
"C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" start -D "C:\Users\Allyssa\pgdata" -l "C:\Users\Allyssa\pgdata\logfile.log" -o "-p 5433"
echo.
echo Database sudah aktif di Port 5433!
pause
