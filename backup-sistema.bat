@echo off
title TrazaSole - Backup de Base de Datos
echo ========================================
echo   TRAZASOLE - Backup de Base de Datos
echo ========================================
echo.
cd /d "C:\TrazaSole"

REM Obtener fecha y hora para el nombre del backup
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set FECHA=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%
set HORA=%datetime:~8,2%-%datetime:~10,2%
set VERSION=v3.0.1

REM Crear carpeta de backups si no existe
if not exist "backups" mkdir backups

REM Nombre del archivo de backup
set BACKUP_FILE=backups\backup_%FECHA%_%HORA%_%VERSION%.sql

echo [1/2] Creando backup de PostgreSQL...
echo        Archivo: %BACKUP_FILE%
echo.

REM Crear backup usando pg_dump (PostgreSQL)
set PGPASSWORD=1810
"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U postgres -h localhost -d trazasole -F p -f "%BACKUP_FILE%" 2>nul

if %ERRORLEVEL% equ 0 (
    echo [OK] Backup creado exitosamente!
    echo.
    echo ========================================
    echo   Backup guardado en:
    echo   %CD%\%BACKUP_FILE%
    echo ========================================
) else (
    echo [ERROR] No se pudo crear el backup
    echo.
    echo Verifica que PostgreSQL este corriendo y las credenciales sean correctas.
)

echo.
echo [2/2] Listando backups existentes:
echo.
dir /b backups\*.sql 2>nul
if %ERRORLEVEL% neq 0 (
    echo No hay backups anteriores.
)

echo.
pause
