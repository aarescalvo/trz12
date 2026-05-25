@echo off
chcp 65001 >nul
setlocal
title TrazaSole - Backup
cd /d "%~dp0.."

echo.
echo ========================================
echo  TRAZASOLE - BACKUP COMPLETO
echo ========================================
echo.

if not exist "backups" mkdir backups
if not exist "backups\batt" mkdir "backups\batt"

for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "FECHA=%dt:~0,4%-%dt:~4,2%-%dt:~6,2%"
set "HORA=%dt:~8,2%-%dt:~10,2%"

set "BACKUP_DIR=backups\batt\backup_%FECHA%_%HORA%"
mkdir "%BACKUP_DIR%"

echo [1/4] Copiando archivos src...
xcopy "src" "%BACKUP_DIR%\src" /E /I /Q /Y >nul 2>&1

echo [2/4] Copiando archivos prisma...
xcopy "prisma" "%BACKUP_DIR%\prisma" /E /I /Q /Y >nul 2>&1

echo [3/4] Exportando base de datos...
set PGPASSWORD=1810
if exist "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" (
    "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -h localhost -p 5432 -U frigo_user -d frigorifico -F p -f "%BACKUP_DIR%\database.sql" >nul 2>&1
    if exist "%BACKUP_DIR%\database.sql" (
        echo [OK] Database.sql exportado
    ) else (
        echo [WARN] No se pudo exportar la base de datos
    )
) else (
    echo [WARN] PostgreSQL no encontrado, intentando con npx...
    npx prisma migrate dump >nul 2>&1
)

echo [4/4] Creando archivo info...
echo Backup TrazaSole > "%BACKUP_DIR%\info.txt"
echo Fecha: %FECHA% >> "%BACKUP_DIR%\info.txt"
echo Hora: %HORA% >> "%BACKUP_DIR%\info.txt"
echo Version: 3.7.32 >> "%BACKUP_DIR%\info.txt"
echo Tipo: Backup completo batt >> "%BACKUP_DIR%\info.txt"

echo.
echo [OK] Backup creado: %BACKUP_DIR%

echo.
echo [INFO] Limpiando backups antiguos (manteniendo ultimos 50)...
set COUNT=0
for /f %%a in ('dir /b /o-d "backups\batt\backup_*" 2^>NUL ^| find /c /v ""') do set COUNT=%%a
if %COUNT% GTR 50 (
    echo [INFO] Eliminando %COUNT% backups, manteniendo ultimos 50...
    for /f "skip=50 delims=" %%d in ('dir /b /o-d "backups\batt\backup_*" 2^>NUL') do (
        rmdir /s /q "backups\batt\%%d" 2>nul
    )
    echo [OK] Backups antiguos eliminados
) else (
    echo [INFO] Backups actuales: %COUNT% (dentro del limite)
)

echo.
echo ========================================
echo  BACKUP COMPLETADO
echo ========================================
echo.
pause