# ================================================================================
# SISTEMA DE ACTUALIZACIÓN - FRIGORÍFICO SOLEMAR
# ================================================================================
# 
# Este script lee la configuración de sistema.conf y actualiza el sistema
# desde el repositorio de GitHub configurado.
#
# USO:
#   .\actualizar-sistema.ps1 [-Forzar] [-Version "x.x.x"]
#
# ================================================================================

param(
    [switch]$Forzar,
    [string]$Version,
    [switch]$SinBackup,
    [switch]$SoloVerificar
)

# Configurar codificación
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Colores para output
function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "=" * 70 -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "=" * 70 -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step { param([string]$Text) Write-Host "  [>>] $Text" -ForegroundColor Yellow }
function Write-Success { param([string]$Text) Write-Host "  [OK] $Text" -ForegroundColor Green }
function Write-Error { param([string]$Text) Write-Host "  [ERROR] $Text" -ForegroundColor Red }
function Write-Info { param([string]$Text) Write-Host "  [INFO] $Text" -ForegroundColor Gray }
function Write-Warning { param([string]$Text) Write-Host "  [WARN] $Text" -ForegroundColor Magenta }

# ================================================================================
# LEER CONFIGURACIÓN
# ================================================================================

Write-Header "SISTEMA DE ACTUALIZACIÓN - FRIGORÍFICO SOLEMAR"

$installDir = "C:\SolemarFrigorifico"
$configFile = "$installDir\config\sistema.conf"

# Valores por defecto
$script:config = @{
    GITHUB_REPO_URL = "https://github.com/aarescalvo/153"
    GITHUB_BRANCH = "master"
    GITHUB_TOKEN = ""
    BACKUP_DIR = "$installDir\backups"
    BACKUP_KEEP_COUNT = "30"
    AUTO_BACKUP_BEFORE_UPDATE = "true"
    DB_HOST = "localhost"
    DB_PORT = "5432"
    DB_NAME = "solemar_frigorifico"
    DB_USER = "solemar_user"
    DB_PASSWORD = "Solemar2024!"
}

# Leer archivo de configuración si existe
if (Test-Path $configFile) {
    Write-Step "Leyendo configuración desde $configFile..."
    
    Get-Content $configFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and !$line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $key = $parts[0].Trim()
            $value = $parts[1].Trim().Trim('"')
            
            if ($script:config.ContainsKey($key)) {
                $script:config[$key] = $value
            }
        }
    }
    
    Write-Success "Configuración cargada correctamente"
} else {
    Write-Warning "Archivo de configuración no encontrado, usando valores por defecto"
}

# Mostrar repositorio configurado
Write-Host ""
Write-Host "  Repositorio: " -NoNewline
Write-Host $script:config["GITHUB_REPO_URL"] -ForegroundColor Green
Write-Host "  Branch:      " -NoNewline
Write-Host $script:config["GITHUB_BRANCH"] -ForegroundColor Green
Write-Host ""

# ================================================================================
# VERIFICAR ACTUALIZACIONES
# ================================================================================

Write-Header "VERIFICANDO ACTUALIZACIONES"

$repoUrl = $script:config["GITHUB_REPO_URL"]
$branch = $script:config["GITHUB_BRANCH"]
$token = $script:config["GITHUB_TOKEN"]

# Construir URL de la API de GitHub
$repoPath = $repoUrl -replace "https://github.com/", "" -replace ".git$", ""
$apiUrl = "https://api.github.com/repos/$repoPath/commits/$branch"

# Headers para la petición
$headers = @{
    "Accept" = "application/vnd.github.v3+json"
    "User-Agent" = "Solemar-Updater"
}

if ($token) {
    $headers["Authorization"] = "token $token"
}

try {
    Write-Step "Consultando GitHub..."
    
    $response = Invoke-RestMethod -Uri $apiUrl -Headers $headers -Method Get -ErrorAction Stop
    
    $latestCommit = $response.sha.Substring(0, 7)
    $latestMessage = $response.commit.message.Split("`n")[0]
    $latestDate = [DateTime]::Parse($response.commit.committer.date).ToLocalTime()
    
    Write-Success "Último commit encontrado: $latestCommit"
    Write-Info "Mensaje: $latestMessage"
    Write-Info "Fecha: $($latestDate.ToString('dd/MM/yyyy HH:mm'))"
    
    # Verificar commit actual
    $currentCommitFile = "$installDir\app\.commit"
    if (Test-Path $currentCommitFile) {
        $currentCommit = Get-Content $currentCommitFile -Raw
        $currentCommit = $currentCommit.Trim()
        
        if ($currentCommit -eq $latestCommit) {
            Write-Host ""
            Write-Host "  El sistema está ACTUALIZADO" -ForegroundColor Green
            
            if (-not $Forzar) {
                Write-Host ""
                Write-Host "  Use -Forzar para reinstalar la misma versión" -ForegroundColor Gray
                if (-not $SoloVerificar) {
                    Read-Host "`n  Presione Enter para salir"
                    exit 0
                }
            }
        } else {
            Write-Host ""
            Write-Host "  HAY UNA NUEVA VERSIÓN DISPONIBLE" -ForegroundColor Yellow
            Write-Host "  Commit actual: $currentCommit" -ForegroundColor Gray
            Write-Host "  Commit nuevo:  $latestCommit" -ForegroundColor Green
        }
    } else {
        Write-Warning "No se pudo determinar la versión instalada"
    }
    
} catch {
    Write-Error "Error al verificar actualizaciones: $_"
    Write-Info "Verifique su conexión a Internet y la URL del repositorio"
    
    if (-not $Forzar) {
        Read-Host "`n  Presione Enter para salir"
        exit 1
    }
}

if ($SoloVerificar) {
    Write-Host ""
    Write-Host "  Verificación completada. Use el script sin -SoloVerificar para actualizar." -ForegroundColor Gray
    exit 0
}

# ================================================================================
# CREAR RESPALDO
# ================================================================================

if (-not $SinBackup -and $script:config["AUTO_BACKUP_BEFORE_UPDATE"] -eq "true") {
    Write-Header "CREANDO RESPALDO"
    
    $backupDir = $script:config["BACKUP_DIR"]
    if (-not (Test-Path $backupDir)) {
        New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "$backupDir\backup_$timestamp.sql"
    
    Write-Step "Respaldando base de datos..."
    
    $env:PGPASSWORD = $script:config["DB_PASSWORD"]
    $pgDumpPath = "${env:ProgramFiles}\PostgreSQL\16\bin\pg_dump.exe"
    
    if (Test-Path $pgDumpPath) {
        & $pgDumpPath -h $script:config["DB_HOST"] -p $script:config["DB_PORT"] -U $script:config["DB_USER"] -d $script:config["DB_NAME"] -f $backupFile 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Respaldo creado: $backupFile"
            
            # Comprimir respaldo
            Write-Step "Comprimiendo respaldo..."
            Compress-Archive -Path $backupFile -DestinationPath "$backupFile.zip" -Force
            Remove-Item $backupFile -Force
            Write-Success "Respaldo comprimido: $backupFile.zip"
        } else {
            Write-Warning "Error al crear respaldo, continuando..."
        }
    } else {
        Write-Warning "pg_dump no encontrado, omitiendo respaldo"
    }
    
    $env:PGPASSWORD = $null
    
    # Limpiar respaldos antiguos
    Write-Step "Limpiando respaldos antiguos..."
    $keepCount = [int]$script:config["BACKUP_KEEP_COUNT"]
    $backups = Get-ChildItem "$backupDir\backup_*.zip" | Sort-Object LastWriteTime -Descending
    
    if ($backups.Count -gt $keepCount) {
        $backups | Select-Object -Skip $keepCount | ForEach-Object {
            Remove-Item $_.FullName -Force
            Write-Info "Eliminado: $($_.Name)"
        }
    }
    Write-Success "Mantenimiento de respaldos completado"
}

# ================================================================================
# DESCARGAR ACTUALIZACIÓN
# ================================================================================

Write-Header "DESCARGANDO ACTUALIZACIÓN"

$appDir = "$installDir\app"
$tempDir = "$env:TEMP\solemar-update"
$downloadUrl = "$repoUrl/archive/refs/heads/$branch.zip"

# Limpiar directorio temporal
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null

# Descargar
Write-Step "Descargando desde GitHub..."
$zipFile = "$tempDir\update.zip"

try {
    $webClient = New-Object System.Net.WebClient
    if ($token) {
        $webClient.Headers.Add("Authorization", "token $token")
    }
    $webClient.DownloadFile($downloadUrl, $zipFile)
    Write-Success "Descarga completada"
} catch {
    Write-Error "Error al descargar: $_"
    Read-Host "`n  Presione Enter para salir"
    exit 1
}

# Extraer
Write-Step "Extrayendo archivos..."
Expand-Archive -Path $zipFile -DestinationPath $tempDir -Force

# Encontrar carpeta extraída
$extractedFolder = Get-ChildItem "$tempDir\*" -Directory | Where-Object { $_.Name -like "*$branch*" -or $_.Name -like "*153*" -or $_.Name -like "*solemar*" } | Select-Object -First 1

if (-not $extractedFolder) {
    # Intentar con cualquier carpeta
    $extractedFolder = Get-ChildItem "$tempDir\*" -Directory | Select-Object -First 1
}

if ($extractedFolder) {
    Write-Success "Archivos extraídos en: $($extractedFolder.FullName)"
} else {
    Write-Error "No se pudo encontrar la carpeta extraída"
    exit 1
}

# ================================================================================
# DETENER SERVICIO
# ================================================================================

Write-Header "DETENIENDO SERVICIO"

$serviceName = "SolemarFrigorifico"
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if ($service) {
    Write-Step "Deteniendo servicio $serviceName..."
    Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
    
    # Esperar a que se detenga
    $timeout = 30
    $elapsed = 0
    while ((Get-Service -Name $serviceName -ErrorAction SilentlyContinue).Status -ne "Stopped" -and $elapsed -lt $timeout) {
        Start-Sleep -Seconds 1
        $elapsed++
    }
    
    Write-Success "Servicio detenido"
} else {
    Write-Info "El servicio no está instalado"
}

# ================================================================================
# ACTUALIZAR ARCHIVOS
# ================================================================================

Write-Header "ACTUALIZANDO ARCHIVOS"

Write-Step "Copiando archivos nuevos..."

# Preservar archivos importantes
$filesToKeep = @(
    "$appDir\.env",
    "$appDir\.commit",
    "$appDir\prisma\dev.db",
    "$appDir\db"
)

$filesToKeep | ForEach-Object {
    if (Test-Path $_) {
        $dest = "$tempDir\preserved\$($_ | Split-Path -Leaf)"
        $parentDir = Split-Path -Parent $dest
        if (-not (Test-Path $parentDir)) {
            New-Item -Path $parentDir -ItemType Directory -Force | Out-Null
        }
        Copy-Item $_ $dest -Force
        Write-Info "Preservando: $($_ | Split-Path -Leaf)"
    }
}

# Copiar archivos nuevos (excluyendo node_modules y .next)
$excludeDirs = @("node_modules", ".next", ".git", "backups", "logs")
$sourceFiles = Get-ChildItem $extractedFolder.FullName -Recurse -File | Where-Object {
    $dir = $_.DirectoryName
    -not ($excludeDirs | Where-Object { $dir -like "*\$_\*" -or $dir -like "*\$_" })
}

$totalFiles = $sourceFiles.Count
$currentFile = 0

foreach ($file in $sourceFiles) {
    $currentFile++
    $relativePath = $file.FullName.Substring($extractedFolder.FullName.Length + 1)
    $destPath = "$appDir\$relativePath"
    
    $destDir = Split-Path -Parent $destPath
    if (-not (Test-Path $destDir)) {
        New-Item -Path $destDir -ItemType Directory -Force | Out-Null
    }
    
    Copy-Item $file.FullName $destPath -Force
    
    if ($currentFile % 50 -eq 0) {
        Write-Info "Progreso: $currentFile / $totalFiles archivos"
    }
}

Write-Success "$totalFiles archivos actualizados"

# Restaurar archivos preservados
$preservedDir = "$tempDir\preserved"
if (Test-Path $preservedDir) {
    Get-ChildItem $preservedDir -File | ForEach-Object {
        Copy-Item $_.FullName "$appDir\$($_.Name)" -Force
        Write-Info "Restaurando: $($_.Name)"
    }
}

# Guardar commit actual
$latestCommit | Out-File "$appDir\.commit" -NoNewline -Encoding ASCII
Write-Success "Commit guardado: $latestCommit"

# ================================================================================
# ACTUALIZAR BASE DE DATOS
# ================================================================================

Write-Header "ACTUALIZANDO BASE DE DATOS"

Push-Location $appDir

# Verificar si hay cambios en el schema
$schemaChanged = $false
$newSchema = Get-Content "$extractedFolder\prisma\schema.prisma" -Raw -ErrorAction SilentlyContinue
$currentSchema = Get-Content "prisma\schema.prisma" -Raw -ErrorAction SilentlyContinue

if ($newSchema -and $currentSchema -and ($newSchema -ne $currentSchema)) {
    $schemaChanged = $true
    Write-Info "Cambios detectados en el schema de base de datos"
}

# Modificar schema para PostgreSQL
Write-Step "Configurando Prisma para PostgreSQL..."
$schema = Get-Content "prisma\schema.prisma" -Raw
$schema = $schema -replace 'provider\s*=\s*"sqlite"', 'provider = "postgresql"'
Set-Content "prisma\schema.prisma" -Value $schema -NoNewline

# Instalar dependencias
Write-Step "Instalando dependencias..."
& npm install 2>&1 | Out-Null
Write-Success "Dependencias instaladas"

# Generar Prisma Client
Write-Step "Generando Prisma Client..."
& npx prisma generate 2>&1 | Out-Null
Write-Success "Prisma Client generado"

# Sincronizar base de datos
if ($schemaChanged) {
    Write-Step "Sincronizando cambios en base de datos..."
    & npx prisma db push 2>&1 | Out-Null
    Write-Success "Base de datos actualizada"
} else {
    Write-Info "No hay cambios en el schema"
}

Pop-Location

# ================================================================================
# INICIAR SERVICIO
# ================================================================================

Write-Header "INICIANDO SERVICIO"

if ($service) {
    Write-Step "Iniciando servicio $serviceName..."
    Start-Service -Name $serviceName -ErrorAction SilentlyContinue
    
    Start-Sleep -Seconds 5
    
    $serviceStatus = (Get-Service -Name $serviceName -ErrorAction SilentlyContinue).Status
    if ($serviceStatus -eq "Running") {
        Write-Success "Servicio iniciado correctamente"
    } else {
        Write-Warning "El servicio no se inició automáticamente"
        Write-Info "Puede iniciarlo manualmente con: net start $serviceName"
    }
} else {
    Write-Info "Ejecute $installDir\iniciar.bat para iniciar el sistema"
}

# ================================================================================
# LIMPIAR
# ================================================================================

Write-Step "Limpiando archivos temporales..."
Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Success "Limpieza completada"

# ================================================================================
# RESUMEN
# ================================================================================

Write-Header "ACTUALIZACIÓN COMPLETADA"

Write-Host ""
Write-Host "  Versión anterior: " -NoNewline
if (Test-Path "$appDir\.commit.old") {
    Write-Host (Get-Content "$appDir\.commit.old") -ForegroundColor Gray
} else {
    Write-Host "desconocida" -ForegroundColor Gray
}

Write-Host "  Versión actual:   " -NoNewline
Write-Host $latestCommit -ForegroundColor Green
Write-Host ""
Write-Host "  Repositorio:      " -NoNewline
Write-Host $script:config["GITHUB_REPO_URL"] -ForegroundColor Cyan
Write-Host ""
Write-Host "  URL de acceso:    " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor White
Write-Host ""

Write-Host "=" * 70 -ForegroundColor Green
Write-Host ""

# Guardar en log
$logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | Actualizado a $latestCommit desde $($script:config["GITHUB_REPO_URL"])"
Add-Content "$installDir\logs\updates.log" $logEntry

Read-Host "  Presione Enter para finalizar"
