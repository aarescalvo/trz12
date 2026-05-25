@echo off
chcp 65001 >nul
title TrazaSole - Menu Principal
cd /d "%~dp0.."

:MENU
cls
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║       ████████╗██████╗  █████╗  ██████╗██╗  ██╗              ║
echo ║       ╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝              ║
echo ║          ██║   ██████╔╝███████║██║     █████╔╝               ║
echo ║          ██║   ██╔══██╗██╔══██║██║     ██╔═██╗               ║
echo ║          ██║   ██║  ██║██║  ██║╚██████╗██║  ██╗              ║
echo ║          ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝              ║
echo ║                                                              ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║                     v3.7.24 - Menu Principal                 ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo ════════════════════════════════════════════════════════════════
echo  SERVIDOR
echo ════════════════════════════════════════════════════════════════
echo.
echo   [1] Iniciar Servidor
echo   [2] Detener Servidor
echo   [3] Reiniciar y Actualizar (detener + actualizar + iniciar)
echo.
echo ════════════════════════════════════════════════════════════════
echo  BACKUPS
echo ════════════════════════════════════════════════════════════════
echo.
echo   [4] Backup Base de Datos
echo   [5] Backup Sistema Completo
echo   [6] Restaurar Backup
echo   [7] Listar Backups
echo.
echo ════════════════════════════════════════════════════════════════
echo  ACTUALIZACIONES
echo ════════════════════════════════════════════════════════════════
echo.
echo   [8] Actualizar desde GitHub
echo   [9] Ver Version Actual
echo.
echo ════════════════════════════════════════════════════════════════
echo.
echo   [0] Salir
echo.
echo ════════════════════════════════════════════════════════════════
echo.
set /p OPCION="Selecciona una opcion: "

if "%OPCION%"=="1" goto OPCION1
if "%OPCION%"=="2" goto OPCION2
if "%OPCION%"=="3" goto OPCION3
if "%OPCION%"=="4" goto OPCION4
if "%OPCION%"=="5" goto OPCION5
if "%OPCION%"=="6" goto OPCION6
if "%OPCION%"=="7" goto OPCION7
if "%OPCION%"=="8" goto OPCION8
if "%OPCION%"=="9" goto OPCION9
if "%OPCION%"=="0" goto SALIR
echo.
echo [ERROR] Opcion invalida. Presiona una tecla para continuar...
pause >NUL
goto MENU

:OPCION1
call scripts\iniciar-servidor.bat
goto MENU

:OPCION2
call scripts\detener-servidor.bat
goto MENU

:OPCION3
call scripts\reiniciar-actualizado.bat
goto MENU

:OPCION4
call scripts\backup-base-datos.bat
goto MENU

:OPCION5
call scripts\backup-sistema.bat
goto MENU

:OPCION6
call scripts\restaurar-backup.bat
goto MENU

:OPCION7
call scripts\listar-backups.bat
goto MENU

:OPCION8
call scripts\actualizar-sistema.bat
goto MENU

:OPCION9
cls
echo.
echo ════════════════════════════════════════════════════════════
echo VERSION DEL SISTEMA
echo ════════════════════════════════════════════════════════════
echo.
type package.json 2>NUL | findstr "version"
echo.
echo Base de datos: PostgreSQL
echo Repositorio: https://github.com/aarescalvo/produccion1
echo.
pause
goto MENU

:SALIR
cls
echo.
echo Gracias por usar TrazaSole.
echo.
exit 0
