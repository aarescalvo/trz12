@echo off
chcp 65001 >nul
setlocal
title TrazaSole - Menu
cd /d "%~dp0.."

:menu
cls
echo.
echo ========================================
echo  TRAZASOLE v3.7.32 - MENU PRINCIPAL
echo ========================================
echo.
echo  [1] Iniciar Servidor
echo  [2] Iniciar Segundo Plano
echo  [3] Detener Servidor
echo  [4] Crear Backup
echo  [5] Restaurar Backup
echo  [6] Listar Backups
echo  [7] Verificar Estado
echo  [8] Salir
echo.
echo ========================================

set /p OPCION="Selecciona opcion: "

if "%OPCION%"=="1" call "%~dp0iniciar-servidor.bat"
if "%OPCION%"=="2" call "%~dp0iniciar-segundo-plano.bat"
if "%OPCION%"=="3" call "%~dp0detener-servidor.bat"
if "%OPCION%"=="4" call "%~dp0backup-todo.bat"
if "%OPCION%"=="5" call "%~dp0restaurar-backup.bat"
if "%OPCION%"=="6" call "%~dp0listar-backups.bat"
if "%OPCION%"=="7" call "%~dp0verificar-estado.bat"
if "%OPCION%"=="8" exit

goto menu