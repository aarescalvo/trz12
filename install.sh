#!/bin/bash
# ========================================
# INSTALADOR - Frigorifico Sistema
# ========================================

set -e

echo "===================================="
echo "   FRIGORIFICO SISTEMA - Instalador"
echo "===================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funciones
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }

# Verificar sistema operativo
OS=$(uname -s)
print_info "Sistema operativo: $OS"

# Verificar Bun
print_info "Verificando Bun..."
if command -v bun &> /dev/null; then
    BUN_VERSION=$(bun --version)
    print_success "Bun $BUN_VERSION encontrado"
else
    print_error "Bun no está instalado"
    echo ""
    echo "Para instalar Bun, ejecuta:"
    echo "  curl -fsSL https://bun.sh/install | bash"
    echo ""
    exit 1
fi

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encuentra package.json"
    echo "Ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

# Instalar dependencias
print_info "Instalando dependencias..."
bun install

# Verificar Prisma
print_info "Verificando Prisma..."
bun run db:generate 2>/dev/null || print_info "Prisma ya configurado"

# Crear base de datos si no existe
print_info "Verificando base de datos..."
mkdir -p db
if [ ! -f "db/custom.db" ]; then
    print_info "Creando base de datos..."
    bun run db:push
    print_success "Base de datos creada"
else
    print_success "Base de datos existente"
fi

# Verificar si hay datos
print_info "Verificando datos iniciales..."
SEED_NEEDED=false

# Verificar si existe el operador admin
if bun -e "
const { db } = require('./src/lib/db');
db.operador.findFirst().then(r => process.exit(r ? 0 : 1)).catch(() => process.exit(1))
" 2>/dev/null; then
    print_success "Datos de prueba existentes"
else
    SEED_NEEDED=true
fi

if [ "$SEED_NEEDED" = true ]; then
    echo ""
    read -p "¿Deseas crear datos de prueba? (s/n): " SEED_CHOICE
    if [ "$SEED_CHOICE" = "s" ] || [ "$SEED_CHOICE" = "S" ]; then
        print_info "Creando datos de prueba..."
        bun run db:seed
        print_success "Datos de prueba creados"
    fi
fi

# Configurar permisos
print_info "Configurando permisos..."
chmod +x scripts/*.sh 2>/dev/null || true

# Crear directorio de backups
mkdir -p backups

# Verificar instalación
echo ""
print_success "==================================="
print_success "   INSTALACIÓN COMPLETADA"
print_success "==================================="
echo ""
echo "Para iniciar el servidor:"
echo "  bun run dev"
echo ""
echo "Para crear un backup:"
echo "  ./scripts/backup-db.sh"
echo ""
echo "Puerto: http://localhost:3000"
echo ""
print_info "¡Listo para usar!"
