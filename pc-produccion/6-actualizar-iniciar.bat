@echo off
title TrazaSole - Actualizar e Iniciar
cd /d "%~dp0.."
echo ========================================
echo   TRAZASOLE - Actualizar e Iniciar
echo ========================================
echo.

echo [1/2] Actualizando repositorio...
git remote -v | findstr "produccion1" >nul
if %errorlevel% equ 0 (
    set REMOTE=produccion
) else (
    set REMOTE=origin
)

git fetch %REMOTE%
git pull %REMOTE% master

if %errorlevel% neq 0 (
    echo [ERROR] No se pudo actualizar
    pause
    exit /b 1
)

echo [OK] Repositorio actualizado
echo.
echo [2/2] Iniciando servidor...
echo Presiona Ctrl+C para detener
echo.
bun run dev
