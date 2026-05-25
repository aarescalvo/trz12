<#
.SYNOPSIS
    Instalador automatico de Printer Bridge v2.0 - Solemar Alimentaria
    Se ejecuta en PowerShell. No necesita CMD ni npm install.
.DESCRIPTION
    - Verifica Node.js
    - Descarga archivos desde GitHub
    - Detecta impresoras
    - Crea configuracion
    - Abre puertos del firewall
#>

$ErrorActionPreference = "Stop"
$InstallDir = "C:\SolemarAlimentaria\printer-bridge"
$RepoUrl = "https://raw.githubusercontent.com/aarescalvo/trz7/master/mini-services/printer-bridge"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  PRINTER BRIDGE v2.0 - Solemar Alimentaria" -ForegroundColor Cyan
Write-Host "  Instalador automatico" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# ---- Paso 1: Verificar Node.js ----
Write-Host "[1/7] Verificando Node.js..." -ForegroundColor Yellow

try {
    $nodeVersion = & node --version 2>&1
    Write-Host "  OK: Node.js $nodeVersion encontrado" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "  ERROR: Node.js no esta instalado." -ForegroundColor Red
    Write-Host ""
    Write-Host "  1. Abri el navegador y anda a: https://nodejs.org/" -ForegroundColor White
    Write-Host "  2. Descarga la version LTS (boton grande verde)" -ForegroundColor White
    Write-Host "  3. Ejecuta el instalador (Siguiente, Siguiente, Instalar)" -ForegroundColor White
    Write-Host "  4. Cuando termine, volve a ejecutar este script" -ForegroundColor White
    Write-Host ""
    Write-Host "Presiona Enter para salir..."
    Read-Host
    exit 1
}

# ---- Paso 2: Crear carpetas ----
Write-Host "[2/7] Creando carpetas..." -ForegroundColor Yellow

if (-not (Test-Path "C:\SolemarAlimentaria")) {
    New-Item -ItemType Directory -Path "C:\SolemarAlimentaria" -Force | Out-Null
}

if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

if (-not (Test-Path "$InstallDir\temp")) {
    New-Item -ItemType Directory -Path "$InstallDir\temp" -Force | Out-Null
}

Write-Host "  OK: Carpeta $InstallDir lista" -ForegroundColor Green

# ---- Paso 3: Descargar archivos ----
Write-Host "[3/7] Descargando archivos desde GitHub..." -ForegroundColor Yellow

$files = @(
    "index.js",
    "print-helper.ps1",
    "start.bat"
)

foreach ($file in $files) {
    $url = "$RepoUrl/$file"
    $dest = "$InstallDir\$file"

    try {
        Write-Host "  Descargando $file..." -NoNewline
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
        Write-Host " OK" -ForegroundColor Green
    } catch {
        Write-Host " ERROR" -ForegroundColor Red
        Write-Host "  No se pudo descargar $file desde GitHub" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Presiona Enter para salir..."
        Read-Host
        exit 1
    }
}

# ---- Paso 4: Detectar impresoras ----
Write-Host "[4/7] Detectando impresoras..." -ForegroundColor Yellow
Write-Host ""

try {
    $printers = Get-Printer | Select-Object Name, PortName, DriverName | Format-Table -AutoSize
    $printers
    $printerList = (Get-Printer).Name
} catch {
    Write-Host "  ERROR: No se pudieron detectar impresoras" -ForegroundColor Red
    Write-Host "  $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Presiona Enter para salir..."
    Read-Host
    exit 1
}

Write-Host ""

# ---- Paso 5: Seleccionar impresora ----
Write-Host "[5/7] Configurar impresora..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Escribi el numero de la impresora que queres usar:" -ForegroundColor White
Write-Host ""

for ($i = 0; $i -lt $printerList.Count; $i++) {
    Write-Host "  [$i] $($printerList[$i])" -ForegroundColor White
}

Write-Host ""
$selection = Read-Host "Numero (0-$($printerList.Count - 1))"

if ($selection -match '^\d+$' -and [int]$selection -ge 0 -and [int]$selection -lt $printerList.Count) {
    $selectedPrinter = $printerList[[int]$selection]
} else {
    Write-Host "  Numero invalido. Usando la primera impresora: $($printerList[0])" -ForegroundColor Red
    $selectedPrinter = $printerList[0]
}

Write-Host ""
Write-Host "  Impresora seleccionada: $selectedPrinter" -ForegroundColor Green

# Guardar configuracion
$config = @{
    printerName = $selectedPrinter
    tcpPort     = 9100
    httpPort    = 9101
    logLevel    = "info"
    autoStart   = $true
} | ConvertTo-Json -Compress

Set-Content -Path "$InstallDir\printer-config.json" -Value $config -NoNewline -Encoding ASCII

Write-Host "  OK: Configuracion guardada" -ForegroundColor Green

# ---- Paso 6: Firewall ----
Write-Host "[6/7] Abriendo puertos del firewall..." -ForegroundColor Yellow

try {
    $null = netsh advfirewall firewall add rule name="Printer Bridge TCP 9100" dir=in action=allow protocol=TCP localport=9100 2>&1
    Write-Host "  OK: Puerto 9100 abierto" -ForegroundColor Green

    $null = netsh advfirewall firewall add rule name="Printer Bridge TCP 9101" dir=in action=allow protocol=TCP localport=9101 2>&1
    Write-Host "  OK: Puerto 9101 abierto" -ForegroundColor Green
} catch {
    Write-Host "  ADVERTENCIA: No se pudieron abrir los puertos del firewall" -ForegroundColor Red
    Write-Host "  Ejecuta esto como Administrador para abrirlos:" -ForegroundColor Yellow
    Write-Host '  netsh advfirewall firewall add rule name="Printer Bridge TCP 9100" dir=in action=allow protocol=TCP localport=9100' -ForegroundColor White
    Write-Host '  netsh advfirewall firewall add rule name="Printer Bridge TCP 9101" dir=in action=allow protocol=TCP localport=9101' -ForegroundColor White
}

# ---- Paso 7: Obtener IP y resumen ----
Write-Host "[7/7] Obteniendo IP local..." -ForegroundColor Yellow

$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.*" } | Select-Object -First 1).IPAddress
if (-not $ip) { $ip = "desconocida" }

Write-Host "  IP detectada: $ip" -ForegroundColor Green

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  INSTALACION COMPLETADA" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Impresora:   $selectedPrinter" -ForegroundColor White
Write-Host "  Puerto TCP:  9100 (recibe datos de impresion)" -ForegroundColor White
Write-Host "  Panel Web:   http://$($ip):9101 (configuracion)" -ForegroundColor White
Write-Host "  Archivos:    $InstallDir" -ForegroundColor White
Write-Host ""
Write-Host "  PROXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "  1. Ejecuta: cd $InstallDir ; node index.js" -ForegroundColor White
Write-Host "  2. Abri en el navegador: http://localhost:9101" -ForegroundColor White
Write-Host "  3. Clic en 'Imprimir prueba'" -ForegroundColor White
Write-Host "  4. En el sistema configurar impresora:" -ForegroundColor White
Write-Host "     Puerto: RED | IP: $ip | Puerto TCP: 9100" -ForegroundColor White
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Presiona Enter para iniciar el bridge (o Ctrl+C para salir)..." -ForegroundColor Yellow
Read-Host

cd $InstallDir
node index.js
