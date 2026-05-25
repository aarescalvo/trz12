#!/bin/bash
# ========================================
# BACKUP DIARIO DE BASE DE DATOS
# Frigorifico Sistema - v0.7.2
# ========================================

# Configuración
PROJECT_DIR="/home/z/my-project"
DB_FILE="$PROJECT_DIR/db/custom.db"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H%M)
BACKUP_FILE="$BACKUP_DIR/backup-$DATE-$TIME.db"
MAX_BACKUPS=90  # Mantener 90 días de backups

# Crear directorio si no existe
mkdir -p "$BACKUP_DIR"

# Verificar que la BD existe
if [ ! -f "$DB_FILE" ]; then
    echo "❌ Error: No se encuentra la base de datos en $DB_FILE"
    exit 1
fi

# Crear backup
echo "📦 Creando backup de base de datos..."
cp "$DB_FILE" "$BACKUP_FILE"

# Verificar backup
if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup creado: $BACKUP_FILE ($SIZE)"
else
    echo "❌ Error: No se pudo crear el backup"
    exit 1
fi

# Limpiar backups antiguos (mantener últimos 90)
echo "🧹 Limpiando backups antiguos..."
cd "$BACKUP_DIR"
ls -t backup-*.db | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm
echo "✅ Backups antiguos eliminados (manteniendo últimos $MAX_BACKUPS)"

# Listar backups actuales
echo ""
echo "📋 Backups disponibles:"
ls -lh backup-*.db | tail -5

# Registrar en log
echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup creado: $BACKUP_FILE" >> "$BACKUP_DIR/backup.log"

echo ""
echo "🎯 Backup completado exitosamente"
