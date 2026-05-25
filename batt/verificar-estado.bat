@echo off
setlocal
title TrazaSole - Estado

echo.
echo ========================================
echo  TRAZASOLE - ESTADO DEL SERVIDOR
echo ========================================
echo.

echo Proceso bun.exe:
tasklist /FI "IMAGENAME eq bun.exe" 2>NUL | find /I "bun.exe" >NUL
if %ERRORLEVEL% equ 0 (
    echo   [ACTIVO] Ejecutandose
) else (
    echo   [INACTIVO] No ejecuta
)

echo.
echo Proceso node.exe:
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I "node.exe" >NUL
if %ERRORLEVEL% equ 0 (
    echo   [ACTIVO] Ejecutandose
) else (
    echo   [INACTIVO] No ejecuta
)

echo.
echo Puerto 3000:
netstat -ano 2>NUL | find " :3000 " >NUL
if %ERRORLEVEL% equ 0 (
    echo   [EN USO] Ocupado
) else (
    echo   [LIBRE] Disponible
)

echo.
echo PostgreSQL:
netstat -ano 2>NUL | find " :5432 " >NUL
if %ERRORLEVEL% equ 0 (
    echo   [ACTIVO] Corriendo en puerto 5432
) else (
    echo   [INACTIVO] No detectado
)

echo.
echo ========================================
pause