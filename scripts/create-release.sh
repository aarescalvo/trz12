#!/bin/bash
# ========================================
# CREAR RELEASE / VERSIÓN ESTABLE
# Frigorifico Sistema
# ========================================

# Configuración
PROJECT_DIR="/home/z/my-project"
RELEASES_DIR="$PROJECT_DIR/releases"
VERSION=$(cat "$PROJECT_DIR/package.json" | grep '"version"' | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')

echo "🚀 Creando release v$VERSION"
echo "================================"

# Crear directorio de release
RELEASE_DIR="$RELEASES_DIR/v$VERSION"
mkdir -p "$RELEASE_DIR"

# 1. Copiar programa completo (excluyendo node_modules, .next, backups)
echo "📁 Copiando archivos del programa..."
rsync -av --progress \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='backups' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='dev.log' \
    --exclude='server.log' \
    "$PROJECT_DIR/" "$RELEASE_DIR/programa/" \
    --exclude='releases' \
    --exclude='mini-services/*/node_modules'

# 2. Crear instalador
echo "📜 Creando instalador..."
cp "$PROJECT_DIR/install.sh" "$RELEASE_DIR/"

# 3. Copiar instructivos
echo "📚 Copiando instructivos..."
mkdir -p "$RELEASE_DIR/instructivos"
cp "$PROJECT_DIR/docs/"*.md "$RELEASE_DIR/instructivos/" 2>/dev/null || echo "  (No hay instructivos aún)"

# 4. Crear archivo de info del release
echo "📝 Creando info del release..."
cat > "$RELEASE_DIR/RELEASE-INFO.md" << EOF
# Release v$VERSION

**Fecha:** $(date '+%Y-%m-%d %H:%M:%S')

## Contenido
- \`programa/\` - Código fuente completo
- \`instructivos/\` - Manuales de uso e instalación
- \`install.sh\` - Script de instalación

## Requisitos
- Bun >= 1.0.0
- Node.js >= 18 (opcional, para npm)

## Instalación Rápida
\`\`\`bash
cd v$VERSION
chmod +x install.sh
./install.sh
\`\`\`

## Cambios en esta versión
Ver WORKLOG.md para detalles completos.
EOF

# 5. Crear archivo comprimido
echo "📦 Creando archivo comprimido..."
cd "$RELEASES_DIR"
tar -czvf "v$VERSION.tar.gz" "v$VERSION"

# 6. Calcular checksum
echo "🔐 Generando checksum..."
sha256sum "v$VERSION.tar.gz" > "v$VERSION.tar.gz.sha256"

# Resumen
echo ""
echo "✅ Release v$VERSION creado exitosamente"
echo "=========================================="
echo "📂 Ubicación: $RELEASE_DIR"
echo "📦 Archivo: $RELEASES_DIR/v$VERSION.tar.gz"
echo "🔐 Checksum: $RELEASES_DIR/v$VERSION.tar.gz.sha256"
echo ""
ls -lh "$RELEASES_DIR/v$VERSION.tar.gz"
