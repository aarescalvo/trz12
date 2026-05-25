@echo off
chcp 65001 >nul
title TrazaSole - Listar Backups
cd /d "%~dp0.."
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║        TRAZASOLE v3.7.24 - LISTAR BACKUPS              ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Crear carpetas si no existen
if not exist "backups" mkdir backups
if not exist "backups\base-datos" mkdir "backups\base-datos"
if not exist "backups\sistema" mkdir "backups\sistema"

echo ════════════════════════════════════════════════════════════
echo BACKUPS DE BASE DE DATOS (backups\base-datos\)
echo ════════════════════════════════════════════════════════════
echo.

set DB_COUNT=0
for /f %%a in ('dir /b "backups\base-datos\*.sql" 2^>NUL ^| find /c /v ""') do set DB_COUNT=%%a

if %DB_COUNT%==0 (
    echo [INFO] No hay backups de base de datos.
) else (
    echo Total: %DB_COUNT% backup(s)
    echo.
    dir "backups\base-datos\*.sql" /o-d /t:c
)

echo.
echo ════════════════════════════════════════════════════════════
echo BACKUPS DE SISTEMA COMPLETO (backups\sistema\)
echo ════════════════════════════════════════════════════════════
echo.

set SYS_COUNT=0
for /f %%a in ('dir /b /ad "backups\sistema\backup_sistema_*" 2^>NUL ^| find /c /v ""') do set SYS_COUNT=%%a

if %SYS_COUNT%==0 (
    echo [INFO] No hay backups de sistema completo.
) else (
    echo Total: %SYS_COUNT% backup(s)
    echo.
    dir "backups\sistema" /ad /o-d /t:c
)

echo.
echo ════════════════════════════════════════════════════════════
echo RESUMEN
echo ════════════════════════════════════════════════════════════
echo.
echo  Backups de base de datos: %DB_COUNT%
echo  Backups de sistema:       %SYS_COUNT%
echo  Total backups:            %DB_COUNT% + %SYS_COUNT% = %DB_COUNT% + %SYS_COUNT%
echo.
echo  Limite configurado: 50 backups por tipo
echo.

REM Calcular espacio usado
echo Espacio en disco usado:
for /f "tokens=3" %%a in ('dir "backups" /s ^| find "Archivo(s)"') do echo %%a bytes en archivos
echo.
pause
