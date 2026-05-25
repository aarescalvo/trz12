@echo off
title TrazaSole - Detener Segundo Plano
echo ========================================
echo   TRAZASOLE - Detener Segundo Plano
echo ========================================
echo.

taskkill /F /IM bun.exe 2>nul
taskkill /F /IM node.exe 2>nul

if exist servidor.log del servidor.log

echo Servidor detenido.
echo.
pause
