@echo off
chcp 65001 >nul
title TrazaSole - Reiniciar y Actualizar
cd /d "%~dp0.."
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║    TRAZASOLE v3.7.24 - REINICIAR Y ACTUALIZAR          ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo Este script realizara las siguientes acciones:
echo.
echo  1. Detener el servidor actual
echo  2. Crear backup de la base de datos
echo  3. Descargar actualizaciones desde GitHub
echo  4. Instalar dependencias
echo  5. Sincronizar base de datos
echo  6. Iniciar el servidor
echo.
set /p CONFIRMAR="Continuar? (S/N): "
if /i not "%CONFIRMAR%"=="S" (
    echo.
    echo [CANCELADO] Operacion cancelada.
    pause
    exit /b 0
)

REM 1. Detener servidor
cls
echo.
echo [1/6] Deteniendo servidor...
taskkill /F /IM bun.exe >NUL 2>&1
taskkill /F /IM node.exe >NUL 2>&1
timeout /t 2 /nobreak >NUL
echo [OK] Servidor detenido.

REM 2. Backup
echo.
echo [2/6] Creando backup de base de datos...
if exist "backups\base-datos" mkdir "backups\base-datos"
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "datetime=%%a"
set "FECHA=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%"
set "HORA=%datetime:~8,2%-%datetime:~10,2%"
set "BACKUP_FILE=backups\base-datos\backup_%FECHA%_%HORA%.sql"
set "PGHOST=localhost"
set "PGPORT=5432"
set "PGUSER=frigo_user"
set "PGDATABASE=frigorifico"
set PGPASSWORD=1810
"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -F p -f "%BACKUP_FILE%" 2>NUL
echo [OK] Backup creado.

REM 3. Actualizar
echo.
echo [3/6] Descargando actualizaciones...
git fetch produccion
git reset --hard produccion/main
echo [OK] Actualizaciones descargadas.

REM 4. Dependencias
echo.
echo [4/6] Instalando dependencias...
bun install >NUL 2>&1
echo [OK] Dependencias instaladas.

REM 5. DB Push
echo.
echo [5/6] Sincronizando base de datos...
bun run db:push >NUL 2>&1
echo [OK] Base de datos sincronizada.

REM 6. Iniciar
echo.
echo [6/6] Iniciando servidor...
start "" cmd /c "bun run dev"
timeout /t 3 /nobreak >NUL

echo.
echo ════════════════════════════════════════════════════════════
echo [LISTO] Sistema actualizado e iniciado!
echo ════════════════════════════════════════════════════════════
echo.
echo Accede al sistema en: http://localhost:3000
echo.
pause
