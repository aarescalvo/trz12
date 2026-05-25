#!/bin/bash

# ============================================
# BACKUP SOLEMAR ALIMENTARIA - Google Drive
# ============================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
PROJECT_DIR="/home/z/my-project"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="solemar_backup_$DATE.tar.gz"

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}   BACKUP - SOLEMAR ALIMENTARIA${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}[1/5] Preparando archivos...${NC}"

# Crear archivo temporal con lista de exclusiones
EXCLUDE_FILE=$(mktemp)
cat > "$EXCLUDE_FILE" << EOF
node_modules
.next
.git
backups
*.log
*.db-journal
.env.local
EOF

echo -e "${YELLOW}[2/5] Creando backup comprimido...${NC}"

# Crear el tar.gz
cd "$PROJECT_DIR"
tar -czvf "$BACKUP_DIR/$BACKUP_NAME" \
    --exclude-from="$EXCLUDE_FILE" \
    --transform 's,^,solemar-alimentaria/,' \
    . 2>/dev/null

# Limpiar archivo temporal
rm "$EXCLUDE_FILE"

# Verificar que se creó
if [ -f "$BACKUP_DIR/$BACKUP_NAME" ]; then
    SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)
    echo -e "${GREEN}✓ Backup creado: $BACKUP_NAME${NC}"
    echo -e "${GREEN}✓ Tamaño: $SIZE${NC}"
else
    echo -e "${RED}✗ Error al crear backup${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}[3/5] Limpiando backups antiguos...${NC}"

# Mantener solo los últimos 5 backups
cd "$BACKUP_DIR"
ls -t solemar_backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm --
echo -e "${GREEN}✓ Backups antiguos eliminados${NC}"

echo ""
echo -e "${YELLOW}[4/5] Verificando integridad...${NC}"

# Verificar que el tar.gz es válido
if tar -tzf "$BACKUP_DIR/$BACKUP_NAME" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backup íntegro${NC}"
else
    echo -e "${RED}✗ Backup corrupto${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}[5/5] Listo para subir a Google Drive${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}   ARCHIVO DE BACKUP${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""
echo -e "📁 Ubicación: ${GREEN}$BACKUP_DIR/$BACKUP_NAME${NC}"
echo -e "📊 Tamaño: ${GREEN}$SIZE${NC}"
echo ""

# Opciones de subida
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}   OPCIONES PARA SUBIR A GOOGLE DRIVE${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo ""
echo -e "1. ${BLUE}Manual:${NC} Subir desde navegador a drive.google.com"
echo "   Archivo: $BACKUP_DIR/$BACKUP_NAME"
echo ""
echo -e "2. ${BLUE}rclone:${NC} Ejecutar: rclone copy $BACKUP_DIR/$BACKUP_NAME gdrive:/backups/"
echo ""
echo -e "3. ${BLUE}gdrive CLI:${NC} Ejecutar: gdrive upload $BACKUP_DIR/$BACKUP_NAME"
echo ""
echo -e "4. ${BLUE}Python script:${NC} Ejecutar: python3 scripts/upload_gdrive.py"
echo ""

# Generar checksum
CHECKSUM=$(sha256sum "$BACKUP_DIR/$BACKUP_NAME" | cut -d' ' -f1)
echo -e "🔐 SHA256: ${BLUE}$CHECKSUM${NC}"
echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}   BACKUP COMPLETADO${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
