@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title TrazaSole - Restaurar Backup
cd /d "%~dp0.."

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║       TRAZASOLE v3.7.24 - RESTAURAR BACKUP             ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Menu de seleccion
echo Selecciona el tipo de backup a restaurar:
echo.
echo  [1] Base de Datos (SQL)
echo  [2] Sistema Completo (archivos + base de datos)
echo  [3] Salir
echo.
set /p OPCION="Ingresa el numero de opcion: "

if "%OPCION%"=="1" goto RESTAURAR_DB
if "%OPCION%"=="2" goto RESTAURAR_SISTEMA
if "%OPCION%"=="3" goto FIN
echo.
echo [ERROR] Opcion invalida.
pause
exit /b 1

:RESTAURAR_DB
cls
echo.
echo ════════════════════════════════════════════════════════════
echo RESTAURAR BASE DE DATOS
echo ════════════════════════════════════════════════════════════
echo.

if not exist "backups\base-datos" (
    echo [ERROR] No existe la carpeta backups\base-datos
    pause
    exit /b 1
)

echo Backups disponibles (ordenados por fecha, mas recientes primero):
echo.
echo ────────────────────────────────────────────────────────────

set COUNT=0
for /f "delims=" %%f in ('dir /b /o-d "backups\base-datos\backup_*.sql" 2^>NUL') do (
    set /a COUNT+=1
    set "FILE_!COUNT!=%%f"
    echo [!COUNT!] %%f
)

if %COUNT%==0 (
    echo [ERROR] No hay backups de base de datos disponibles.
    pause
    exit /b 1
)

echo ────────────────────────────────────────────────────────────
echo.
echo Total de backups: %COUNT%
echo.
set /p SELECCION="Ingresa el numero del backup a restaurar (o 0 para cancelar): "

if "%SELECCION%"=="0" goto FIN
if %SELECCION% LSS 1 (
    echo [ERROR] Seleccion invalida.
    pause
    exit /b 1
)
if %SELECCION% GTR %COUNT% (
    echo [ERROR] Seleccion invalida.
    pause
    exit /b 1
)

set "BACKUP_FILE=!FILE_%SELECCION%!"
set "BACKUP_PATH=backups\base-datos\%BACKUP_FILE%"

echo.
echo [ADVERTENCIA] Esto ELIMINARA la base de datos actual y la reemplazara con:
echo %BACKUP_FILE%
echo.
set /p CONFIRMAR="Estas seguro? (S/N): "
if /i not "%CONFIRMAR%"=="S" (
    echo [CANCELADO] Operacion cancelada por el usuario.
    pause
    goto FIN
)

echo.
echo [INFO] Restaurando base de datos...
echo.

REM Configuracion PostgreSQL
set "PGHOST=localhost"
set "PGPORT=5432"
set "PGUSER=frigo_user"
set "PGDATABASE=frigorifico"
set PGPASSWORD=1810

REM Restaurar
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -f "%BACKUP_PATH%" 2>NUL

if %ERRORLEVEL%==0 (
    echo.
    echo ════════════════════════════════════════════════════════════
    echo [OK] Base de datos restaurada correctamente!
    echo ════════════════════════════════════════════════════════════
) else (
    echo.
    echo [ERROR] Hubo un problema al restaurar la base de datos.
    echo [INFO] Verifica que PostgreSQL este corriendo.
)
echo.
pause
goto FIN

:RESTAURAR_SISTEMA
cls
echo.
echo ════════════════════════════════════════════════════════════
echo RESTAURAR SISTEMA COMPLETO
echo ════════════════════════════════════════════════════════════
echo.

if not exist "backups\sistema" (
    echo [ERROR] No existe la carpeta backups\sistema
    pause
    exit /b 1
)

echo Backups disponibles (ordenados por fecha, mas recientes primero):
echo.
echo ────────────────────────────────────────────────────────────

set COUNT=0
for /f "delims=" %%d in ('dir /b /o-d "backups\sistema\backup_sistema_*" 2^>NUL') do (
    set /a COUNT+=1
    set "DIR_!COUNT!=%%d"
    echo [!COUNT!] %%d
)

if %COUNT%==0 (
    echo [ERROR] No hay backups de sistema disponibles.
    pause
    exit /b 1
)

echo ────────────────────────────────────────────────────────────
echo.
echo Total de backups: %COUNT%
echo.
set /p SELECCION="Ingresa el numero del backup a restaurar (o 0 para cancelar): "

if "%SELECCION%"=="0" goto FIN
if %SELECCION% LSS 1 (
    echo [ERROR] Seleccion invalida.
    pause
    exit /b 1
)
if %SELECCION% GTR %COUNT% (
    echo [ERROR] Seleccion invalida.
    pause
    exit /b 1
)

set "BACKUP_DIR=!DIR_%SELECCION%!"
set "BACKUP_PATH=backups\sistema\%BACKUP_DIR%"

echo.
echo [ADVERTENCIA] Esto reemplazara archivos del sistema con:
echo %BACKUP_DIR%
echo.
echo El backup incluye:
echo - Codigo fuente (src/)
echo - Esquemas Prisma (prisma/)
echo - Scripts
echo - Configuracion (.env, package.json)
echo - Base de datos (SQL)
echo.
set /p CONFIRMAR="Estas seguro? (S/N): "
if /i not "%CONFIRMAR%"=="S" (
    echo [CANCELADO] Operacion cancelada por el usuario.
    pause
    goto FIN
)

echo.
echo [PASO 1/4] Deteniendo servidor...
taskkill /F /IM bun.exe >NUL 2>&1
taskkill /F /IM node.exe >NUL 2>&1
timeout /t 2 /nobreak >NUL

echo [PASO 2/4] Restaurando archivos...
if exist "%BACKUP_PATH%\archivos\src" (
    rmdir /s /q "src" 2>NUL
    xcopy "%BACKUP_PATH%\archivos\src" "src" /E /I /Q /Y >NUL
)
if exist "%BACKUP_PATH%\archivos\prisma" (
    xcopy "%BACKUP_PATH%\archivos\prisma" "prisma" /E /I /Q /Y >NUL
)
if exist "%BACKUP_PATH%\archivos\scripts" (
    xcopy "%BACKUP_PATH%\archivos\scripts" "scripts" /E /I /Q /Y >NUL
)
if exist "%BACKUP_PATH%\archivos\package.json" (
    copy "%BACKUP_PATH%\archivos\package.json" "." >NUL
)
if exist "%BACKUP_PATH%\archivos\.env" (
    copy "%BACKUP_PATH%\archivos\.env" "." >NUL
)

echo [PASO 3/4] Instalando dependencias...
bun install >NUL 2>&1

echo [PASO 4/4] Sincronizando base de datos...
if exist "%BACKUP_PATH%\base-datos\*.sql" (
    for %%f in ("%BACKUP_PATH%\base-datos\*.sql") do (
        set "PGHOST=localhost"
        set "PGPORT=5432"
        set "PGUSER=frigo_user"
        set "PGDATABASE=frigorifico"
        set PGPASSWORD=1810
        "C:\Program Files\PostgreSQL\16\bin\psql.exe" -h !PGHOST! -p !PGPORT! -U !PGUSER! -d !PGDATABASE! -f "%%f" 2>NUL
    )
)

bun run db:push >NUL 2>&1

echo.
echo ════════════════════════════════════════════════════════════
echo [OK] Sistema restaurado correctamente!
echo ════════════════════════════════════════════════════════════
echo.
echo [INFO] Ejecuta 'iniciar-servidor.bat' para iniciar el sistema.
echo.
pause

:FIN
exit 0
