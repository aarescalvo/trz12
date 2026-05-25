# ================================================================================
# CAMBIAR REPOSITORIO DE ACTUALIZACIONES
# ================================================================================
# 
# Este script permite cambiar el repositorio de GitHub desde donde se descargan
# las actualizaciones del sistema.
#
# USO:
#   .\cambiar-repositorio.ps1 -Url "https://github.com/usuario/repositorio"
#
# ================================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$Url,
    
    [string]$Branch = "master",
    
    [string]$Token = ""
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$installDir = "C:\SolemarFrigorifico"
$configFile = "$installDir\config\sistema.conf"

Write-Host ""
Write-Host "  CAMBIAR REPOSITORIO DE ACTUALIZACIONES" -ForegroundColor Cyan
Write-Host "  " + "=" * 50 -ForegroundColor Gray
Write-Host ""

# Validar URL
if ($Url -notmatch "^https://github\.com/[\w-]+/[\w.-]+") {
    Write-Host "  [ERROR] URL inválida. Debe ser un repositorio de GitHub." -ForegroundColor Red
    Write-Host "  Ejemplo: https://github.com/usuario/repositorio" -ForegroundColor Gray
    exit 1
}

# Extraer nombre del repositorio
$repoName = $Url -replace "^https://github\.com/", "" -replace "\.git$", ""
Write-Host "  Nuevo repositorio: " -NoNewline
Write-Host $repoName -ForegroundColor Green
Write-Host "  Branch:            " -NoNewline
Write-Host $Branch -ForegroundColor Green
Write-Host ""

# Verificar que el repositorio existe
Write-Host "  [>>] Verificando repositorio..." -ForegroundColor Yellow

try {
    $apiUrl = "https://api.github.com/repos/$repoName"
    $headers = @{
        "Accept" = "application/vnd.github.v3+json"
        "User-Agent" = "Solemar-Updater"
    }
    
    if ($Token) {
        $headers["Authorization"] = "token $Token"
    }
    
    $response = Invoke-RestMethod -Uri $apiUrl -Headers $headers -Method Get -ErrorAction Stop
    
    Write-Host "  [OK] Repositorio encontrado" -ForegroundColor Green
    Write-Host "       Descripción: $($response.description)" -ForegroundColor Gray
    Write-Host "       Última actualización: $($response.pushed_at)" -ForegroundColor Gray
    
} catch {
    Write-Host "  [ERROR] No se puede acceder al repositorio" -ForegroundColor Red
    Write-Host "         Verifique que la URL sea correcta y que el repositorio sea público" -ForegroundColor Gray
    Write-Host "         (o proporcione un token de acceso con -Token)" -ForegroundColor Gray
    exit 1
}

# Verificar que el archivo de configuración existe
if (-not (Test-Path $configFile)) {
    Write-Host "  [ERROR] Archivo de configuración no encontrado: $configFile" -ForegroundColor Red
    Write-Host "         ¿Está el sistema instalado correctamente?" -ForegroundColor Gray
    exit 1
}

# Actualizar configuración
Write-Host ""
Write-Host "  [>>] Actualizando configuración..." -ForegroundColor Yellow

$content = Get-Content $configFile

# Actualizar cada línea
$newContent = $content | ForEach-Object {
    $line = $_
    
    if ($line -match '^GITHUB_REPO_URL=') {
        "GITHUB_REPO_URL=`"$Url`""
    }
    elseif ($line -match '^GITHUB_BRANCH=') {
        "GITHUB_BRANCH=`"$Branch`""
    }
    elseif ($line -match '^GITHUB_TOKEN=' -and $Token) {
        "GITHUB_TOKEN=`"$Token`""
    }
    else {
        $line
    }
}

# Guardar cambios
$newContent | Set-Content $configFile -Encoding UTF8

Write-Host "  [OK] Configuración actualizada" -ForegroundColor Green

# Mostrar resumen
Write-Host ""
Write-Host "  " + "=" * 50 -ForegroundColor Gray
Write-Host "  CAMBIOS REALIZADOS:" -ForegroundColor White
Write-Host "  " + "=" * 50 -ForegroundColor Gray
Write-Host "  Repositorio: $Url" -ForegroundColor Cyan
Write-Host "  Branch:      $Branch" -ForegroundColor Cyan
if ($Token) {
    Write-Host "  Token:       [CONFIGURADO]" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "  Próxima actualización usará el nuevo repositorio." -ForegroundColor Green
Write-Host ""

# Guardar en log
$logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | Repositorio cambiado a $Url (branch: $Branch)"
Add-Content "$installDir\logs\updates.log" $logEntry -ErrorAction SilentlyContinue

Write-Host "  Para actualizar ahora, ejecute: .\actualizar-sistema.ps1" -ForegroundColor Gray
Write-Host ""
