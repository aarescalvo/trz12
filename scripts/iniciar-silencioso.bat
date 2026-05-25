@echo off
REM ============================================
REM TRAZASOLE v3.7.24 - INICIAR SERVIDOR SILENCIOSO
REM Para usar con Programador de Tareas de Windows
REM ============================================

cd /d "%~dp0.."

REM Matar procesos existentes primero
taskkill /F /IM bun.exe >NUL 2>&1
taskkill /F /IM node.exe >NUL 2>&1

REM Esperar 2 segundos
timeout /t 2 /nobreak >NUL

REM Iniciar servidor en segundo plano
start /B bun run dev >nul 2>&1

REM Registrar en log
echo [%date% %time%] Servidor iniciado (silencioso) >> logs\servidor.log 2>NUL

exit 0
