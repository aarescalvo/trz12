@echo off
chcp 65001 >nul
title TrazaSole - Actualizar Sistema
cd /d "%~dp0.."
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║       TRAZASOLE v3.7.24 - ACTUALIZAR SISTEMA           ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Verificar que git está disponible
where git >NUL 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git no esta instalado o no esta en el PATH.
    pause
    exit /b 1
)

echo [INFO] Verificando conexion a GitHub...
echo.

REM Verificar remotos
git remote -v | findstr "produccion" >NUL
if %ERRORLEVEL% neq 0 (
    echo [ERROR] El remote 'produccion' no esta configurado.
    echo [INFO] Ejecuta: git remote add produccion https://github.com/aarescalvo/produccion1.git
    pause
    exit /b 1
)

echo [PASO 1/4] Deteniendo servidor...
taskkill /F /IM bun.exe >NUL 2>&1
taskkill /F /IM node.exe >NUL 2>&1
timeout /t 2 /nobreak >NUL

echo [PASO 2/4] Creando backup de seguridad...
call scripts\backup-base-datos.bat

echo.
echo [PASO 3/4] Descargando actualizaciones desde GitHub...
echo.
git fetch produccion
git reset --hard produccion/main

if %ERRORLEVEL% neq 0 (
    echo [ERROR] No se pudieron descargar las actualizaciones.
    pause
    exit /b 1
)

echo.
echo [PASO 4/4] Instalando dependencias y sincronizando BD...
echo.
bun install
bun run db:push

echo.
echo ════════════════════════════════════════════════════════════
echo [LISTO] Sistema actualizado correctamente!
echo ════════════════════════════════════════════════════════════
echo.
echo [INFO] Ejecuta 'iniciar-servidor.bat' para iniciar el sistema.
echo.
pause
