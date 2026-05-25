@echo off
chcp 65001 >nul
setlocal
title TrazaSole - Exportar DB
cd /d "%~dp0.."

echo.
echo ========================================
echo  TRAZASOLE - EXPORTAR BASE DE DATOS
echo ========================================
echo.

if not exist "backups" mkdir backups
if not exist "backups\db" mkdir "backups\db"

for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "FECHA=%dt:~0,4%-%dt:~4,2%-%dt:~6,2%_%dt:~8,2%%dt:~10,2%"

set "OUTPUT=backups\db\db_%FECHA%.sql"

echo [INFO] Exportando base de datos...
echo [OUTPUT] %OUTPUT%

set PGPASSWORD=1810
if exist "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" (
    "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -h localhost -p 5432 -U frigo_user -d frigorifico -F p -f "%OUTPUT%" >nul 2>&1
    if exist "%OUTPUT%" (
        echo.
        echo [OK] Base de datos exportada
    ) else (
        echo.
        echo [ERROR] No se pudo exportar
    )
) else (
    echo.
    echo [ERROR] PostgreSQL no encontrado
)

echo.
pause