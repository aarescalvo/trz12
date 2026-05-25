@echo off
REM ============================================
REM Backup por Versiones - TrazaSole
REM Sistema de trazabilidad frigorifica
REM ============================================

setlocal enabledelayedexpansion

REM Configuracion
set PROJECT_DIR=C:\TrazaSole
set BACKUP_DIR=C:\TrazaSole\backups
set DB_NAME=frigorifico
set DB_USER=frigo_user
set DB_PASS=1810
set PG_DUMP="C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"

REM Obtener fecha y hora
for /f "tokens=1-3 delims=/" %%a in ('date /t') do set FECHA=%%c%%a%%b
for /f "tokens=1-2 delims=:" %%a in ('time /t') do set HORA=%%a%%b
set VERSION=%FECHA%_%HORA%

REM Crear directorio de backup si no existe
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo.
echo ============================================
echo   BACKUP TRAZASOLE - Version %VERSION%
echo ============================================
echo.

REM 1. Backup de la base de datos PostgreSQL
echo [1/4] Creando backup de base de datos...
set SQL_FILE=%BACKUP_DIR%\db_backup_%VERSION%.sql
set PGPASSWORD=%DB_PASS%
%PG_DUMP% -h localhost -U %DB_USER% -d %DB_NAME% -F p -f "%SQL_FILE%" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo       Base de datos: OK
) else (
    echo       Base de datos: ERROR - Verificar PostgreSQL
)

REM 2. Backup del archivo .env
echo [2/4] Copiando configuracion...
if exist "%PROJECT_DIR%\.env" (
    copy "%PROJECT_DIR%\.env" "%BACKUP_DIR%\env_%VERSION%" >nul
    echo       Archivo .env: OK
) else (
    echo       Archivo .env: NO ENCONTRADO
)

REM 3. Backup del codigo fuente (sin node_modules)
echo [3/4] Copiando codigo fuente...
set CODE_BACKUP=%BACKUP_DIR%\codigo_%VERSION%
if not exist "%CODE_BACKUP%" mkdir "%CODE_BACKUP%"

xcopy "%PROJECT_DIR%\src" "%CODE_BACKUP%\src\" /E /I /Q >nul
xcopy "%PROJECT_DIR%\prisma" "%CODE_BACKUP%\prisma\" /E /I /Q >nul
xcopy "%PROJECT_DIR%\public" "%CODE_BACKUP%\public\" /E /I /Q >nul
xcopy "%PROJECT_DIR%\scripts" "%CODE_BACKUP%\scripts\" /E /I /Q >nul
copy "%PROJECT_DIR%\package.json" "%CODE_BACKUP%\" >nul
copy "%PROJECT_DIR%\tsconfig.json" "%CODE_BACKUP%\" >nul
copy "%PROJECT_DIR%\next.config.ts" "%CODE_BACKUP%\" >nul
echo       Codigo fuente: OK

REM 4. Crear archivo de info
echo [4/4] Creando archivo de informacion...
echo Backup TrazaSole > "%BACKUP_DIR%\info_%VERSION%.txt"
echo Fecha: %DATE% %TIME% >> "%BACKUP_DIR%\info_%VERSION%.txt"
echo Version: %VERSION% >> "%BACKUP_DIR%\info_%VERSION%.txt"
echo Base de datos: %DB_NAME% >> "%BACKUP_DIR%\info_%VERSION%.txt"
echo. >> "%BACKUP_DIR%\info_%VERSION%.txt"
echo Archivos creados: >> "%BACKUP_DIR%\info_%VERSION%.txt"
dir /B "%BACKUP_DIR%\*%VERSION%*" >> "%BACKUP_DIR%\info_%VERSION%.txt"

echo.
echo ============================================
echo   BACKUP COMPLETADO
echo ============================================
echo.
echo Archivos guardados en: %BACKUP_DIR%
echo.

REM Listar ultimos backups
echo Ultimos backups realizados:
echo ----------------------------
dir /B /O-D "%BACKUP_DIR%\*.sql" 2>nul | findstr /N "^" | findstr "^[1-5]:"
echo.

REM Limpiar backups antiguos (mantener ultimos 10)
echo Limpiando backups antiguos (manteniendo ultimos 10)...
for /f "skip=10 delims=" %%f in ('dir /B /O-D "%BACKUP_DIR%\*.sql"') do (
    del "%BACKUP_DIR%\%%f" 2>nul
    for /f "tokens=1-3 delims=." %%a in ("%%f") do (
        del "%BACKUP_DIR%\env_%%c" 2>nul
        rmdir /S /Q "%BACKUP_DIR%\codigo_%%c" 2>nul
        del "%BACKUP_DIR%\info_%%c" 2>nul
    )
)

echo Listo!
pause
