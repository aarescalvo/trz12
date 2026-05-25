# ===========================================
# INSTALADOR - SISTEMA FRIGORIFICO
# Solemar Alimentaria - CICLO I
# Version: 2.0
# Plataforma: Windows 10/11 / Windows Server
# ===========================================

param(
    [string]$Mode = "full",
    [string]$InstallDir = "C:\Solemar",
    [string]$DataDir = "C:\Solemar\Data"
)

# Configuracion de errores
$ErrorActionPreference = "Stop"

# Colores para output
function Write-Info($message) {
    Write-Host "[INFO] " -ForegroundColor Blue -NoNewline
    Write-Host $message
}

function Write-Success($message) {
    Write-Host "[OK] " -ForegroundColor Green -NoNewline
    Write-Host $message
}

function Write-Warning($message) {
    Write-Host "[ADVERTENCIA] " -ForegroundColor Yellow -NoNewline
    Write-Host $message
}

function Write-Error($message) {
    Write-Host "[ERROR] " -ForegroundColor Red -NoNewline
    Write-Host $message
}

# Verificar permisos de administrador
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Verificar si Bun esta instalado
function Test-BunInstalled {
    try {
        $bunVersion = bun -v 2>$null
        return $true
    } catch {
        return $false
    }
}

# Instalar Bun
function Install-Bun {
    Write-Info "Instalando Bun runtime..."
    
    if (Test-BunInstalled) {
        Write-Success "Bun ya esta instalado"
        return
    }
    
    # Metodo 1: Usando PowerShell
    try {
        Invoke-RestMethod https://bun.sh/install.ps1 | Invoke-Expression
        Write-Success "Bun instalado correctamente via PowerShell"
    } catch {
        # Metodo 2: Usando npm si esta disponible
        if (Get-Command npm -ErrorAction SilentlyContinue) {
            Write-Info "Instalando Bun via npm..."
            npm install -g bun
            Write-Success "Bun instalado via npm"
        } else {
            Write-Error "No se pudo instalar Bun. Instale Node.js primero o descargue Bun manualmente de https://bun.sh"
            exit 1
        }
    }
    
    # Refrescar variables de entorno
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# Crear directorios
function New-Directories {
    Write-Info "Creando directorios de instalacion..."
    
    $directories = @(
        $InstallDir,
        "$DataDir\db",
        "$DataDir\logs",
        "$DataDir\backups"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    
    Write-Success "Directorios creados"
}

# Copiar archivos
function Copy-ProjectFiles {
    Write-Info "Copiando archivos del sistema..."
    
    $scriptDir = Split-Path -Parent $MyInvocation.ScriptName
    if ([string]::IsNullOrEmpty($scriptDir)) {
        $scriptDir = Get-Location
    }
    
    # Copiar todo excepto scripts de instalacion
    $excludePatterns = @("install.sh", "install.ps1", "INSTALL.md", "*.log", "node_modules", ".next")
    
    # Usar robocopy para copia robusta
    $source = $scriptDir
    $dest = $InstallDir
    
    # Crear lista de exclusiones
    $excludeArgs = @()
    foreach ($pattern in $excludePatterns) {
        $excludeArgs += "/XF"
        $excludeArgs += $pattern
    }
    
    robocopy $source $dest /E /R:3 /W:5 /NP /NFL /NDL @excludeArgs
    
    # Crear archivo .env si no existe
    $envFile = "$InstallDir\.env"
    if (-not (Test-Path $envFile)) {
        Copy-Item "$InstallDir\.env.example" $envFile -Force
        
        # Actualizar ruta de base de datos
        $envContent = Get-Content $envFile
        $envContent = $envContent -replace "DATABASE_URL=.*", "DATABASE_URL=file:$DataDir\db\custom.db"
        $envContent | Set-Content $envFile -Encoding UTF8
    }
    
    Write-Success "Archivos copiados a $InstallDir"
}

# Instalar dependencias
function Install-Dependencies {
    Write-Info "Instalando dependencias del proyecto..."
    
    Push-Location $InstallDir
    
    try {
        bun install
        Write-Success "Dependencias instaladas"
    } catch {
        Write-Error "Error al instalar dependencias: $_"
        Pop-Location
        exit 1
    }
    
    Pop-Location
}

# Configurar base de datos
function Initialize-Database {
    Write-Info "Configurando base de datos..."
    
    Push-Location $InstallDir
    
    try {
        # Generar Prisma Client
        bun run db:generate
        
        # Crear base de datos
        bun run db:push
        
        # Cargar datos iniciales
        Write-Info "Cargando datos iniciales..."
        bun run db:seed
        
        Write-Success "Base de datos configurada"
    } catch {
        Write-Error "Error al configurar base de datos: $_"
        Pop-Location
        exit 1
    }
    
    Pop-Location
}

# Compilar proyecto
function Build-Project {
    Write-Info "Compilando proyecto..."
    
    Push-Location $InstallDir
    
    try {
        bun run build
        Write-Success "Proyecto compilado correctamente"
    } catch {
        Write-Error "Error al compilar el proyecto: $_"
        Pop-Location
        exit 1
    }
    
    Pop-Location
}

# Crear servicio de Windows
function New-WindowsService {
    Write-Info "Creando servicio de Windows..."
    
    # Verificar si NSSM esta disponible
    $nssmPath = "$InstallDir\nssm.exe"
    
    if (-not (Test-Path $nssmPath)) {
        Write-Info "Descargando NSSM para crear servicio..."
        $nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
        $zipPath = "$env:TEMP\nssm.zip"
        
        try {
            Invoke-WebRequest -Uri $nssmUrl -OutFile $zipPath
            Expand-Archive $zipPath -DestinationPath "$env:TEMP\nssm" -Force
            
            # Copiar ejecutable correcto segun arquitectura
            if ([Environment]::Is64BitOperatingSystem) {
                Copy-Item "$env:TEMP\nssm\nssm-2.24\win64\nssm.exe" $nssmPath -Force
            } else {
                Copy-Item "$env:TEMP\nssm\nssm-2.24\win32\nssm.exe" $nssmPath -Force
            }
            
            Remove-Item $zipPath -Force
            Remove-Item "$env:TEMP\nssm" -Recurse -Force
        } catch {
            Write-Warning "No se pudo descargar NSSM. Se creara acceso directo en lugar de servicio."
            New-StartShortcut
            return
        }
    }
    
    # Crear servicio
    $serviceName = "SolemarFrigorifico"
    $bunPath = (Get-Command bun -ErrorAction SilentlyContinue).Source
    
    if ([string]::IsNullOrEmpty($bunPath)) {
        $bunPath = "$env:USERPROFILE\.bun\bin\bun.exe"
    }
    
    # Eliminar servicio si existe
    & $nssmPath remove $serviceName confirm 2>$null
    
    # Crear nuevo servicio
    & $nssmPath install $serviceName $bunPath ".next\standalone\server.js"
    & $nssmPath set $serviceName AppDirectory $InstallDir
    & $nssmPath set $serviceName DisplayName "Sistema Frigorifico - Solemar Alimentaria"
    & $nssmPath set $serviceName Description "Sistema de gestion frigorifica para control de tropas, pesaje y faena"
    & $nssmPath set $serviceName Start SERVICE_AUTO_START
    & $nssmPath set $serviceName AppStdout "$DataDir\logs\app.log"
    & $nssmPath set $serviceName AppStderr "$DataDir\logs\error.log"
    & $nssmPath set $serviceName AppRotateFiles 1
    & $nssmPath set $serviceName AppRotateBytes 1048576
    
    Write-Success "Servicio creado: $serviceName"
    
    # Iniciar servicio
    Write-Info "Iniciando servicio..."
    Start-Service $serviceName
    Write-Success "Servicio iniciado"
}

# Crear acceso directo de inicio
function New-StartShortcut {
    Write-Info "Creando script de inicio..."
    
    $startScript = @"
@echo off
cd /d $InstallDir
set NODE_ENV=production
bun .next\standalone\server.js
pause
"@
    
    Set-Content -Path "$InstallDir\iniciar.bat" -Value $startScript -Encoding ASCII
    
    # Crear acceso directo en escritorio
    $WshShell = New-Object -ComObject WScript.Shell
    $shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Solemar Frigorifico.lnk")
    $shortcut.TargetPath = "$InstallDir\iniciar.bat"
    $shortcut.WorkingDirectory = $InstallDir
    $shortcut.Description = "Iniciar Sistema Frigorifico"
    $shortcut.Save()
    
    Write-Success "Script de inicio creado: $InstallDir\iniciar.bat"
}

# Crear firewall rule
function New-FirewallRule {
    Write-Info "Configurando firewall..."
    
    $ruleName = "Solemar Frigorifico - Puerto 3000"
    
    # Verificar si la regla ya existe
    $existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    
    if ($existingRule) {
        Write-Success "Regla de firewall ya existe"
        return
    }
    
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow | Out-Null
    
    Write-Success "Puerto 3000 habilitado en firewall"
}

# Crear scripts de utilidad
function New-UtilityScripts {
    Write-Info "Creando scripts de utilidad..."
    
    # Script de backup
    $backupScript = @"
@echo off
set BACKUP_DIR=$DataDir\backups
set DATE=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%
set DATE=%DATE: =0%
copy "$DataDir\db\custom.db" "%BACKUP_DIR%\solemar_%DATE%.db"
echo Backup creado: solemar_%DATE%.db
forfiles /p "%BACKUP_DIR%" /m *.db /d -30 /c "cmd /c del @path" 2>nul
"@
    
    Set-Content -Path "$InstallDir\backup.bat" -Value $backupScript -Encoding ASCII
    
    # Script de actualizacion
    $updateScript = @"
@echo off
cd /d $InstallDir
echo Actualizando sistema...
git pull origin main
bun install
bun run db:generate
bun run db:push
bun run build
echo Actualizacion completada. Reinicie el servicio.
pause
"@
    
    Set-Content -Path "$InstallDir\actualizar.bat" -Value $updateScript -Encoding ASCII
    
    Write-Success "Scripts de utilidad creados"
}

# Mostrar informacion final
function Show-FinalInfo {
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "INSTALACION COMPLETADA" -ForegroundColor Green
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "Directorio de instalacion: $InstallDir"
    Write-Host "Directorio de datos: $DataDir"
    Write-Host "Base de datos: $DataDir\db\custom.db"
    Write-Host ""
    Write-Host "Comandos utiles:"
    Write-Host "  Iniciar servicio:  Start-Service SolemarFrigorifico"
    Write-Host "  Detener servicio:  Stop-Service SolemarFrigorifico"
    Write-Host "  Ver logs:          Get-Content $DataDir\logs\app.log -Tail 50"
    Write-Host "  Backup manual:     $InstallDir\backup.bat"
    Write-Host ""
    Write-Host "Credenciales de acceso:"
    Write-Host "  Usuario: admin"
    Write-Host "  Password: admin123"
    Write-Host "  PIN: 1234"
    Write-Host ""
    Write-Host "Acceda a: http://localhost:3000"
    Write-Host ""
}

# Funcion principal
function Main {
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "  INSTALADOR SISTEMA FRIGORIFICO"
    Write-Host "  Solemar Alimentaria - CICLO I"
    Write-Host "=========================================="
    Write-Host ""
    
    # Verificar permisos de administrador
    if (-not (Test-Administrator)) {
        Write-Error "Este script debe ejecutarse como Administrador"
        Write-Host "Haga clic derecho en PowerShell y seleccione 'Ejecutar como administrador'"
        exit 1
    }
    
    switch ($Mode) {
        "full" {
            Install-Bun
            New-Directories
            Copy-ProjectFiles
            Install-Dependencies
            Initialize-Database
            Build-Project
            New-WindowsService
            New-FirewallRule
            New-UtilityScripts
            Show-FinalInfo
        }
        "update" {
            Write-Info "Modo actualizacion..."
            Push-Location $InstallDir
            bun install
            bun run db:generate
            bun run db:push
            bun run build
            Pop-Location
            Write-Success "Actualizacion completada"
        }
        "seed-only" {
            Write-Info "Modo solo seed..."
            Push-Location $InstallDir
            bun run db:seed
            Pop-Location
            Write-Success "Datos cargados"
        }
        default {
            Write-Host "Uso: .\install.ps1 -Mode [full|update|seed-only]"
            exit 1
        }
    }
}

# Ejecutar
Main
