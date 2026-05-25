@echo off
title TrazaSole - Detener, Actualizar e Iniciar
cd /d "%~dp0.."
echo ========================================
echo   TRAZASOLE - Reinicio Completo
echo ========================================
echo.

echo [1/4] Deteniendo servidor...
taskkill /F /IM bun.exe 2>nul
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/4] Actualizando repositorio...
git remote -v | findstr "produccion1" >nul
if %errorlevel% equ 0 (
    set REMOTE=produccion
    echo [INFO] Repositorio: PRODUCCION
) else (
    set REMOTE=origin
    echo [INFO] Repositorio: DESARROLLO
)

git fetch %REMOTE%
git pull %REMOTE% master

if %errorlevel% neq 0 (
    echo [ERROR] No se pudo actualizar
    pause
    exit /b 1
)

echo [3/4] Sincronizando base de datos...
bun run db:push

echo.
echo [4/4] Iniciando servidor...
echo Presiona Ctrl+C para detener
echo.
bun run dev
