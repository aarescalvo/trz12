@echo off
chcp 65001 >nul
title TrazaSole - Backup Sistema Completo
cd /d "%~dp0.."
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║      TRAZASOLE v3.7.24 - BACKUP SISTEMA COMPLETO       ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Crear carpetas de backups si no existen
if not exist "backups" mkdir backups
if not exist "backups\sistema" mkdir "backups\sistema"

REM Obtener fecha y hora
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "datetime=%%a"
set "FECHA=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%"
set "HORA=%datetime:~8,2%-%datetime:~10,2%"
set "VERSION=3.7.24"

REM Nombre de la carpeta de backup
set "BACKUP_DIR=backups\sistema\backup_sistema_%FECHA%_%HORA%_v%VERSION%"

echo [INFO] Creando backup completo del sistema...
echo [INFO] Carpeta: %BACKUP_DIR%
echo.

REM Crear carpeta de backup
mkdir "%BACKUP_DIR%"
mkdir "%BACKUP_DIR%\archivos"
mkdir "%BACKUP_DIR%\base-datos"

REM ============================================
REM 1. BACKUP DE ARCHIVOS
REM ============================================
echo.
echo [PASO 1/2] Copiando archivos del sistema...
echo.

echo [COPIANDO] Carpeta src...
xcopy "src" "%BACKUP_DIR%\archivos\src" /E /I /Q /Y >NUL 2>&1

echo [COPIANDO] Carpeta prisma...
xcopy "prisma" "%BACKUP_DIR%\archivos\prisma" /E /I /Q /Y >NUL 2>&1

echo [COPIANDO] Carpeta scripts...
if exist "scripts" xcopy "scripts" "%BACKUP_DIR%\archivos\scripts" /E /I /Q /Y >NUL 2>&1

echo [COPIANDO] Archivos de configuracion...
copy "package.json" "%BACKUP_DIR%\archivos\" >NUL 2>&1
copy ".env" "%BACKUP_DIR%\archivos\" >NUL 2>&1
copy "tsconfig.json" "%BACKUP_DIR%\archivos\" >NUL 2>&1

echo [OK] Archivos copiados.

REM ============================================
REM 2. BACKUP DE BASE DE DATOS
REM ============================================
echo.
echo [PASO 2/2] Creando backup de base de datos...
echo.

set "BACKUP_SQL=%BACKUP_DIR%\base-datos\backup_%FECHA%_%HORA%.sql"

REM Configuracion de PostgreSQL
set "PGHOST=localhost"
set "PGPORT=5432"
set "PGUSER=frigo_user"
set "PGDATABASE=frigorifico"
set PGPASSWORD=1810

"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -F p -f "%BACKUP_SQL%" 2>NUL

if exist "%BACKUP_SQL%" (
    echo [OK] Base de datos exportada.
) else (
    echo [ADVERTENCIA] No se pudo exportar la base de datos.
)

REM ============================================
REM 3. CREAR ARCHIVO DE INFO
REM ============================================
echo.
echo [INFO] Creando archivo de informacion...

(
    echo TRAZASOLE - BACKUP SISTEMA COMPLETO
    echo ===================================
    echo.
    echo Version: %VERSION%
    echo Fecha: %FECHA%
    echo Hora: %HORA%
    echo.
    echo Contenido:
    echo - archivos/src/          - Codigo fuente
    echo - archivos/prisma/       - Esquemas de base de datos
    echo - archivos/scripts/      - Scripts de utilidad
    echo - archivos/package.json  - Dependencias
    echo - archivos/.env          - Variables de entorno
    echo - base-datos/backup.sql  - Respaldo de PostgreSQL
    echo.
    echo Para restaurar:
    echo 1. Copiar carpeta 'archivos' a la raiz del proyecto
    echo 2. Ejecutar 'bun install'
    echo 3. Ejecutar 'bun run db:push'
    echo 4. Restaurar SQL si es necesario
) > "%BACKUP_DIR%\INFO.txt"

echo [OK] Archivo INFO.txt creado.

REM ============================================
REM 4. LIMPIAR BACKUPS ANTIGUOS
REM ============================================
echo.
echo [INFO] Limpiando backups antiguos (manteniendo ultimos 50)...

set COUNT=0
for /f %%a in ('dir /b /o-d "backups\sistema\backup_sistema_*" 2^>NUL ^| find /c /v ""') do set COUNT=%%a
echo [INFO] Backups de sistema encontrados: %COUNT%

if %COUNT% GTR 50 (
    echo [INFO] Eliminando backups antiguos...
    for /f "skip=50 delims=" %%d in ('dir /b /o-d "backups\sistema\backup_sistema_*" 2^>NUL') do (
        echo [ELIMINANDO] %%d
        rmdir /s /q "backups\sistema\%%d" 2>NUL
    )
) else (
    echo [INFO] No hay backups antiguos para eliminar.
)

echo.
echo ════════════════════════════════════════════════════════════
echo [LISTO] Backup de sistema completado!
echo ════════════════════════════════════════════════════════════
echo.
echo Carpeta: %BACKUP_DIR%
dir "%BACKUP_DIR%" /s | find "Archivo(s)" | find "bytes"
echo.
pause
