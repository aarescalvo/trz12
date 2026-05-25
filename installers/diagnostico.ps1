# ================================================================================
# DIAGNÓSTICO DEL SISTEMA - FRIGORÍFICO SOLEMAR
# ================================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$installDir = "C:\SolemarFrigorifico"
$configFile = "$installDir\config\sistema.conf"

function Write-Section { param([string]$Text) Write-Host ""; Write-Host "  $Text" -ForegroundColor Cyan; Write-Host "  " + "-" * 50 -ForegroundColor Gray }
function Write-Status { param([string]$Name, [string]$Status, [string]$Color) Write-Host "  $($Name.PadRight(25)): " -NoNewline; Write-Host $Status -ForegroundColor $Color }
function Write-OK { param([string]$Name, [string]$Value) Write-Status $Name $Value "Green" }
function Write-Warn { param([string]$Name, [string]$Value) Write-Status $Name $Value "Yellow" }
function Write-Err { param([string]$Name, [string]$Value) Write-Status $Name $Value "Red" }
function Write-Info { param([string]$Name, [string]$Value) Write-Status $Name $Value "Gray" }

Clear-Host

Write-Host ""
Write-Host "  ╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║        DIAGNÓSTICO DEL SISTEMA - FRIGORÍFICO SOLEMAR          ║" -ForegroundColor Cyan
Write-Host "  ╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "  Generado: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Gray

# ================================================================================
# INFORMACIÓN DEL SISTEMA
# ================================================================================

Write-Section "SISTEMA OPERATIVO"

$os = Get-CimInstance Win32_OperatingSystem
Write-OK "Sistema" $os.Caption
Write-OK "Versión" $os.Version
Write-OK "Arquitectura" $os.OSArchitecture
Write-Info "Último inicio" $os.LastBootUpTime.ToString("dd/MM/yyyy HH:mm")

# ================================================================================
# HARDWARE
# ================================================================================

Write-Section "HARDWARE"

$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$ram = Get-CimInstance Win32_ComputerSystem
$ramGB = [math]::Round($ram.TotalPhysicalMemory / 1GB, 2)
$freeRam = [math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1MB, 2)
$ramUsedPercent = [math]::Round(($ramGB - $freeRam) / $ramGB * 100, 1)

Write-OK "Procesador" $cpu.Name
Write-OK "Núcleos" "$($cpu.NumberOfCores) físicos, $($cpu.NumberOfLogicalProcessors) lógicos"
Write-OK "Memoria RAM" "$ramGB GB"
Write-Status "Memoria usada" "$ramUsedPercent%" $(if ($ramUsedPercent -gt 80) { "Red" } elseif ($ramUsedPercent -gt 60) { "Yellow" } else { "Green" })
Write-OK "Memoria libre" "$freeRam GB"

# Disco
$disk = Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DeviceID -eq "C:" } | Select-Object -First 1
$diskTotal = [math]::Round($disk.Size / 1GB, 2)
$diskFree = [math]::Round($disk.FreeSpace / 1GB, 2)
$diskUsedPercent = [math]::Round(($diskTotal - $diskFree) / $diskTotal * 100, 1)

Write-Section "ALMACENAMIENTO"
Write-OK "Disco C:" "$diskTotal GB total"
Write-Status "Espacio usado" "$diskUsedPercent%" $(if ($diskUsedPercent -gt 90) { "Red" } elseif ($diskUsedPercent -gt 80) { "Yellow" } else { "Green" })
Write-OK "Espacio libre" "$diskFree GB"

# ================================================================================
# RED
# ================================================================================

Write-Section "RED"

$adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" }
foreach ($adapter in $adapters) {
    Write-OK "IP $($adapter.InterfaceAlias)" $adapter.IPAddress
}

$gateway = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($gateway) {
    Write-OK "Puerta de enlace" $gateway.NextHop
}

# Verificar conexión a Internet
try {
    $dns = Resolve-DnsName "google.com" -ErrorAction Stop
    Write-OK "Internet" "Conectado"
} catch {
    Write-Err "Internet" "Sin conexión"
}

# ================================================================================
# SERVICIOS
# ================================================================================

Write-Section "SERVICIOS"

# PostgreSQL
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($pgService) {
    $color = if ($pgService.Status -eq "Running") { "Green" } else { "Red" }
    Write-Status "PostgreSQL" $pgService.Status $color
} else {
    Write-Warn "PostgreSQL" "No instalado"
}

# Node.js
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-OK "Node.js" $nodeVersion
} else {
    Write-Err "Node.js" "No instalado"
}

# npm
$npmVersion = npm --version 2>$null
if ($npmVersion) {
    Write-OK "npm" "v$npmVersion"
}

# Aplicación
$svc = Get-Service -Name "SolemarFrigorifico" -ErrorAction SilentlyContinue
if ($svc) {
    $color = if ($svc.Status -eq "Running") { "Green" } else { "Red" }
    Write-Status "Solemar App" $svc.Status $color
} else {
    Write-Warn "Solemar App" "No configurado como servicio"
}

# ================================================================================
# APLICACIÓN
# ================================================================================

Write-Section "APLICACIÓN"

if (Test-Path $installDir) {
    Write-OK "Directorio" $installDir
    
    # Versión instalada
    $commitFile = "$installDir\app\.commit"
    if (Test-Path $commitFile) {
        Write-OK "Versión" (Get-Content $commitFile)
    }
    
    # Verificar puerto
    $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($port3000) {
        Write-OK "Puerto 3000" "En uso"
    } else {
        Write-Warn "Puerto 3000" "No en uso"
    }
    
} else {
    Write-Err "Directorio" "No encontrado"
}

# ================================================================================
# BASE DE DATOS
# ================================================================================

Write-Section "BASE DE DATOS"

# Leer configuración
if (Test-Path $configFile) {
    $config = @{}
    Get-Content $configFile | ForEach-Object {
        if ($_ -match "^(\w+)=(.*)$") {
            $config[$Matches[1]] = $Matches[2].Trim('"')
        }
    }
    
    Write-OK "Host" $config["DB_HOST"]
    Write-OK "Puerto" $config["DB_PORT"]
    Write-OK "Base de datos" $config["DB_NAME"]
    Write-OK "Usuario" $config["DB_USER"]
    
    # Verificar conexión
    $env:PGPASSWORD = $config["DB_PASSWORD"]
    try {
        $result = & psql -h $config["DB_HOST"] -p $config["DB_PORT"] -U $config["DB_USER"] -d $config["DB_NAME"] -c "SELECT 1" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-OK "Conexión BD" "OK"
            
            # Tamaño de la base de datos
            $sizeResult = & psql -h $config["DB_HOST"] -p $config["DB_PORT"] -U $config["DB_USER"] -d $config["DB_NAME"] -t -c "SELECT pg_size_pretty(pg_database_size(current_database()))" 2>&1
            Write-OK "Tamaño BD" $sizeResult.Trim()
        } else {
            Write-Err "Conexión BD" "Error"
        }
    } catch {
        Write-Err "Conexión BD" "Error: $($_.Exception.Message)"
    }
    $env:PGPASSWORD = $null
} else {
    Write-Warn "Configuración" "Archivo no encontrado"
}

# ================================================================================
# RESPALDOS
# ================================================================================

Write-Section "RESPALDOS"

$backupDir = "$installDir\backups"
if (Test-Path $backupDir) {
    $backups = Get-ChildItem "$backupDir\*.zip" -ErrorAction SilentlyContinue
    Write-OK "Directorio" $backupDir
    Write-OK "Respaldos" "$($backups.Count) archivos"
    
    if ($backups.Count -gt 0) {
        $lastBackup = $backups | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        Write-Info "Último respaldo" $lastBackup.LastWriteTime.ToString("dd/MM/yyyy HH:mm")
    }
} else {
    Write-Warn "Directorio respaldos" "No existe"
}

# ================================================================================
# LOGS
# ================================================================================

Write-Section "LOGS"

$logDir = "$installDir\logs"
if (Test-Path $logDir) {
    $logs = Get-ChildItem $logDir -ErrorAction SilentlyContinue
    Write-OK "Directorio" $logDir
    Write-OK "Archivos de log" "$($logs.Count) archivos"
    
    # Errores recientes
    $errorLog = "$logDir\error.log"
    if (Test-Path $errorLog) {
        $errorCount = (Select-String -Path $errorLog -Pattern "error|ERROR|Error" | Measure-Object).Count
        if ($errorCount -gt 0) {
            Write-Warn "Errores recientes" $errorCount
        } else {
            Write-OK "Errores recientes" "Ninguno"
        }
    }
}

# ================================================================================
# REPOSITORIO
# ================================================================================

Write-Section "ACTUALIZACIONES"

if (Test-Path $configFile) {
    Write-OK "Repositorio" $config["GITHUB_REPO_URL"]
    Write-OK "Branch" $config["GITHUB_BRANCH"]
}

# ================================================================================
# RESUMEN
# ================================================================================

Write-Host ""
Write-Host "  " + "=" * 60 -ForegroundColor Gray
Write-Host "  DIAGNÓSTICO COMPLETADO" -ForegroundColor Green
Write-Host "  " + "=" * 60 -ForegroundColor Gray
Write-Host ""

# Guardar diagnóstico
$diagFile = "$installDir\logs\diagnostico_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
Start-Transcript -Path $diagFile -Append | Out-Null
Stop-Transcript | Out-Null

Write-Host "  Diagnóstico guardado en: $diagFile" -ForegroundColor Gray
Write-Host ""
