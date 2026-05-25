@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║     INSTALADOR SERVIDOR - SISTEMA FRIGORIFICO SOLEMAR           ║
echo ║              Windows Server con PostgreSQL                       ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.

:: Verificar permisos de administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Este instalador requiere permisos de administrador.
    echo Haga clic derecho y seleccione "Ejecutar como administrador".
    pause
    exit /b 1
)

:: Establecer ruta de instalación
set INSTALL_DIR=C:\SolemarFrigorifico
set LOG_FILE=%INSTALL_DIR%\instalacion.log

echo [INFO] Iniciando instalación del servidor...
echo Fecha: %date% %time% > "%LOG_FILE%"

:: Crear directorio de instalación
echo.
echo [1/8] Creando directorio de instalación...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%INSTALL_DIR%\data" mkdir "%INSTALL_DIR%\data"
if not exist "%INSTALL_DIR%\logs" mkdir "%INSTALL_DIR%\logs"
if not exist "%INSTALL_DIR%\backups" mkdir "%INSTALL_DIR%\backups"
echo Directorio creado: %INSTALL_DIR%

:: Verificar si Node.js está instalado
echo.
echo [2/8] Verificando Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ADVERTENCIA] Node.js no está instalado.
    echo Descargando Node.js LTS...
    
    :: Descargar Node.js
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile '%TEMP%\nodejs.msi'}"
    
    if exist "%TEMP%\nodejs.msi" (
        echo Instalando Node.js...
        msiexec /i "%TEMP%\nodejs.msi" /qn /norestart
        timeout /t 30 >nul
        
        :: Refrescar variables de entorno
        call refreshenv >nul 2>&1
    )
)

node --version
echo Node.js verificado.

:: Instalar PostgreSQL si no está instalado
echo.
echo [3/8] Verificando PostgreSQL...
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo [ADVERTENCIA] PostgreSQL no está instalado.
    echo.
    echo Por favor instale PostgreSQL 16 desde:
    echo https://www.postgresql.org/download/windows/
    echo.
    echo Configure durante la instalación:
    echo - Contraseña del usuario postgres: [definir contraseña segura]
    echo - Puerto: 5432 (predeterminado)
    echo - Locale: Spanish_Spain.1252
    echo.
    pause
)

:: Configurar base de datos PostgreSQL
echo.
echo [4/8] Configurando base de datos PostgreSQL...
echo.
echo Ingrese la contraseña del usuario postgres:
set /p PGPASSWORD="Contraseña: "

:: Crear base de datos y usuario
echo Creando base de datos y usuario...
psql -U postgres -c "CREATE DATABASE solemar_frigorifico;" 2>nul
psql -U postgres -c "CREATE USER solemar_user WITH ENCRYPTED PASSWORD 'Solemar2024!';" 2>nul
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE solemar_frigorifico TO solemar_user;" 2>nul
psql -U postgres -c "ALTER USER solemar_user CREATEDB;" 2>nul

echo Base de datos configurada.

:: Copiar archivos del proyecto
echo.
echo [5/8] Copiando archivos del proyecto...
xcopy /E /I /Y "%~dp0.." "%INSTALL_DIR%\app" >nul
echo Archivos copiados.

:: Crear archivo de configuración de base de datos
echo.
echo [6/8] Creando configuración...
(
echo # Base de datos PostgreSQL
echo DATABASE_URL="postgresql://solemar_user:Solemar2024!@localhost:5432/solemar_frigorifico?schema=public"
echo.
echo # Servidor
echo PORT=3000
echo NODE_ENV=production
echo.
echo # Email SMTP
echo SMTP_HOST=smtp.office365.com
echo SMTP_PORT=587
echo SMTP_USER=
echo SMTP_PASS=
) > "%INSTALL_DIR%\app\.env"

:: Instalar dependencias
echo.
echo [7/8] Instalando dependencias...
cd /d "%INSTALL_DIR%\app"
call npm install --production
echo Dependencias instaladas.

:: Generar cliente Prisma y sincronizar base de datos
echo.
echo [8/8] Configurando base de datos...
call npx prisma generate
call npx prisma db push --skip-generate
echo Base de datos sincronizada.

:: Crear servicio de Windows
echo.
echo Creando servicio de Windows...
sc create "SolemarFrigorifico" binPath= "%INSTALL_DIR%\app\node_modules\next\dist\bin\next start" DisplayName= "Sistema Frigorífico Solemar" start= auto
echo Servicio creado.

:: Configurar firewall
echo.
echo Configurando firewall...
netsh advfirewall firewall add rule name="Solemar Frigorifico HTTP" dir=in action=allow protocol=tcp localport=3000
netsh advfirewall firewall add rule name="Solemar Frigorifico HTTPS" dir=in action=allow protocol=tcp localport=443
netsh advfirewall firewall add rule name="PostgreSQL" dir=in action=allow protocol=tcp localport=5432
echo Firewall configurado.

:: Crear script de inicio
echo.
echo Creando scripts de utilidad...

:: Script de inicio
(
echo @echo off
echo cd /d "%INSTALL_DIR%\app"
echo call npm start
) > "%INSTALL_DIR%\iniciar.bat"

:: Script de respaldo
(
echo @echo off
echo set FECHA=%%date:~-4,4%%%%date:~-7,2%%%%date:~-10,2%%
echo set BACKUP_FILE=%INSTALL_DIR%\backups\backup_%%FECHA%%.sql
echo echo Realizando respaldo de la base de datos...
echo pg_dump -U solemar_user -d solemar_frigorifico -f "%%BACKUP_FILE%%"
echo echo Respaldo completado: %%BACKUP_FILE%%
) > "%INSTALL_DIR%\respaldar.bat"

:: Script de actualización
(
echo @echo off
echo cd /d "%INSTALL_DIR%\app"
echo echo Actualizando sistema...
echo git pull
echo call npm install
echo call npx prisma generate
echo call npx prisma db push
echo echo Actualización completada.
) > "%INSTALL_DIR%\actualizar.bat"

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║              INSTALACIÓN COMPLETADA                              ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo Directorio de instalación: %INSTALL_DIR%
echo.
echo Para iniciar el sistema:
echo   1. Ejecute: %INSTALL_DIR%\iniciar.bat
echo   2. O inicie el servicio desde Services.msc
echo.
echo Acceso web: http://localhost:3000
echo Base de datos: PostgreSQL en puerto 5432
echo.
echo IMPORTANTE:
echo   - Configure el archivo .env con los datos de email SMTP
echo   - Realice respaldos periódicos usando respaldar.bat
echo   - El usuario por defecto es: admin / admin123
echo.
pause
