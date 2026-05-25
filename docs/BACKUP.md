# Guía de Backup y Restauración

## Sistema de Backup Automático

El sistema realiza backups automáticos de la base de datos SQLite.

### Configuración

- **Frecuencia:** Diario
- **Ubicación:** `/backups/`
- **Retención:** 90 días
- **Formato:** `backup-YYYY-MM-DD-HHMM.db`

---

## Backup Manual

### Opción 1: Script
```bash
./scripts/backup-db.sh
```

### Opción 2: Manual
```bash
# Crear backup
cp db/custom.db backups/backup-$(date +%Y-%m-%d).db

# Verificar
ls -lh backups/
```

---

## Restauración

### Restaurar desde Backup

```bash
# 1. Detener el servidor
# Ctrl+C o matar proceso

# 2. Identificar backup a restaurar
ls -lh backups/

# 3. Restaurar
cp backups/backup-2024-01-15-0800.db db/custom.db

# 4. Reiniciar servidor
bun run dev
```

### Restauración de Emergencia

Si se corrompió la base de datos actual:

```bash
# Verificar integridad del backup antes de restaurar
sqlite3 backups/backup-2024-01-15.db "PRAGMA integrity_check;"

# Si está OK, restaurar
cp backups/backup-2024-01-15.db db/custom.db
```

---

## Backup en GitHub (Releases)

Cada versión estable se guarda en GitHub con:

```
releases/
├── v0.7.0/
│   ├── programa/          # Código fuente completo
│   ├── instructivos/      # Manuales
│   ├── install.sh         # Instalador
│   └── RELEASE-INFO.md    # Info del release
├── v0.7.0.tar.gz          # Archivo comprimido
└── v0.7.0.tar.gz.sha256   # Checksum
```

### Crear un Release

```bash
# Actualizar versión en package.json primero
# Luego ejecutar:
./scripts/create-release.sh
```

### Subir Release a GitHub

```bash
# Crear tag
git tag -a v0.7.0 -m "Release v0.7.0 - Despacho y Facturación"
git push origin v0.7.0

# Ir a GitHub > Releases > Draft new release
# Seleccionar el tag y subir el archivo .tar.gz
```

---

## Verificar Backups

### Script de Verificación
```bash
#!/bin/bash
# Verificar últimos 5 backups

for backup in $(ls -t backups/backup-*.db | head -5); do
    echo "Verificando: $backup"
    sqlite3 "$backup" "PRAGMA integrity_check;" || echo "❌ Error en $backup"
done
```

### Verificar Tamaño
```bash
# Los backups deben tener tamaño similar
ls -lh backups/backup-*.db | tail -10
```

---

## Cronograma de Backups

| Tipo | Frecuencia | Retención |
|------|------------|-----------|
| Automático | Diario | 90 días |
| Release | Por versión | Permanente en GitHub |
| Manual | Cuando se necesite | Indefinido |

---

## Configurar Backup Automático (Linux)

### Con Cron
```bash
# Editar crontab
crontab -e

# Agregar línea para backup diario a las 2:00 AM
0 2 * * * /home/usuario/frigorifico/scripts/backup-db.sh >> /home/usuario/frigorifico/backups/cron.log 2>&1
```

### Con Systemd Timer
Crear `/etc/systemd/system/frigorifico-backup.service`:
```ini
[Unit]
Description=Backup Frigorífico

[Service]
Type=oneshot
ExecStart=/home/usuario/frigorifico/scripts/backup-db.sh
```

Crear `/etc/systemd/system/frigorifico-backup.timer`:
```ini
[Unit]
Description=Backup diario Frigorífico

[Timer]
OnCalendar=*-*-* 02:00:00

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl enable frigorifico-backup.timer
sudo systemctl start frigorifico-backup.timer
```

---

## Mejores Prácticas

1. ✅ **Verificar backups regularmente**
   ```bash
   sqlite3 backups/backup-*.db "PRAGMA integrity_check;"
   ```

2. ✅ **Copiar backups a ubicación externa** (Google Drive, otro servidor)

3. ✅ **Antes de actualizar el sistema**, hacer backup manual

4. ✅ **Documentar restauraciones** en el worklog

5. ❌ **NUNCA** eliminar backups sin verificar que hay uno más reciente válido

---

## Recuperación de Desastres

### Escenario: Base de datos corrupta
```bash
# 1. Detener servidor
# 2. Verificar backups disponibles
ls -lt backups/

# 3. Restaurar el más reciente
cp backups/backup-$(date +%Y-%m-%d)*.db db/custom.db

# 4. Verificar integridad
sqlite3 db/custom.db "PRAGMA integrity_check;"

# 5. Reiniciar
bun run dev
```

### Escenario: Sistema completo dañado
```bash
# 1. Descargar último release de GitHub
# 2. Descomprimir
tar -xzvf vX.X.X.tar.gz

# 3. Restaurar base de datos desde backup
cp backup-anterior.db vX.X.X/db/custom.db

# 4. Reinstalar
cd vX.X.X
./install.sh
```

---

**Versión documento:** 0.7.2  
**Última actualización:** Enero 2024
