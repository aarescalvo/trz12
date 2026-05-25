# TrazaSole - Guia de Actualizacion

## Version Actual: 3.7.15 (ESTABLE)

---

## Comandos PowerShell para Actualizar

### Opcion 1: Actualizacion Rapida (Produccion)
```powershell
# Detener servidor
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "bun" -Force -ErrorAction SilentlyContinue

# Ir al directorio
cd C:\TrazaSole

# Descargar actualizaciones
git fetch origin
git reset --hard origin/master

# Instalar dependencias (solo si cambiaron)
bun install

# Iniciar servidor
Start-Process -FilePath "bun" -ArgumentList "run", "dev" -WindowStyle Minimized
```

### Opcion 2: Script de Actualizacion Completo
```powershell
# Ejecutar todo en uno
cd C:\TrazaSole
Stop-Process -Name "node","bun" -Force -ErrorAction SilentlyContinue
git fetch origin && git reset --hard origin/master
bun install
Start-Process bun -ArgumentList "run","dev" -WindowStyle Minimized
Write-Host "Sistema actualizado a v3.7.15" -ForegroundColor Green
```

### Opcion 3: Usando los .bat
```powershell
# Detener, actualizar e iniciar
cd C:\TrazaSole\pc-produccion
.\2-detener-server.bat
.\5-actualizar-repositorio.bat
.\1-iniciar-server.bat
```

---

## Repositorios

| Repositorio | URL | Uso |
|-------------|-----|-----|
| **desarrollo1** | github.com/aarescalvo/desarrollo1 | Desarrollo y pruebas |
| **produccion1** | github.com/aarescalvo/produccion1 | Servidor produccion |

Ambos estan sincronizados en **v3.7.15**

---

## Cambiar Repositorio (si es necesario)
```powershell
cd C:\TrazaSole
git remote set-url origin https://github.com/aarescalvo/produccion1.git
# o
git remote set-url origin https://github.com/aarescalvo/desarrollo1.git
git fetch origin
git reset --hard origin/master
```

---

## Scripts de Backup Disponibles

| Script | Funcion | Ubicacion |
|--------|---------|-----------|
| `backup-sistema.bat` | Backup completo del sistema | Raiz |
| `backup-database.bat` | Backup de base de datos | Raiz |
| `pc-produccion\8-backup-sistema.bat` | Backup sistema | pc-produccion |
| `pc-produccion\9-backup-base-datos.bat` | Backup DB | pc-produccion |

Todos mantienen los **ultimos 50 backups** automaticamente.
