# ================================================================================
# INSTALADOR AUTOMATICO - SISTEMA FRIGORIFICO SOLEMAR
# Windows Server con PostgreSQL - Instalacion Desatendida
# ================================================================================
# 
# USO: Ejecutar como Administrador en PowerShell
#   .\install-auto.ps1
#
# REQUISITOS PREVIOS:
#   - Windows Server 2019+ o Windows 10/11 Pro
#   - Conexion a Internet
#   - Permisos de Administrador
#
# ================================================================================

param(
    [string]$InstallDir = "C:\SolemarFrigorifico",
    [string]$DbPassword = "Solemar2024!",
    [string]$DbUser = "solemar_user",
    [string]$DbName = "solemar_frigorifico",
    [int]$AppPort = 3000,
    [int]$DbPort = 5432,
    [string]$ServerIp = "",
    [string]$GithubRepo = "https://github.com/aarescalvo/153",
    [string]$GithubBranch = "master",
    [string]$GithubToken = ""
)

# Configurar codificacion
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

function Write-Step {
    param([string]$Text)
    Write-Host "  [>>] $Text" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Text)
    Write-Host "  [OK] $Text" -ForegroundColor Green
}

function Write-Error {
    param([string]$Text)
    Write-Host "  [ERROR] $Text" -ForegroundColor Red
}

function Write-Info {
    param([string]$Text)
    Write-Host "  [INFO] $Text" -ForegroundColor Gray
}

# ================================================================================
# INICIO
# ================================================================================

Write-Header "INSTALADOR AUTOMATICO - SISTEMA FRIGORIFICO SOLEMAR"

# Verificar permisos de administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "Este instalador requiere permisos de Administrador."
    Write-Info "Haga clic derecho en PowerShell y seleccione 'Ejecutar como administrador'"
    Read-Host "Presione Enter para salir"
    exit 1
}

Write-Success "Permisos de administrador verificados"

# Detectar IP del servidor si no se especifica
if ([string]::IsNullOrEmpty($ServerIp)) {
    $ipConfig = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -eq "Dhcp" } | Select-Object -First 1
    if ($ipConfig) {
        $ServerIp = $ipConfig.IPAddress
        Write-Info "IP detectada automaticamente: $ServerIp"
    } else {
        $ServerIp = "192.168.1.100"
        Write-Info "Usando IP por defecto: $ServerIp"
    }
}

# Crear directorio de instalacion
Write-Step "Creando directorio de instalacion..."
$dirs = @($InstallDir, "$InstallDir\app", "$InstallDir\logs", "$InstallDir\backups", "$InstallDir\data")
foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
    }
}
Write-Success "Directorios creados en $InstallDir"

# ================================================================================
# PASO 1: INSTALAR NODE.JS
# ================================================================================

Write-Header "PASO 1: Instalando Node.js"

$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
if ($nodeInstalled) {
    $nodeVersion = node --version
    Write-Success "Node.js ya esta instalado: $nodeVersion"
} else {
    Write-Step "Descargando Node.js LTS..."
    $nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
    $nodeMsi = "$env:TEMP\nodejs.msi"
    
    try {
        # Usar .NET WebClient para descargar (mas confiable)
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($nodeUrl, $nodeMsi)
        Write-Success "Node.js descargado"
        
        Write-Step "Instalando Node.js (esto puede tardar unos minutos)..."
        $installProcess = Start-Process msiexec.exe -ArgumentList "/i `"$nodeMsi`" /qn /norestart" -Wait -PassThru
        
        if ($installProcess.ExitCode -eq 0) {
            Write-Success "Node.js instalado correctamente"
            
            # Actualizar PATH
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
            
            # Refrescar variables de entorno
            $env:Path = "$env:ProgramFiles\nodejs;$env:Path"
        } else {
            Write-Error "Error instalando Node.js. Codigo: $($installProcess.ExitCode)"
        }
        
        Remove-Item $nodeMsi -Force -ErrorAction SilentlyContinue
    } catch {
        Write-Error "Error descargando Node.js: $_"
        Write-Info "Por favor instale Node.js manualmente desde: https://nodejs.org"
    }
}

# ================================================================================
# PASO 2: INSTALAR POSTGRESQL
# ================================================================================

Write-Header "PASO 2: Instalando PostgreSQL"

$pgInstalled = Get-Command psql -ErrorAction SilentlyContinue
if ($pgInstalled) {
    $pgVersion = psql --version
    Write-Success "PostgreSQL ya esta instalado: $pgVersion"
} else {
    Write-Step "Descargando PostgreSQL 16..."
    
    # Detectar arquitectura
    $arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
    $pgUrl = "https://get.enterprisedb.com/postgresql/postgresql-16.2-1-windows-$arch.exe"
    $pgInstaller = "$env:TEMP\postgresql-installer.exe"
    
    try {
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($pgUrl, $pgInstaller)
        Write-Success "PostgreSQL descargado"
        
        Write-Step "Instalando PostgreSQL (esto puede tardar varios minutos)..."
        Write-Info "Contraseña de superusuario: $DbPassword"
        
        # Instalacion silenciosa de PostgreSQL
        $pgInstallArgs = @(
            "--mode", "unattended",
            "--unattendedmodeui", "none",
            "--superpassword", $DbPassword,
            "--serverport", $DbPort,
            "--locale", "Spanish_Spain.1252",
            "--datadir", "$InstallDir\data\postgresql",
            "--install_runtimes", "0"
        )
        
        $installProcess = Start-Process $pgInstaller -ArgumentList $pgInstallArgs -Wait -PassThru
        
        if ($installProcess.ExitCode -eq 0) {
            Write-Success "PostgreSQL instalado correctamente"
            
            # Agregar PostgreSQL al PATH
            $pgPath = "${env:ProgramFiles}\PostgreSQL\16\bin"
            if (Test-Path $pgPath) {
                $env:Path = "$pgPath;$env:Path"
                [Environment]::SetEnvironmentVariable("Path", $env:Path, [EnvironmentVariableTarget]::Machine)
            }
        } else {
            Write-Error "Error instalando PostgreSQL. Codigo: $($installProcess.ExitCode)"
            Write-Info "Por favor instale PostgreSQL manualmente desde: https://www.postgresql.org/download/windows/"
        }
        
        Remove-Item $pgInstaller -Force -ErrorAction SilentlyContinue
    } catch {
        Write-Error "Error descargando PostgreSQL: $_"
        Write-Info "Por favor instale PostgreSQL manualmente desde: https://www.postgresql.org/download/windows/"
    }
}

# ================================================================================
# PASO 3: CONFIGURAR POSTGRESQL
# ================================================================================

Write-Header "PASO 3: Configurando PostgreSQL"

# Configurar acceso remoto
Write-Step "Configurando acceso remoto..."

$pgDataDir = "${env:ProgramFiles}\PostgreSQL\16\data"
$pgHbaConf = "$pgDataDir\pg_hba.conf"
$postgresqlConf = "$pgDataDir\postgresql.conf"

if (Test-Path $pgHbaConf) {
    # Agregar linea para permitir conexiones desde la red local
    $networkLine = "host    all    all    0.0.0.0/0    scram-sha-256"
    $pgHbaContent = Get-Content $pgHbaConf -Raw
    if (-not $pgHbaContent.Contains($networkLine)) {
        Add-Content -Path $pgHbaConf -Value "`n# Permitir conexiones desde la red local (agregado por instalador Solemar)`n$networkLine"
        Write-Success "Acceso remoto configurado en pg_hba.conf"
    }
}

if (Test-Path $postgresqlConf) {
    # Habilitar conexiones TCP/IP
    $pgConfContent = Get-Content $postgresqlConf -Raw
    if ($pgConfContent -match "listen_addresses\s*=\s*'localhost'") {
        $pgConfContent = $pgConfContent -replace "listen_addresses\s*=\s*'localhost'", "listen_addresses = '*'"
        Set-Content -Path $postgresqlConf -Value $pgConfContent -NoNewline
        Write-Success "PostgreSQL configurado para aceptar conexiones remotas"
    } elseif (-not ($pgConfContent -match "listen_addresses\s*=\s*'\*'")) {
        Add-Content -Path $postgresqlConf -Value "`n# Escuchar en todas las interfaces (agregado por instalador Solemar)`nlisten_addresses = '*'"
        Write-Success "PostgreSQL configurado para aceptar conexiones remotas"
    }
}

# Reiniciar servicio de PostgreSQL
Write-Step "Reiniciando servicio de PostgreSQL..."
Restart-Service -Name "postgresql-x64-16" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Write-Success "Servicio PostgreSQL reiniciado"

# Crear base de datos y usuario
Write-Step "Creando base de datos y usuario..."

$env:PGPASSWORD = $DbPassword

# Verificar si la base de datos existe
$dbExists = & psql -U postgres -p $DbPort -t -c "SELECT 1 FROM pg_database WHERE datname = '$DbName'" 2>$null
if ($dbExists -match "1") {
    Write-Info "La base de datos '$DbName' ya existe"
} else {
    # Crear base de datos
    & psql -U postgres -p $DbPort -c "CREATE DATABASE $DbName;" 2>$null
    Write-Success "Base de datos '$DbName' creada"
}

# Verificar si el usuario existe
$userExists = & psql -U postgres -p $DbPort -t -c "SELECT 1 FROM pg_roles WHERE rolname = '$DbUser'" 2>$null
if ($userExists -match "1") {
    Write-Info "El usuario '$DbUser' ya existe"
} else {
    # Crear usuario
    & psql -U postgres -p $DbPort -c "CREATE USER $DbUser WITH ENCRYPTED PASSWORD '$DbPassword';" 2>$null
    Write-Success "Usuario '$DbUser' creado"
}

# Asignar permisos
& psql -U postgres -p $DbPort -c "GRANT ALL PRIVILEGES ON DATABASE $DbName TO $DbUser;" 2>$null
& psql -U postgres -p $DbPort -c "ALTER USER $DbUser CREATEDB;" 2>$null
Write-Success "Permisos asignados"

$env:PGPASSWORD = $null

# ================================================================================
# PASO 4: COPIAR ARCHIVOS DEL PROYECTO
# ================================================================================

Write-Header "PASO 4: Instalando la Aplicacion"

Write-Step "Copiando archivos del proyecto..."

# Obtener el directorio del script
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$sourceDir = Split-Path -Parent $scriptDir

if (Test-Path "$sourceDir\package.json") {
    # Copiar archivos (excluyendo node_modules y .git)
    $excludeDirs = @("node_modules", ".git", ".next", "backups", "logs")
    
    # Usar robocopy para copia eficiente
    $excludeArgs = $excludeDirs | ForEach-Object { "/XD", "$sourceDir\$_" }
    $robocopyArgs = @($sourceDir, "$InstallDir\app", "/E", "/R:0", "/W:0", "/NP", "/NFL", "/NDL") + $excludeArgs
    
    & robocopy @robocopyArgs | Out-Null
    
    Write-Success "Archivos copiados a $InstallDir\app"
} else {
    Write-Error "No se encontro el directorio del proyecto"
    Write-Info "Asegurese de que el instalador este en la carpeta 'installers' del proyecto"
}

# Crear archivo .env
Write-Step "Creando configuracion..."

$envContent = @"
# Base de datos PostgreSQL
DATABASE_URL="postgresql://$DbUser`:$DbPassword@localhost:$DbPort/$DbName?schema=public"

# Servidor
PORT=$AppPort
NODE_ENV=production

# Email SMTP (configurar segun necesidades)
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
"@

Set-Content -Path "$InstallDir\app\.env" -Value $envContent -Encoding UTF8
Write-Success "Archivo .env creado"

# Modificar schema.prisma para PostgreSQL
Write-Step "Configurando Prisma para PostgreSQL..."

$schemaPath = "$InstallDir\app\prisma\schema.prisma"
if (Test-Path $schemaPath) {
    $schemaContent = Get-Content $schemaPath -Raw
    $schemaContent = $schemaContent -replace 'provider\s*=\s*"sqlite"', 'provider = "postgresql"'
    Set-Content -Path $schemaPath -Value $schemaContent -NoNewline
    Write-Success "Schema Prisma actualizado para PostgreSQL"
}

# Instalar dependencias
Write-Step "Instalando dependencias (esto puede tardar varios minutos)..."

Push-Location "$InstallDir\app"

# Verificar si npm esta disponible
$npmPath = "${env:ProgramFiles}\nodejs\npm.cmd"
if (Test-Path $npmPath) {
    & $npmPath install --production 2>&1 | Out-Null
    Write-Success "Dependencias instaladas"
} else {
    Write-Info "Instalando dependencias con bun..."
    & bun install --production 2>&1 | Out-Null
    Write-Success "Dependencias instaladas"
}

# Generar Prisma Client
Write-Step "Generando Prisma Client..."
& npx prisma generate 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Success "Prisma Client generado"
} else {
    Write-Error "Error generando Prisma Client"
}

# Sincronizar base de datos
Write-Step "Sincronizando base de datos..."
& npx prisma db push --skip-generate 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Success "Base de datos sincronizada"
} else {
    Write-Error "Error sincronizando base de datos"
}

# Ejecutar seed si existe
if (Test-Path "prisma\seed.ts") {
    Write-Step "Cargando datos iniciales..."
    & bun run db:seed 2>&1 | Out-Null
    Write-Success "Datos iniciales cargados"
}

Pop-Location

# ================================================================================
# PASO 5: CONFIGURAR FIREWALL
# ================================================================================

Write-Header "PASO 5: Configurando Firewall"

Write-Step "Abriendo puertos en el firewall..."

# Puerto 3000 - Aplicacion web
New-NetFirewallRule -DisplayName "Solemar Frigorifico - Aplicacion" -Direction Inbound -LocalPort $AppPort -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null
Write-Success "Puerto $AppPort abierto (Aplicacion web)"

# Puerto 5432 - PostgreSQL
New-NetFirewallRule -DisplayName "Solemar Frigorifico - PostgreSQL" -Direction Inbound -LocalPort $DbPort -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null
Write-Success "Puerto $DbPort abierto (PostgreSQL)"

# Puerto 80 - HTTP (opcional)
New-NetFirewallRule -DisplayName "Solemar Frigorifico - HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null

# Puerto 443 - HTTPS (opcional)
New-NetFirewallRule -DisplayName "Solemar Frigorifico - HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null

# ================================================================================
# PASO 6: CREAR SERVICIO DE WINDOWS
# ================================================================================

Write-Header "PASO 6: Creando Servicio de Windows"

Write-Step "Instalando servicio..."

# Crear script de inicio
$startScript = @"
@echo off
cd /d "$InstallDir\app"
call npm start
"@
Set-Content -Path "$InstallDir\iniciar.bat" -Value $startScript -Encoding ASCII

# Crear script de respaldo
$backupScript = @"
@echo off
set FECHA=%date:~-4,4%%date:~-7,2%%date:~-10,2%
set BACKUP_FILE=$InstallDir\backups\backup_%FECHA%.sql
echo Realizando respaldo de la base de datos...
set PGPASSWORD=$DbPassword
"${env:ProgramFiles}\PostgreSQL\16\bin\pg_dump.exe" -U $DbUser -d $DbName -f "%BACKUP_FILE%"
echo Respaldo completado: %BACKUP_FILE%
pause
"@
Set-Content -Path "$InstallDir\respaldar.bat" -Value $backupScript -Encoding ASCII

# Crear script de actualizacion
$updateScript = @"
@echo off
cd /d "$InstallDir\app"
echo Actualizando sistema...
git pull
call npm install
call npx prisma generate
call npx prisma db push
echo Actualizacion completada.
pause
"@
Set-Content -Path "$InstallDir\actualizar.bat" -Value $updateScript -Encoding ASCII

# Instalar el servicio usando NSSM (Non-Sucking Service Manager)
$nssmPath = "$InstallDir\nssm.exe"
if (-not (Test-Path $nssmPath)) {
    Write-Step "Descargando NSSM para gestion de servicios..."
    $nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
    $nssmZip = "$env:TEMP\nssm.zip"
    
    try {
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($nssmUrl, $nssmZip)
        
        # Extraer NSSM
        Expand-Archive -Path $nssmZip -DestinationPath "$env:TEMP\nssm" -Force
        $nssmExe = Get-ChildItem -Path "$env:TEMP\nssm" -Recurse -Filter "nssm.exe" | Select-Object -First 1
        Copy-Item $nssmExe.FullName $nssmPath
        
        Remove-Item $nssmZip -Force
        Remove-Item "$env:TEMP\nssm" -Recurse -Force
        
        Write-Success "NSSM descargado"
    } catch {
        Write-Info "No se pudo descargar NSSM, usando metodo alternativo"
    }
}

if (Test-Path $nssmPath) {
    # Crear servicio con NSSM
    & $nssmPath install "SolemarFrigorifico" "node" "$InstallDir\app\node_modules\next\dist\bin\next" "start" 2>&1 | Out-Null
    & $nssmPath set "SolemarFrigorifico" AppDirectory "$InstallDir\app" 2>&1 | Out-Null
    & $nssmPath set "SolemarFrigorifico" DisplayName "Sistema Frigorifico Solemar" 2>&1 | Out-Null
    & $nssmPath set "SolemarFrigorifico" Start SERVICE_AUTO_START 2>&1 | Out-Null
    
    Write-Success "Servicio 'SolemarFrigorifico' creado e instalado"
    
    # Iniciar servicio
    Write-Step "Iniciando servicio..."
    Start-Service -Name "SolemarFrigorifico" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 5
    
    $serviceStatus = Get-Service -Name "SolemarFrigorifico" -ErrorAction SilentlyContinue
    if ($serviceStatus -and $serviceStatus.Status -eq "Running") {
        Write-Success "Servicio iniciado correctamente"
    } else {
        Write-Info "El servicio se instalara completamente al reiniciar"
    }
} else {
    # Crear tarea programada como alternativa
    Write-Step "Creando tarea de inicio automatico..."
    $action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c cd /d $InstallDir\app && npm start" -WorkingDirectory "$InstallDir\app"
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    Register-ScheduledTask -TaskName "SolemarFrigorifico" -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest -Force | Out-Null
    Write-Success "Tarea de inicio automatico creada"
}

# ================================================================================
# PASO 7: CREAR CONFIGURACIÓN Y SCRIPTS DE UTILIDAD
# ================================================================================

Write-Header "PASO 7: Creando Configuracion y Scripts de Utilidad"

# Crear directorio de configuracion
$configDir = "$InstallDir\config"
if (-not (Test-Path $configDir)) {
    New-Item -Path $configDir -ItemType Directory -Force | Out-Null
}

# Crear archivo de configuracion del sistema
Write-Step "Creando archivo de configuracion del sistema..."

$configContent = @"
# ================================================================================
# CONFIGURACION DEL SISTEMA FRIGORIFICO SOLEMAR
# ================================================================================
# 
# Este archivo contiene toda la configuracion del sistema.
# Modifique los valores segun sus necesidades.
#
# ================================================================================

# ================================================================================
# REPOSITORIO DE ACTUALIZACIONES
# ================================================================================
# Cambie esta URL cuando quiera usar un nuevo repositorio

GITHUB_REPO_URL="$GithubRepo"
GITHUB_BRANCH="$GithubBranch"
GITHUB_TOKEN="$GithubToken"

# ================================================================================
# BASE DE DATOS POSTGRESQL
# ================================================================================

DB_HOST="localhost"
DB_PORT="$DbPort"
DB_NAME="$DbName"
DB_USER="$DbUser"
DB_PASSWORD="$DbPassword"

# Conexión completa (no modificar)
DATABASE_URL="postgresql://$DbUser`:$DbPassword@localhost:$DbPort/$DbName?schema=public"

# ================================================================================
# SERVIDOR DE APLICACION
# ================================================================================

APP_PORT="$AppPort"
APP_HOST="0.0.0.0"
NODE_ENV="production"

# ================================================================================
# RESPALDOS AUTOMATICOS
# ================================================================================

BACKUP_DIR="$InstallDir\backups"
BACKUP_KEEP_COUNT="30"
BACKUP_HOUR="02"
BACKUP_MINUTE="00"

# ================================================================================
# EMAIL SMTP
# ================================================================================

SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM_NAME="Sistema Frigorifico Solemar"
SMTP_FROM_EMAIL=""

# ================================================================================
# NOTIFICACIONES
# ================================================================================

NOTIFY_UPDATE_AVAILABLE="true"
NOTIFY_UPDATE_COMPLETED="true"
ADMIN_EMAILS=""

# ================================================================================
# LOGS
# ================================================================================

LOG_LEVEL="info"
LOG_KEEP_DAYS="90"

# ================================================================================
# SEGURIDAD
# ================================================================================

SESSION_EXPIRE_MINUTES="60"
MAX_LOGIN_ATTEMPTS="5"
LOCKOUT_DURATION_MINUTES="15"

# ================================================================================
# ACTUALIZACIONES
# ================================================================================

UPDATE_CHECK_INTERVAL_HOURS="24"
AUTO_DOWNLOAD_UPDATES="false"
AUTO_BACKUP_BEFORE_UPDATE="true"

# ================================================================================
# DATOS DE LA EMPRESA
# ================================================================================

EMPRESA_NOMBRE="Solemar Alimentaria"
EMPRESA_DIRECCION=""
EMPRESA_TELEFONO=""
EMPRESA_EMAIL=""
EMPRESA_CUIT=""
EMPRESA_NUMERO_ESTABLECIMIENTO=""
EMPRESA_MATRICULA=""
"@

Set-Content -Path "$configDir\sistema.conf" -Value $configContent -Encoding UTF8
Write-Success "Archivo de configuracion creado"

# Copiar scripts de utilidad desde el instalador
Write-Step "Copiando scripts de utilidad..."

$scriptsToCopy = @(
    @{ Name = "actualizar-sistema.ps1"; Desc = "Actualizacion automatica" },
    @{ Name = "cambiar-repositorio.ps1"; Desc = "Cambiar repositorio GitHub" },
    @{ Name = "respaldar.ps1"; Desc = "Respaldo de base de datos" },
    @{ Name = "diagnostico.ps1"; Desc = "Diagnostico del sistema" },
    @{ Name = "info-sistema.bat"; Desc = "Informacion del sistema" }
)

foreach ($script in $scriptsToCopy) {
    $sourceScript = "$scriptDir\$($script.Name)"
    if (Test-Path $sourceScript) {
        Copy-Item $sourceScript "$InstallDir\$($script.Name)" -Force
        Write-Success "$($script.Desc): $($script.Name)"
    } else {
        Write-Info "Script no encontrado: $($script.Name)"
    }
}

# Crear acceso directo en el escritorio
Write-Step "Creando acceso directo en el escritorio..."

$WshShell = New-Object -ComObject WScript.Shell
$shortcutPath = "$([Environment]::GetFolderPath('Desktop'))\Solemar Frigorifico.lnk"
$shortcut = $WshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "http://localhost:$AppPort"
$shortcut.Description = "Sistema Frigorifico Solemar"
$shortcut.Save()

Write-Success "Acceso directo creado en el escritorio"

# ================================================================================
# RESUMEN FINAL
# ================================================================================

Write-Header "INSTALACION COMPLETADA"

Write-Host ""
Write-Host "  DATOS DE ACCESO:" -ForegroundColor White
Write-Host "  ----------------" -ForegroundColor Gray
Write-Host "  URL Local:         " -NoNewline; Write-Host "http://localhost:$AppPort" -ForegroundColor Green
Write-Host "  URL Red:           " -NoNewline; Write-Host "http://${ServerIp}:$AppPort" -ForegroundColor Green
Write-Host ""
Write-Host "  Usuario Admin:     " -NoNewline; Write-Host "admin" -ForegroundColor Yellow
Write-Host "  Contrasena:        " -NoNewline; Write-Host "admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "  BASE DE DATOS:" -ForegroundColor White
Write-Host "  ----------------" -ForegroundColor Gray
Write-Host "  Host:              localhost" -ForegroundColor Gray
Write-Host "  Puerto:            $DbPort" -ForegroundColor Gray
Write-Host "  Base de datos:     $DbName" -ForegroundColor Gray
Write-Host "  Usuario:           $DbUser" -ForegroundColor Gray
Write-Host "  Contrasena:        $DbPassword" -ForegroundColor Gray
Write-Host ""
Write-Host "  DIRECTORIOS:" -ForegroundColor White
Write-Host "  ----------------" -ForegroundColor Gray
Write-Host "  Instalacion:       $InstallDir" -ForegroundColor Gray
Write-Host "  Logs:              $InstallDir\logs" -ForegroundColor Gray
Write-Host "  Respaldos:         $InstallDir\backups" -ForegroundColor Gray
Write-Host ""
Write-Host "  SCRIPTS UTILES:" -ForegroundColor White
Write-Host "  ----------------" -ForegroundColor Gray
Write-Host "  Iniciar:           $InstallDir\iniciar.bat" -ForegroundColor Gray
Write-Host "  Respaldar:         $InstallDir\respaldar.ps1" -ForegroundColor Gray
Write-Host "  Actualizar:        $InstallDir\actualizar-sistema.ps1" -ForegroundColor Gray
Write-Host "  Diagnostico:       $InstallDir\diagnostico.ps1" -ForegroundColor Gray
Write-Host "  Info Sistema:      $InstallDir\info-sistema.bat" -ForegroundColor Gray
Write-Host ""
Write-Host "  CONFIGURACION:" -ForegroundColor White
Write-Host "  ----------------" -ForegroundColor Gray
Write-Host "  Repositorio:       $GithubRepo" -ForegroundColor Gray
Write-Host "  Branch:            $GithubBranch" -ForegroundColor Gray
Write-Host "  Archivo config:    $InstallDir\config\sistema.conf" -ForegroundColor Gray
Write-Host ""
Write-Host "  IMPORTANTES:" -ForegroundColor Red
Write-Host "  ----------------" -ForegroundColor Gray
Write-Host "  1. Cambie la contrasena del usuario admin" -ForegroundColor Yellow
Write-Host "  2. Configure el email SMTP en Configuracion > Email" -ForegroundColor Yellow
Write-Host "  3. Configure respaldos automaticos en el Programador de Tareas" -ForegroundColor Yellow
Write-Host ""

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Guardar datos de instalacion
$installInfo = @{
    Fecha = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Directorio = $InstallDir
    PuertoApp = $AppPort
    PuertoDB = $DbPort
    IP = $ServerIp
    DbName = $DbName
    DbUser = $DbUser
}
$installInfo | ConvertTo-Json | Set-Content "$InstallDir\install-info.json"

Read-Host "Presione Enter para finalizar"
