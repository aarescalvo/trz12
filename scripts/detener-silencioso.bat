@echo off
REM ============================================
REM TRAZASOLE v3.7.24 - DETENER SERVIDOR SILENCIOSO
REM Para usar con Programador de Tareas de Windows
REM ============================================

REM Matar procesos bun
taskkill /F /IM bun.exe >NUL 2>&1

REM Matar procesos node
taskkill /F /IM node.exe >NUL 2>&1

REM Registrar en log
cd /d "%~dp0.."
echo [%date% %time%] Servidor detenido (silencioso) >> logs\servidor.log 2>NUL

exit 0
