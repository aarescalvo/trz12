@echo off
chcp 65001 >nul
title TrazaSole - Backup Base de Datos
cd /d "%~dp0.."
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║      TRAZASOLE v3.7.24 - BACKUP BASE DE DATOS          ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Crear carpeta de backups si no existe
if not exist "backups" mkdir backups
if not exist "backups\base-datos" mkdir "backups\base-datos"

REM Obtener fecha y hora
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "datetime=%%a"
set "FECHA=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%"
set "HORA=%datetime:~8,2%-%datetime:~10,2%"
set "VERSION=3.7.24"

REM Nombre del archivo
set "BACKUP_FILE=backups\base-datos\backup_%FECHA%_%HORA%_v%VERSION%.sql"

echo [INFO] Creando backup de PostgreSQL...
echo [INFO] Archivo: %BACKUP_FILE%
echo.

REM Configuracion de PostgreSQL (ajustar segun tu instalacion)
set "PGHOST=localhost"
set "PGPORT=5432"
set "PGUSER=frigo_user"
set "PGDATABASE=frigorifico"

REM Ejecutar pg_dump
echo [ACCION] Ejecutando pg_dump...
set PGPASSWORD=1810
"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -F p -f "%BACKUP_FILE%" 2>NUL

if exist "%BACKUP_FILE%" (
    echo.
    echo ════════════════════════════════════════════════════════════
    echo [OK] Backup creado exitosamente!
    echo ════════════════════════════════════════════════════════════
    echo.
    echo Archivo: %BACKUP_FILE%
    for %%A in ("%BACKUP_FILE%") do echo Tamaño: %%~zA bytes
    echo.
) else (
    echo.
    echo [ERROR] No se pudo crear el backup.
    echo [INFO] Verifica que PostgreSQL este corriendo y las credenciales sean correctas.
    echo.
)

REM Limpiar backups antiguos (mantener ultimos 50)
echo [INFO] Limpiando backups antiguos (manteniendo ultimos 50)...
echo.

REM Contar backups
set COUNT=0
for /f %%a in ('dir /b /o-d "backups\base-datos\backup_*.sql" 2^>NUL ^| find /c /v ""') do set COUNT=%%a
echo [INFO] Backups encontrados: %COUNT%

if %COUNT% GTR 50 (
    set /a ELIMINAR=%COUNT%-50
    echo [INFO] Eliminando %ELIMINAR% backup(s) antiguo(s)...
    
    for /f "skip=50 delims=" %%f in ('dir /b /o-d "backups\base-datos\backup_*.sql" 2^>NUL') do (
        echo [ELIMINANDO] %%f
        del /q "backups\base-datos\%%f" 2>NUL
    )
) else (
    echo [INFO] No hay backups antiguos para eliminar.
)

echo.
echo ════════════════════════════════════════════════════════════
echo [LISTO] Proceso de backup completado.
echo ════════════════════════════════════════════════════════════
echo.
pause
