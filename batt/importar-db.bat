@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title TrazaSole - Importar DB
cd /d "%~dp0.."

echo.
echo ========================================
echo  TRAZASOLE - IMPORTAR BASE DE DATOS
echo ========================================
echo.

if not exist "backups\db" (
    echo [ERROR] No hay backups de base de datos
    pause
    exit /b 1
)

set COUNT=0
for /f "delims=" %%f in ('dir /b /o-d "backups\db\*.sql" 2^>NUL') do (
    set /a COUNT+=1
    set "FILE_!COUNT!=%%f"
    echo [!COUNT!] %%f
)

if %COUNT%==0 (
    echo [ERROR] No hay archivos SQL
    pause
    exit /b 1
)

echo.
set /p SEL="Selecciona numero: "

if %SEL% LSS 1 exit /b 1
if %SEL% GTR %COUNT% exit /b 1

set "DB_FILE=!FILE_%SEL%!"
set "DB_PATH=backups\db\%DB_FILE%"

echo.
echo [ADVERTENCIA] Se importara: %DB_FILE%
set /p CONF="Continuar? (S/N): "
if /i not "%CONF%"=="S" exit /b 0

echo.
echo [INFO] Importando base de datos...

set PGPASSWORD=1810
if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
    "C:\Program Files\PostgreSQL\16\bin\psql.exe" -h localhost -p 5432 -U frigo_user -d frigorifico -f "%DB_PATH%" >nul 2>&1
    echo [OK] Base de datos importada
)

echo.
pause