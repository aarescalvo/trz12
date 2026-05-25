@echo off
REM ============================================
REM Restaurar Backup - TrazaSole
REM Sistema de trazabilidad frigorifica
REM ============================================

setlocal enabledelayedexpansion

set PROJECT_DIR=C:\TrazaSole
set BACKUP_DIR=C:\TrazaSole\backups
set DB_NAME=frigorifico
set DB_USER=frigo_user
set DB_PASS=1810
set PSQL="C:\Program Files\PostgreSQL\16\bin\psql.exe"

echo.
echo ============================================
echo   RESTAURAR BACKUP TRAZASOLE
echo ============================================
echo.

REM Listar backups disponibles
echo Backups disponibles:
echo --------------------
set count=0
for /f "delims=" %%f in ('dir /B /O-D "%BACKUP_DIR%\*.sql"') do (
    set /a count+=1
    echo !count!. %%~nf
    if !count! EQU 10 goto :gotlist
)
:gotlist

if %count% EQU 0 (
    echo No hay backups disponibles.
    pause
    exit /b 1
)

echo.
set /p SELECCION="Seleccione el numero del backup a restaurar: "

REM Obtener el archivo seleccionado
set current=0
for /f "delims=" %%f in ('dir /B /O-D "%BACKUP_DIR%\*.sql"') do (
    set /a current+=1
    if !current! EQU %SELECCION% (
        set SQL_FILE=%BACKUP_DIR%\%%f
        set VERSION=%%~nf
        goto :found
    )
)

:found
if not defined SQL_FILE (
    echo Seleccion invalida.
    pause
    exit /b 1
)

echo.
echo Se restaurara el backup: %VERSION%
echo.
set /p CONFIRM="Esta seguro? (S/N): "
if /i not "%CONFIRM%"=="S" (
    echo Operacion cancelada.
    pause
    exit /b 0
)

echo.
echo Restaurando...
echo.

REM Restaurar base de datos
echo [1/3] Restaurando base de datos...
set PGPASSWORD=%DB_PASS%
%PSQL% -h localhost -U %DB_USER% -d %DB_NAME% -f "%SQL_FILE%" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo       Base de datos: OK
) else (
    echo       Base de datos: ERROR
)

REM Restaurar .env
echo [2/3] Restaurando configuracion...
if exist "%BACKUP_DIR%\env_%VERSION%" (
    copy "%BACKUP_DIR%\env_%VERSION%" "%PROJECT_DIR%\.env" >nul
    echo       Archivo .env: OK
)

REM Preguntar si restaurar codigo
echo.
set /p RESTORE_CODE="Restaurar codigo fuente? (S/N): "
if /i "%RESTORE_CODE%"=="S" (
    echo [3/3] Restaurando codigo fuente...
    set CODE_BACKUP=%BACKUP_DIR%\codigo_%VERSION%
    if exist "!CODE_BACKUP!" (
        xcopy "!CODE_BACKUP!\src" "%PROJECT_DIR%\src\" /E /I /Q >nul
        xcopy "!CODE_BACKUP!\prisma" "%PROJECT_DIR%\prisma\" /E /I /Q >nul
        xcopy "!CODE_BACKUP!\public" "%PROJECT_DIR%\public\" /E /I /Q >nul
        if exist "!CODE_BACKUP!\scripts" xcopy "!CODE_BACKUP!\scripts" "%PROJECT_DIR%\scripts\" /E /I /Q >nul
        copy "!CODE_BACKUP!\package.json" "%PROJECT_DIR%\" >nul
        echo       Codigo fuente: OK
    )
)

echo.
echo ============================================
echo   RESTAURACION COMPLETADA
echo ============================================
echo.
echo Se recomienda ejecutar:
echo   bun run db:push
echo   bun run dev
echo.
pause
