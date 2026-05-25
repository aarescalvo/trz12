@echo off
chcp 65001 >nul
setlocal
title TrazaSole - Actualizar GitHub
cd /d "%~dp0.."

echo.
echo ========================================
echo  TRAZASOLE - ACTUALIZAR DESDE GITHUB
echo ========================================
echo.

echo Selecciona repositorio:
echo  [1] Desarrollo
echo  [2] Produccion
echo.
set /p REP="Opcion: "

if "%REP%"=="1" set REMOTO=desarrollo
if "%REP%"=="2" set REMOTO=produccion

if not defined REMOTO (
    echo [ERROR] Opcion invalida
    pause
    exit /b 1
)

echo.
echo [1/4] Deteniendo servidor...
taskkill /F /IM bun.exe >nul 2>&1

echo [2/4] Obteniendo cambios desde %REMOTO%...
git fetch %REMOTO%
git reset --hard %REMOTO%/main

echo [3/4] Limpiando cache...
if exist ".next" rmdir /s /q ".next" 2>nul

echo [4/4] Instalando dependencias...
bun install

echo.
echo [OK] Sistema actualizado
echo.
pause