@echo off
title TrazaSole - Servidor
echo ========================================
echo   TRAZASOLE - Iniciando Servidor
echo ========================================
echo.
echo Servidor: http://localhost:3000
echo.
echo Presiona Ctrl+C para detener
echo ========================================
echo.
cd /d "%~dp0"
bun run dev
