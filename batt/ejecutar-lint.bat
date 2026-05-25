@echo off
chcp 65001 >nul
setlocal
title TrazaSole - Lint
cd /d "%~dp0.."

echo.
echo ========================================
echo  TRAZASOLE - VERIFICAR LINT
echo ========================================
echo.

echo [INFO] Ejecutando ESLint...
echo.

npm run lint

echo.
echo ========================================
echo  VERIFICACION COMPLETADA
echo ========================================
echo.
pause