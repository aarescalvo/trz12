@echo off
chcp 65001 >nul
title TrazaSole - Servidor
cd /d "%~dp0.."

echo.
echo ========================================
echo  TRAZASOLE v3.7.32 - INICIAR SERVIDOR
echo ========================================
echo.

echo [INFO] Verificando Node.js...
node --version
echo.

echo [INFO] Iniciando servidor...
echo.
echo IMPORTANTE: Mantener esta ventana ABIERTA mientras uses el sistema
echo.
echo ========================================
echo.

node node_modules/next/dist/bin/next dev -p 3000

echo.
echo ========================================
echo  Servidor detenido. Presiona una tecla para salir.
echo ========================================
pause >nul