# Instalador del Sistema Frigorífico - Solemar Alimentaria
# Ejecutar como Administrador en Windows 11

param(
    [switch]$SkipBun,
    [switch]$SkipDatabase
)

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "Instalador Sistema Frigorífico - Solemar Alimentaria"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SISTEMA FRIGORÍFICO - SOLEMAR ALIMENTARIA" -ForegroundColor Yellow
Write-Host "  Instalador para Windows 11" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que se ejecuta como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "Haga clic derecho en PowerShell y seleccione 'Ejecutar como administrador'" -ForegroundColor Yellow
    Read-Host "Presione Enter para salir"
    exit 1
}

# Paso 1: Verificar/Instalar Bun
Write-Host "[PASO 1/5] Verificando Bun Runtime..." -ForegroundColor Green

$bunInstalled = $false
try {
    $bunVersion = bun --version 2>$null
    if ($bunVersion) {
        Write-Host "   Bun ya instalado: v$bunVersion" -ForegroundColor Gray
        $bunInstalled = $true
    }
} catch {}

if (-not $bunInstalled -and -not $SkipBun) {
    Write-Host "   Instalando Bun..." -ForegroundColor Yellow
    try {
        Invoke-RestMethod https://bun.sh/install.ps1 | Invoke-Expression
        # Refrescar variables de entorno
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        Write-Host "   Bun instalado correctamente" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] No se pudo instalar Bun. Instálelo manualmente desde https://bun.sh" -ForegroundColor Red
        exit 1
    }
}

# Paso 2: Crear directorio de instalación
Write-Host "[PASO 2/5] Preparando directorio de instalación..." -ForegroundColor Green

$installDir = "C:\Solemar\Frigorifico"
if (Test-Path $installDir) {
    Write-Host "   Directorio existente encontrado. ¿Desea sobrescribir? (S/N): " -ForegroundColor Yellow -NoNewline
    $response = Read-Host
    if ($response -eq "S" -or $response -eq "s") {
        Remove-Item -Path $installDir -Recurse -Force
    } else {
        Write-Host "   Instalación cancelada" -ForegroundColor Yellow
        exit 0
    }
}

New-Item -ItemType Directory -Path $installDir -Force | Out-Null
Write-Host "   Directorio creado: $installDir" -ForegroundColor Gray

# Paso 3: Copiar archivos
Write-Host "[PASO 3/5] Copiando archivos del sistema..." -ForegroundColor Green

# Copiar todo el contenido del directorio actual (donde está este script)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Copy-Item -Path "$scriptDir\*" -Destination $installDir -Recurse -Force -Exclude @("install-windows.ps1")

Write-Host "   Archivos copiados correctamente" -ForegroundColor Gray

# Paso 4: Instalar dependencias y base de datos
Set-Location $installDir

Write-Host "[PASO 4/5] Instalando dependencias..." -ForegroundColor Green

bun install 2>&1 | Out-Null
Write-Host "   Dependencias instaladas" -ForegroundColor Gray

if (-not $SkipDatabase) {
    Write-Host "   Configurando base de datos..." -ForegroundColor Yellow
    
    # Crear archivo .env si no existe
    if (-not (Test-Path ".env")) {
        @"
DATABASE_URL="file:./frigorifico.db"
NEXT_PUBLIC_APP_NAME="Solemar Alimentaria"
NEXT_PUBLIC_APP_VERSION="2.0"
"@ | Out-File -FilePath ".env" -Encoding utf8
    }
    
    # Generar cliente Prisma y sincronizar DB
    bunx prisma generate 2>&1 | Out-Null
    bunx prisma db push 2>&1 | Out-Null
    bun run db:seed 2>&1 | Out-Null
    
    Write-Host "   Base de datos configurada" -ForegroundColor Gray
}

# Paso 5: Crear accesos directos y scripts de inicio
Write-Host "[PASO 5/5] Creando accesos directos..." -ForegroundColor Green

# Script de inicio
$startScript = @"
@echo off
title Sistema Frigorifico - Solemar Alimentaria
cd /d $installDir
echo Iniciando Sistema Frigorifico...
echo.
echo Acceda al sistema en: http://localhost:3000
echo.
echo Credenciales de acceso:
echo   Usuario: admin
echo   Password: admin123
echo   PIN: 1234
echo.
echo Presione Ctrl+C para detener el servidor
echo ============================================
bun run dev
pause
"@
$startScript | Out-File -FilePath "$installDir\iniciar.bat" -Encoding ascii

# Acceso directo en escritorio
$WshShell = New-Object -ComObject WScript.Shell
$desktop = [System.Environment]::GetFolderPath("Desktop")
$shortcut = $WshShell.CreateShortcut("$desktop\Sistema Frigorifico.lnk")
$shortcut.TargetPath = "$installDir\iniciar.bat"
$shortcut.WorkingDirectory = $installDir
$shortcut.Description = "Sistema Frigorífico - Solemar Alimentaria"
$shortcut.Save()

Write-Host "   Acceso directo creado en el escritorio" -ForegroundColor Gray

# Resumen final
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  INSTALACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ubicación: $installDir" -ForegroundColor White
Write-Host ""
Write-Host "Para iniciar el sistema:" -ForegroundColor Yellow
Write-Host "  1. Haga doble clic en 'Sistema Frigorifico' en el escritorio" -ForegroundColor White
Write-Host "  2. O ejecute: $installDir\iniciar.bat" -ForegroundColor White
Write-Host ""
Write-Host "Credenciales de acceso:" -ForegroundColor Yellow
Write-Host "  Usuario: admin" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host "  PIN: 1234" -ForegroundColor White
Write-Host ""
Write-Host "El sistema se abrirá en: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Read-Host "Presione Enter para finalizar"
