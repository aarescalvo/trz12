@echo off
title TrazaSole - Iniciar Servidor
cd /d "%~dp0.."
echo ========================================
echo   TRAZASOLE - Iniciando Servidor
echo ========================================
echo.
echo Puerto: 3000
echo Presiona Ctrl+C para detener
echo.
bun run dev
