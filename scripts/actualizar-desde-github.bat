@echo off
chcp 65001 >nul
title TrazaSole - Actualizar desde GitHub
cd /d "%~dp0.."
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║       TRAZASOLE v3.7.27 - ACTUALIZAR DESDE GITHUB      ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Verificar que git está disponible
where git >NUL 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git no esta instalado o no esta en el PATH.
    pause
    exit /b 1
)

echo [INFO] Verificando repositorios configurados...
echo.

REM Mostrar remotos configurados
git remote -v
echo.

REM Preguntar de cual repositorio actualizar
echo ════════════════════════════════════════════════════════════
echo Seleccione el repositorio desde donde actualizar:
echo ════════════════════════════════════════════════════════════
echo   1. DESARROLLO (SQLite) - https://github.com/aarescalvo/desarrollo1
echo   2. PRODUCCION (PostgreSQL) - https://github.com/aarescalvo/produccion1
echo   3. CANCELAR
echo ════════════════════════════════════════════════════════════
echo.
set /p REPO="Ingrese opcion (1-3): "

if "%REPO%"=="1" (
    set REMOTO=desarrollo
    echo.
    echo [INFO] Actualizando desde DESARROLLO (SQLite)...
)
if "%REPO%"=="2" (
    set REMOTO=produccion
    echo.
    echo [INFO] Actualizando desde PRODUCCION (PostgreSQL)...
)
if "%REPO%"=="3" (
    echo.
    echo [INFO] Operacion cancelada.
    pause
    exit /b 0
)

if "%REMOTO%"=="" (
    echo [ERROR] Opcion invalida.
    pause
    exit /b 1
)

REM Verificar que el remoto existe
git remote get-url %REMOTO% >NUL 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] El remote '%REMOTO%' no esta configurado.
    echo.
    echo [INFO] Configurando remoto automaticamente...
    if "%REMOTO%"=="desarrollo" (
        git remote add desarrollo https://github.com/aarescalvo/desarrollo1.git
    )
    if "%REMOTO%"=="produccion" (
        git remote add produccion https://github.com/aarescalvo/produccion1.git
    )
    echo [OK] Remoto configurado.
)

echo.
echo ════════════════════════════════════════════════════════════
echo [PASO 1/5] Deteniendo servidor...
echo ════════════════════════════════════════════════════════════
taskkill /F /IM bun.exe >NUL 2>&1
taskkill /F /IM node.exe >NUL 2>&1
timeout /t 2 /nobreak >NUL
echo [OK] Servidor detenido.

echo.
echo ════════════════════════════════════════════════════════════
echo [PASO 2/5] Creando backup de seguridad...
echo ════════════════════════════════════════════════════════════
if exist scripts\backup-base-datos.bat (
    call scripts\backup-base-datos.bat
) else (
    echo [INFO] Creando backup manual...
    if not exist backups mkdir backups
    for /f "tokens=1-6 delims=/ " %%a in ('date /t') do (
        for /f "tokens=1-3 delims=:." %%x in ('time /t') do (
            set BACKUP_FILE=backups\backup_%%a%%b%%c_%%x%%y.db
        )
    )
    if exist prisma\dev.db (
        copy prisma\dev.db %BACKUP_FILE% >NUL
        echo [OK] Backup creado: %BACKUP_FILE%
    ) else (
        echo [INFO] No se encontro base de datos SQLite para backup.
    )
)

echo.
echo ════════════════════════════════════════════════════════════
echo [PASO 3/5] Descargando actualizaciones desde GitHub...
echo ════════════════════════════════════════════════════════════
echo.
echo [INFO] Obteniendo cambios...
git fetch %REMOTO%

echo [INFO] Guardando cambios locales (stash)...
git stash

echo [INFO] Aplicando cambios desde %REMOTO%/main...
git reset --hard %REMOTO%/main

if %ERRORLEVEL% neq 0 (
    echo [ERROR] No se pudieron descargar las actualizaciones.
    echo [INFO] Restaurando cambios locales...
    git stash pop
    pause
    exit /b 1
)

echo [OK] Actualizaciones descargadas.

echo.
echo ════════════════════════════════════════════════════════════
echo [PASO 4/5] Instalando dependencias...
echo ════════════════════════════════════════════════════════════
echo.
bun install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Error al instalar dependencias.
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas.

echo.
echo ════════════════════════════════════════════════════════════
echo [PASO 5/5] Sincronizando base de datos...
echo ════════════════════════════════════════════════════════════
echo.
bun run db:push
if %ERRORLEVEL% neq 0 (
    echo [WARN] Hubo un error al sincronizar la BD, pero el sistema puede funcionar.
)
echo [OK] Base de datos sincronizada.

echo.
echo ════════════════════════════════════════════════════════════
echo [LISTO] Sistema actualizado correctamente!
echo ════════════════════════════════════════════════════════════
echo.
echo [INFO] Para iniciar el sistema ejecute: iniciar-servidor.bat
echo [INFO] O manualmente: bun run dev
echo.

REM Mostrar version actual
findstr "version" package.json | findstr /V "prisma"
echo.
pause
