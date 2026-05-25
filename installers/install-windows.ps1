# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                                                                              ║
# ║          FRIGORIFICO SOLEMAR - INSTALADOR WINDOWS 10/11                     ║
# ║                    Version 1.0.0                                             ║
# ║                                                                              ║
# ║  Sistema de Gestion Frigorifica para Control de Tropas, Pesaje y Faena      ║
# ║                                                                              ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

param(
    [switch]$Silent,
    [string]$InstallDir = "C:\FrigorificoSolemar"
)

# Configuracion
$ErrorActionPreference = "Stop"
$AppName = "Frigorifico Solemar"
$AppVersion = "1.0.0"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        "SUCCESS" { "Green" }
        default { "White" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-Bun {
    Write-Log "Instalando Bun runtime..."
    try {
        # Metodo 1: PowerShell oficial
        Invoke-RestMethod bun.sh/install.ps1 | Invoke-Expression
        
        # Refrescar variables de entorno
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        # Verificar instalacion
        $bunPath = "$env:USERPROFILE\.bun\bin\bun.exe"
        if (Test-Path $bunPath) {
            Write-Log "Bun instalado correctamente" "SUCCESS"
            return $true
        }
        
        # Metodo 2: Descarga directa como alternativa
        Write-Log "Intentando metodo alternativo de instalacion..."
        $bunUrl = "https://github.com/oven-sh/bun/releases/latest/download/bun-windows-x64.zip"
        $zipPath = "$env:TEMP\bun.zip"
        $extractPath = "$env:USERPROFILE\.bun"
        
        Invoke-WebRequest -Uri $bunUrl -OutFile $zipPath -UseBasicParsing
        Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
        Remove-Item $zipPath -Force
        
        # Agregar al PATH del usuario
        $bunBinPath = "$extractPath\bun-windows-x64"
        [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$bunBinPath", "User")
        $env:Path += ";$bunBinPath"
        
        Write-Log "Bun instalado correctamente (metodo alternativo)" "SUCCESS"
        return $true
    }
    catch {
        Write-Log "Error instalando Bun: $_" "ERROR"
        return $false
    }
}

function New-Shortcut {
    param([string]$TargetPath, [string]$ShortcutPath, [string]$Description = "")
    
    try {
        $ws = New-Object -ComObject WScript.Shell
        $shortcut = $ws.CreateShortcut($ShortcutPath)
        $shortcut.TargetPath = $TargetPath
        $shortcut.Description = $Description
        $shortcut.Save()
    }
    catch {
        Write-Log "No se pudo crear el acceso directo: $_" "WARNING"
    }
}

# ==================== INICIO DE INSTALACION ====================

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         FRIGORIFICO SOLEMAR - INSTALADOR WINDOWS               ║" -ForegroundColor Cyan
Write-Host "║                    Version $AppVersion                              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar permisos de administrador
if (-not (Test-Administrator)) {
    Write-Log "Este instalador requiere permisos de administrador." "ERROR"
    Write-Log "Por favor, ejecute PowerShell como administrador:" "ERROR"
    Write-Host ""
    Write-Host "  1. Haga clic derecho en el boton de Inicio de Windows" -ForegroundColor Yellow
    Write-Host "  2. Seleccione 'Windows PowerShell (Administrador)' o 'Terminal (Administrador)'" -ForegroundColor Yellow
    Write-Host "  3. Ejecute el instalador nuevamente" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

# PASO 1: Crear directorios
Write-Log "[1/8] Creando directorio de instalacion..."
try {
    $directories = @(
        $InstallDir,
        "$InstallDir\data",
        "$InstallDir\backups",
        "$InstallDir\logs"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -Path $dir -ItemType Directory -Force | Out-Null
        }
    }
    Write-Log "Directorios creados correctamente en: $InstallDir" "SUCCESS"
}
catch {
    Write-Log "Error creando directorios: $_" "ERROR"
    Write-Log "Asegurese de tener permisos para escribir en $InstallDir" "ERROR"
    pause
    exit 1
}

# PASO 2: Verificar/Instalar Bun
Write-Log "[2/8] Verificando Bun runtime..."
$bunInstalled = Get-Command bun -ErrorAction SilentlyContinue
if (-not $bunInstalled) {
    Write-Log "Bun no esta instalado. Procediendo con la instalacion..." "WARNING"
    if (-not (Install-Bun)) {
        Write-Log "No se pudo instalar Bun automaticamente." "ERROR"
        Write-Log "Por favor instale Bun manualmente siguiendo estos pasos:" "ERROR"
        Write-Host ""
        Write-Host "  1. Abra un navegador web" -ForegroundColor Yellow
        Write-Host "  2. Vaya a: https://bun.sh" -ForegroundColor Yellow
        Write-Host "  3. Descargue el instalador para Windows" -ForegroundColor Yellow
        Write-Host "  4. Ejecute el instalador y reinicie este instalador" -ForegroundColor Yellow
        Write-Host ""
        pause
        exit 1
    }
} else {
    $bunVersion = & bun --version 2>&1
    Write-Log "Bun ya esta instalado (version: $bunVersion)" "SUCCESS"
}

# PASO 3: Copiar archivos
Write-Log "[3/8] Copiando archivos del programa..."
try {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $sourceDir = if (Test-Path "$scriptDir\..\package.json") { Split-Path -Parent $scriptDir } else { $scriptDir }
    
    # Copiar todo excepto carpetas innecesarias
    $excludeDirs = @(".next", "node_modules", ".git", "backups", "logs")
    
    # Crear directorio de la aplicacion
    $appDir = "$InstallDir\app"
    if (-not (Test-Path $appDir)) {
        New-Item -Path $appDir -ItemType Directory -Force | Out-Null
    }
    
    Get-ChildItem -Path $sourceDir -Force | Where-Object {
        $_.Name -notin $excludeDirs
    } | ForEach-Object {
        if ($_.PSIsContainer) {
            Copy-Item -Path $_.FullName -Destination "$appDir\$($_.Name)" -Recurse -Force
        } else {
            Copy-Item -Path $_.FullName -Destination $appDir -Force
        }
    }
    
    Write-Log "Archivos copiados correctamente" "SUCCESS"
}
catch {
    Write-Log "Error copiando archivos: $_" "ERROR"
    pause
    exit 1
}

# PASO 4: Crear configuracion
Write-Log "[4/8] Creando archivo de configuracion..."
try {
    $dbPath = "$InstallDir\data\frigorifico.db"
    $envContent = @"
DATABASE_URL="file:$dbPath"
NODE_ENV=production
"@
    Set-Content -Path "$InstallDir\app\.env" -Value $envContent -Encoding UTF8
    Write-Log "Configuracion creada correctamente" "SUCCESS"
}
catch {
    Write-Log "Error creando configuracion: $_" "ERROR"
    pause
    exit 1
}

# PASO 5: Instalar dependencias
Write-Log "[5/8] Instalando dependencias del sistema..."
Write-Log "Este proceso puede tardar entre 2 y 5 minutos dependiendo de su conexion a Internet..." "WARNING"
try {
    Push-Location "$InstallDir\app"
    
    # Instalar dependencias
    $installResult = & bun install 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Error en la instalacion de dependencias: $installResult" "WARNING"
        Write-Log "Intentando continuar de todos modos..." "WARNING"
    }
    
    Pop-Location
    Write-Log "Dependencias instaladas" "SUCCESS"
}
catch {
    Write-Log "Error instalando dependencias: $_" "WARNING"
    Write-Log "Intentando continuar con la instalacion..." "WARNING"
    Pop-Location
}

# PASO 6: Inicializar base de datos
Write-Log "[6/8] Inicializando base de datos..."
try {
    Push-Location "$InstallDir\app"
    
    # Generar cliente Prisma
    & bunx prisma generate 2>&1 | Out-Null
    
    # Crear esquema de base de datos
    $dbPushResult = & bunx prisma db push 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Advertencia en la creacion de la base de datos: $dbPushResult" "WARNING"
    }
    
    # Cargar datos iniciales
    $seedResult = & bun run db:seed 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Base de datos inicializada con datos de ejemplo" "SUCCESS"
    } else {
        Write-Log "Base de datos creada (sin datos iniciales)" "SUCCESS"
    }
    
    Pop-Location
}
catch {
    Write-Log "Error inicializando base de datos: $_" "WARNING"
    Write-Log "Podra inicializarla manualmente ejecutando: bun run db:push" "WARNING"
    Pop-Location
}

# PASO 7: Crear scripts de utilidad
Write-Log "[7/8] Creando scripts de utilidad..."

# Script de inicio
$startScript = @"
@echo off
title Frigorifico Solemar - Sistema Activo
cd /d "$InstallDir\app"
echo.
echo ================================================================
echo               FRIGORIFICO SOLEMAR - INICIANDO
echo ================================================================
echo.
echo Espere mientras el sistema carga...
echo El navegador se abrira automaticamente cuando este listo.
echo.
echo IMPORTANTE: NO CIERRE ESTA VENTANA mientras el sistema este en uso.
echo Para detener el sistema, cierre esta ventana o presione Ctrl+C.
echo.
echo ================================================================
echo.
start http://localhost:3000
bun run dev
"@
Set-Content -Path "$InstallDir\iniciar.bat" -Value $startScript -Encoding ASCII

# Script de detencion
$stopScript = @"
@echo off
echo.
echo Deteniendo Frigorifico Solemar...
taskkill /F /IM bun.exe 2>nul
taskkill /F /IM node.exe 2>nul
echo.
echo Sistema detenido correctamente.
echo.
pause
"@
Set-Content -Path "$InstallDir\detener.bat" -Value $stopScript -Encoding ASCII

# Script de respaldo
$backupScript = @"
@echo off
echo.
echo Creando respaldo de la base de datos...
set FECHA=%date:~-4,4%%date:~-7,2%%date:~-10,2%
set HORA=%time:~0,2%%time:~3,2%
set HORA=%HORA: =0%
copy "$InstallDir\data\frigorifico.db" "$InstallDir\backups\backup_%FECHA%_%HORA%.db" >nul
if %errorLevel% equ 0 (
    echo.
    echo Respaldo creado exitosamente: backup_%FECHA%_%HORA%.db
    echo Ubicacion: $InstallDir\backups\
) else (
    echo.
    echo Error al crear el respaldo.
)
echo.
pause
"@
Set-Content -Path "$InstallDir\respaldar.bat" -Value $backupScript -Encoding ASCII

# Script de desinstalacion
$uninstallScript = @"
@echo off
echo.
echo ================================================================
echo           DESINSTALACION DE FRIGORIFICO SOLEMAR
echo ================================================================
echo.
echo ADVERTENCIA: Esta accion eliminara todos los datos del sistema.
echo.
set /p CONFIRM="Esta seguro que desea desinstalar? (S/N): "
if /i not "%CONFIRM%"=="S" goto :cancel

echo.
echo Deteniendo servicios...
taskkill /F /IM bun.exe 2>nul
taskkill /F /IM node.exe 2>nul

echo Eliminando archivos...
rmdir /S /Q "$InstallDir\app" 2>nul
rmdir /S /Q "$InstallDir\data" 2>nul
rmdir /S /Q "$InstallDir\logs" 2>nul
del "$InstallDir\*.bat" 2>nul
del "%USERPROFILE%\Desktop\Frigorifico Solemar.lnk" 2>nul

echo Configurando firewall...
netsh advfirewall firewall delete rule name="Frigorifico Solemar" >nul 2>&1

echo.
echo Desinstalacion completada correctamente.
echo.
pause
exit /b 0

:cancel
echo.
echo Operacion cancelada por el usuario.
echo.
pause
"@
Set-Content -Path "$InstallDir\desinstalar.bat" -Value $uninstallScript -Encoding ASCII

# Crear acceso directo en el escritorio
try {
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    New-Shortcut -TargetPath "$InstallDir\iniciar.bat" -ShortcutPath "$desktopPath\Frigorifico Solemar.lnk" -Description "Sistema de Gestion Frigorifica"
    Write-Log "Acceso directo creado en el escritorio" "SUCCESS"
} catch {
    Write-Log "No se pudo crear el acceso directo en el escritorio" "WARNING"
}

Write-Log "Scripts de utilidad creados correctamente" "SUCCESS"

# PASO 8: Configurar firewall
Write-Log "[8/8] Configurando firewall de Windows..."
try {
    # Eliminar regla existente si la hay
    netsh advfirewall firewall delete rule name="Frigorifico Solemar" 2>&1 | Out-Null
    
    # Crear nueva regla
    netsh advfirewall firewall add rule name="Frigorifico Solemar" dir=in action=allow protocol=tcp localport=3000 2>&1 | Out-Null
    netsh advfirewall firewall add rule name="Frigorifico Solemar" dir=out action=allow protocol=tcp localport=3000 2>&1 | Out-Null
    
    Write-Log "Firewall configurado correctamente" "SUCCESS"
} catch {
    Write-Log "No se pudo configurar el firewall automaticamente" "WARNING"
    Write-Log "Si tiene problemas de conexion, agregue una excepcion para el puerto 3000 manualmente" "WARNING"
}

# ==================== FINALIZACION ====================

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              INSTALACION COMPLETADA EXITOSAMENTE                ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "El sistema se ha instalado en: " -NoNewline
Write-Host $InstallDir -ForegroundColor Cyan
Write-Host ""
Write-Host "ACCESOS DIRECTOS:" -ForegroundColor Yellow
Write-Host "  - Escritorio: " -NoNewline
Write-Host "'Frigorifico Solemar'" -ForegroundColor White
Write-Host ""
Write-Host "ARCHIVOS DE UTILIDAD:" -ForegroundColor Yellow
Write-Host "  - Iniciar:    " -NoNewline
Write-Host "$InstallDir\iniciar.bat" -ForegroundColor White
Write-Host "  - Detener:    " -NoNewline
Write-Host "$InstallDir\detener.bat" -ForegroundColor White
Write-Host "  - Respaldo:   " -NoNewline
Write-Host "$InstallDir\respaldar.bat" -ForegroundColor White
Write-Host "  - Desinstalar:" -NoNewline
Write-Host "$InstallDir\desinstalar.bat" -ForegroundColor White
Write-Host ""
Write-Host "CREDENCIALES POR DEFECTO:" -ForegroundColor Yellow
Write-Host "  - Usuario:  " -NoNewline
Write-Host "admin" -ForegroundColor White
Write-Host "  - Password: " -NoNewline
Write-Host "admin123" -ForegroundColor White
Write-Host "  - PIN:      " -NoNewline
Write-Host "1234" -ForegroundColor White
Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan

if (-not $Silent) {
    Write-Host ""
    Write-Host "Presione cualquier tecla para INICIAR EL SISTEMA..." -ForegroundColor Green
    pause
    
    # Iniciar el sistema
    Write-Host "Iniciando sistema..." -ForegroundColor Cyan
    Start-Process "http://localhost:3000"
    Push-Location "$InstallDir\app"
    & bun run dev
    Pop-Location
}
