# TrazaSole - Scripts de Produccion

## Scripts Disponibles

| # | Script | Funcion |
|---|--------|---------|
| 1 | `1-iniciar-server.bat` | Inicia el servidor |
| 2 | `2-detener-server.bat` | Detiene el servidor |
| 3 | `3-iniciar-segundo-plano.bat` | Inicia en background |
| 4 | `4-detener-segundo-plano.bat` | Detiene el background |
| 5 | `5-actualizar-repositorio.bat` | Actualiza de GitHub |
| 6 | `6-actualizar-iniciar.bat` | Actualiza e inicia |
| 7 | `7-detener-actualizar-iniciar.bat` | Reinicio completo |
| 8 | `8-backup-sistema.bat` | Backup sistema (50 versiones) |
| 9 | `9-backup-base-datos.bat` | Backup BD (50 versiones) |
| 10 | `10-restaurar-sistema.bat` | Restaurar sistema |
| 11 | `11-restaurar-base-datos.bat` | Restaurar BD |

## Uso Comun

**Iniciar servidor:** `1-iniciar-server.bat`

**Actualizar sistema:** `7-detener-actualizar-iniciar.bat`

**Backup antes de cambios:** `8-backup-sistema.bat` y `9-backup-base-datos.bat`

**Restaurar si falla:** `10-restaurar-sistema.bat` y `11-restaurar-base-datos.bat`

## Ubicacion de Backups

- `backups\sistema\` - Backups del sistema
- `backups\database\` - Backups de base de datos
