@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title TrazaSole - Backup Base de Datos
color 0B

:: Configuración
set "INSTALL_DIR=%~dp0.."
set "BACKUP_DIR=%INSTALL_DIR%\backups\database"
set "MAX_BACKUPS=50"

echo.
echo ════════════════════════════════════════════════════════════════
echo   TRAZASOLE - Backup de Base de Datos
echo ════════════════════════════════════════════════════════════════
echo.

cd /d "%INSTALL_DIR%"

:: Crear carpeta de backups si no existe
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: Obtener versión del package.json
set VERSION=unknown
if exist "package.json" (
    for /f "tokens=2 delims=:, " %%a in ('findstr /c:"\"version\"" package.json 2^>nul') do (
        set VERSION=%%a
        set VERSION=!VERSION:"=!
    )
)

:: Obtener fecha y hora
for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value 2^>nul') do set DT=%%a
set FECHA=%DT:~0,4%-%DT:~4,2%-%DT:~6,2%
set HORA=%DT:~8,2%-%DT:~10,2%-%DT:~12,2%
set TIMESTAMP=%FECHA%_%HORA%

:: Nombre del backup
set BACKUP_NAME=db_v%VERSION%_%TIMESTAMP%

echo [INFO] Version del sistema: %VERSION%
echo [INFO] Fecha: %FECHA% - Hora: %HORA%
echo.

:: Detectar tipo de base de datos
set DB_TYPE=none

:: Verificar si existe .env con DATABASE_URL
if exist ".env" (
    for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
        set "KEY=%%a"
        set "VAL=%%b"
        if "!KEY!"=="DATABASE_URL" (
            set DB_URL=!VAL!
            echo !VAL! | findstr /i "postgresql" >nul && set DB_TYPE=postgresql
            echo !VAL! | findstr /i "file:.*\.db" >nul && set DB_TYPE=sqlite
        )
    )
)

:: Si no se detectó por .env, buscar archivos SQLite
if "%DB_TYPE%"=="none" (
    if exist "prisma\dev.db" (
        set DB_TYPE=sqlite
        set DB_FILE=prisma\dev.db
    ) else if exist "db\database.db" (
        set DB_TYPE=sqlite
        set DB_FILE=db\database.db
    ) else if exist "data.db" (
        set DB_TYPE=sqlite
        set DB_FILE=data.db
    )
)

echo [1/3] Detectando base de datos...
echo        Tipo: %DB_TYPE%
echo.

if "%DB_TYPE%"=="sqlite" (
    echo [INFO] Creando backup de SQLite...
    
    if not defined DB_FILE set DB_FILE=prisma\dev.db
    
    if exist "!DB_FILE!" (
        copy "!DB_FILE!" "%BACKUP_DIR%\%BACKUP_NAME%.db" >nul 2>&1
        if !errorlevel! equ 0 (
            echo [OK] Backup creado: %BACKUP_NAME%.db
            
            :: También crear comprimido
            powershell -Command "Compress-Archive -Path '%BACKUP_DIR%\%BACKUP_NAME%.db' -DestinationPath '%BACKUP_DIR%\%BACKUP_NAME%.zip' -Force"
            if !errorlevel! equ 0 (
                del "%BACKUP_DIR%\%BACKUP_NAME%.db" 2>nul
                echo [OK] Backup comprimido: %BACKUP_NAME%.zip
            )
        ) else (
            echo [ERROR] No se pudo crear el backup
            pause
            exit /b 1
        )
    ) else (
        echo [ERROR] No se encontro el archivo de base de datos: !DB_FILE!
        pause
        exit /b 1
    )
    
) else if "%DB_TYPE%"=="postgresql" (
    echo [INFO] Creando backup de PostgreSQL...
    
    :: Extraer información de conexión de DATABASE_URL
    :: Formato: postgresql://usuario:password@host:puerto/database
    
    for /f "tokens=1,2,3,4 delims=:@/" %%x in ("!DB_URL!") do (
        set PROTOCOL=%%x
        set CREDENTIALS=%%y
        set HOST_PORT=%%z
        set DB_NAME=%%w
    )
    
    :: Separar usuario y password
    for /f "tokens=1,2 delims=:" %%a in ("!CREDENTIALS!") do (
        set DB_USER=%%a
        set PGPASSWORD=%%b
    )
    
    :: Separar host y puerto
    for /f "tokens=1,2 delims=:" %%a in ("!HOST_PORT!") do (
        set DB_HOST=%%a
        set DB_PORT=%%b
    )
    
    if not defined DB_PORT set DB_PORT=5432
    
    echo [INFO] Host: !DB_HOST!:!DB_PORT!
    echo [INFO] Database: !DB_NAME!
    echo [INFO] User: !DB_USER!
    echo.
    
    :: Buscar pg_dump
    set PG_DUMP=pg_dump
    if exist "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" (
        set PG_DUMP=C:\Program Files\PostgreSQL\16\bin\pg_dump.exe
    ) else if exist "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" (
        set PG_DUMP=C:\Program Files\PostgreSQL\15\bin\pg_dump.exe
    ) else if exist "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe" (
        set PG_DUMP=C:\Program Files\PostgreSQL\14\bin\pg_dump.exe
    )
    
    set BACKUP_FILE=%BACKUP_DIR%\%BACKUP_NAME%.sql
    
    "!PG_DUMP!" -h !DB_HOST! -p !DB_PORT! -U !DB_USER! -d !DB_NAME! -F p -f "%BACKUP_FILE%" 2>nul
    
    if !errorlevel! equ 0 (
        echo [OK] Backup creado: %BACKUP_NAME%.sql
        
        :: Comprimir el backup
        powershell -Command "Compress-Archive -Path '%BACKUP_FILE%' -DestinationPath '%BACKUP_DIR%\%BACKUP_NAME%.zip' -Force"
        if !errorlevel! equ 0 (
            del "%BACKUP_FILE%" 2>nul
            echo [OK] Backup comprimido: %BACKUP_NAME%.zip
        )
    ) else (
        echo [ERROR] No se pudo crear el backup de PostgreSQL
        echo        Verifique que pg_dump este disponible y las credenciales sean correctas
        pause
        exit /b 1
    )
    
) else (
    echo [ERROR] No se detecto ninguna base de datos
    echo.
    echo Verifique que exista:
    echo   - prisma\dev.db (SQLite)
    echo   - db\database.db (SQLite)  
    echo   - .env con DATABASE_URL (PostgreSQL/SQLite)
    echo.
    pause
    exit /b 1
)

:: Limpiar backups antiguos
echo.
echo [2/3] Limpiando backups antiguos (manteniendo últimos %MAX_BACKUPS%)...

set BACKUP_COUNT=0
for /f %%i in ('dir "%BACKUP_DIR%\*.zip" /b 2^>nul ^| find /c /v ""') do set BACKUP_COUNT=%%i

if %BACKUP_COUNT% gtr %MAX_BACKUPS% (
    set /a EXCESS=%BACKUP_COUNT%-%MAX_BACKUPS%
    echo [INFO] Hay %BACKUP_COUNT% backups, eliminando %EXCESS% más antiguos...
    
    dir "%BACKUP_DIR%\*.zip" /o:d /b > "%TEMP%\backups_db_list.txt"
    
    set COUNT=0
    for /f "usebackq delims=" %%f in ("%TEMP%\backups_db_list.txt") do (
        set /a COUNT+=1
        if !COUNT! leq %EXCESS% (
            del "%BACKUP_DIR%\%%f" 2>nul
            echo [ELIMINADO] %%f
        )
    )
    del "%TEMP%\backups_db_list.txt" 2>nul
) else (
    echo [OK] Hay %BACKUP_COUNT% backups, no es necesario limpiar
)

:: Resumen
echo.
echo [3/3] Resumen de backups disponibles:
echo ════════════════════════════════════════════════════════════════
dir "%BACKUP_DIR%\*.zip" /o-d /b 2>nul | findstr /n "." | findstr "^[1-5]:"
echo ...
for /f %%i in ('dir "%BACKUP_DIR%\*.zip" /b 2^>nul ^| find /c /v ""') do echo Total: %%i backups en disco
echo ════════════════════════════════════════════════════════════════
echo.
echo [OK] Backup de base de datos completado!
echo.
pause
