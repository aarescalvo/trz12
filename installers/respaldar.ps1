# ================================================================================
# RESPALDO DE BASE DE DATOS
# ================================================================================

param(
    [string]$Destino = "",
    [switch]$Comprimir = $true,
    [switch]$IncluirArchivos
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$installDir = "C:\SolemarFrigorifico"
$configFile = "$installDir\config\sistema.conf"

Write-Host ""
Write-Host "  RESPALDO DE BASE DE DATOS" -ForegroundColor Cyan
Write-Host "  " + "=" * 50 -ForegroundColor Gray
Write-Host ""

# Leer configuración
$dbHost = "localhost"
$dbPort = "5432"
$dbName = "solemar_frigorifico"
$dbUser = "solemar_user"
$dbPassword = "Solemar2024!"
$backupDir = "$installDir\backups"

if (Test-Path $configFile) {
    Get-Content $configFile | ForEach-Object {
        if ($_ -match "^DB_HOST=(.+)") { $dbHost = $Matches[1].Trim('"') }
        if ($_ -match "^DB_PORT=(.+)") { $dbPort = $Matches[1].Trim('"') }
        if ($_ -match "^DB_NAME=(.+)") { $dbName = $Matches[1].Trim('"') }
        if ($_ -match "^DB_USER=(.+)") { $dbUser = $Matches[1].Trim('"') }
        if ($_ -match "^DB_PASSWORD=(.+)") { $dbPassword = $Matches[1].Trim('"') }
        if ($_ -match "^BACKUP_DIR=(.+)") { $backupDir = $Matches[1].Trim('"') }
    }
}

# Crear directorio de backup si no existe
if (-not (Test-Path $backupDir)) {
    New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
}

# Generar nombre del archivo
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
if ($Destino) {
    $backupFile = $Destino
} else {
    $backupFile = "$backupDir\backup_$timestamp.sql"
}

Write-Host "  [>>] Creando respaldo..." -ForegroundColor Yellow
Write-Host "       Base de datos: $dbName" -ForegroundColor Gray
Write-Host "       Archivo:       $backupFile" -ForegroundColor Gray

# Buscar pg_dump
$pgDumpPath = "${env:ProgramFiles}\PostgreSQL\16\bin\pg_dump.exe"
if (-not (Test-Path $pgDumpPath)) {
    $pgDumpPath = "pg_dump"  # Usar PATH
}

# Establecer contraseña
$env:PGPASSWORD = $dbPassword

try {
    & $pgDumpPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -F p -f $backupFile 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        $fileSize = (Get-Item $backupFile).Length / 1MB
        Write-Host "  [OK] Respaldo creado: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
        
        # Comprimir si se solicita
        if ($Comprimir) {
            Write-Host "  [>>] Comprimiendo..." -ForegroundColor Yellow
            Compress-Archive -Path $backupFile -DestinationPath "$backupFile.zip" -Force
            Remove-Item $backupFile -Force
            
            $zipSize = (Get-Item "$backupFile.zip").Length / 1MB
            Write-Host "  [OK] Comprimido: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Green
            
            $finalFile = "$backupFile.zip"
        } else {
            $finalFile = $backupFile
        }
        
        # Incluir archivos si se solicita
        if ($IncluirArchivos) {
            Write-Host "  [>>] Incluyendo archivos del sistema..." -ForegroundColor Yellow
            $appBackup = "$backupDir\archivos_$timestamp.zip"
            Compress-Archive -Path "$installDir\app" -DestinationPath $appBackup -Force
            Write-Host "  [OK] Archivos respaldados: $appBackup" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "  Respaldo completado exitosamente" -ForegroundColor Green
        Write-Host "  Archivo: $finalFile" -ForegroundColor Cyan
        
    } else {
        Write-Host "  [ERROR] Error al crear respaldo" -ForegroundColor Red
    }
} catch {
    Write-Host "  [ERROR] $($_.Exception.Message)" -ForegroundColor Red
} finally {
    $env:PGPASSWORD = $null
}

Write-Host ""
