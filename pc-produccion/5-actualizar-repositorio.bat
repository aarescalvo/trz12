@echo off
title TrazaSole - Actualizar Repositorio
cd /d "%~dp0.."
echo ========================================
echo   TRAZASOLE - Actualizar Repositorio
echo ========================================
echo.

git remote -v | findstr "produccion1" >nul
if %errorlevel% equ 0 (
    set REMOTE=produccion
    echo [INFO] Repositorio: PRODUCCION
) else (
    set REMOTE=origin
    echo [INFO] Repositorio: DESARROLLO
)

echo.
git fetch %REMOTE%
git pull %REMOTE% master

if %errorlevel% neq 0 (
    echo [ERROR] No se pudo actualizar
    pause
    exit /b 1
)

echo.
echo Repositorio actualizado.
echo.
pause
