#!/bin/bash

# ===========================================
# INSTALADOR - SISTEMA FRIGORIFICO
# Solemar Alimentaria - CICLO I
# Version: 2.0
# ===========================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
INSTALL_DIR="/opt/solemar"
DATA_DIR="/var/lib/solemar"
SERVICE_NAME="solemar"
BUN_VERSION="latest"
NODE_MIN_VERSION="18"

# Funciones de utilidad
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[ADVERTENCIA]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si se ejecuta como root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Este script debe ejecutarse como root (sudo ./install.sh)"
        exit 1
    fi
}

# Detectar sistema operativo
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        if command -v apt-get &> /dev/null; then
            PKG_MANAGER="apt"
        elif command -v yum &> /dev/null; then
            PKG_MANAGER="yum"
        elif command -v dnf &> /dev/null; then
            PKG_MANAGER="dnf"
        elif command -v pacman &> /dev/null; then
            PKG_MANAGER="pacman"
        else
            log_error "Gestor de paquetes no soportado"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        PKG_MANAGER="brew"
    else
        log_error "Sistema operativo no soportado: $OSTYPE"
        exit 1
    fi
    log_success "Sistema detectado: $OS ($PKG_MANAGER)"
}

# Verificar dependencias
check_dependencies() {
    log_info "Verificando dependencias del sistema..."
    
    # Verificar Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $NODE_VERSION -lt $NODE_MIN_VERSION ]]; then
            log_warning "Node.js version $NODE_VERSION detectada. Se recomienda $NODE_MIN_VERSION o superior."
        else
            log_success "Node.js $(node -v) detectado"
        fi
    else
        log_warning "Node.js no esta instalado. Se instalara Bun como runtime alternativo."
    fi
    
    # Verificar Git
    if command -v git &> /dev/null; then
        log_success "Git $(git --version | cut -d' ' -f3) detectado"
    else
        log_warning "Git no esta instalado"
    fi
    
    # Verificar curl
    if command -v curl &> /dev/null; then
        log_success "curl detectado"
    else
        log_warning "curl no esta instalado"
    fi
}

# Instalar Bun
install_bun() {
    log_info "Instalando Bun runtime..."
    
    if command -v bun &> /dev/null; then
        BUN_CURRENT=$(bun -v)
        log_success "Bun $BUN_CURRENT ya esta instalado"
        return 0
    fi
    
    # Instalar Bun
    curl -fsSL https://bun.sh/install | bash
    
    # Agregar al PATH para esta sesion
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    
    if command -v bun &> /dev/null; then
        log_success "Bun instalado correctamente"
    else
        log_error "Error al instalar Bun"
        exit 1
    fi
}

# Crear directorios
create_directories() {
    log_info "Creando directorios de instalacion..."
    
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$DATA_DIR/db"
    mkdir -p "$DATA_DIR/logs"
    mkdir -p "$DATA_DIR/backups"
    
    log_success "Directorios creados en $INSTALL_DIR y $DATA_DIR"
}

# Copiar archivos
copy_files() {
    log_info "Copiando archivos del sistema..."
    
    # Obtener directorio del script
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    # Copiar todo excepto scripts de instalacion
    rsync -av --exclude='install.sh' --exclude='install.ps1' --exclude='INSTALL.md' "$SCRIPT_DIR/" "$INSTALL_DIR/"
    
    # Crear archivo .env si no existe
    if [[ ! -f "$INSTALL_DIR/.env" ]]; then
        cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"
        # Actualizar ruta de base de datos
        sed -i "s|DATABASE_URL=.*|DATABASE_URL=file:$DATA_DIR/db/custom.db|g" "$INSTALL_DIR/.env"
    fi
    
    log_success "Archivos copiados a $INSTALL_DIR"
}

# Instalar dependencias
install_dependencies() {
    log_info "Instalando dependencias del proyecto..."
    
    cd "$INSTALL_DIR"
    
    # Usar bun para instalar
    bun install
    
    if [[ $? -ne 0 ]]; then
        log_error "Error al instalar dependencias"
        exit 1
    fi
    
    log_success "Dependencias instaladas"
}

# Generar Prisma Client
setup_database() {
    log_info "Configurando base de datos..."
    
    cd "$INSTALL_DIR"
    
    # Generar Prisma Client
    bun run db:generate
    
    # Crear base de datos
    bun run db:push
    
    # Ejecutar seed
    log_info "Cargando datos iniciales..."
    bun run db:seed
    
    log_success "Base de datos configurada"
}

# Compilar proyecto
build_project() {
    log_info "Compilando proyecto..."
    
    cd "$INSTALL_DIR"
    
    bun run build
    
    if [[ $? -ne 0 ]]; then
        log_error "Error al compilar el proyecto"
        exit 1
    fi
    
    log_success "Proyecto compilado correctamente"
}

# Crear servicio systemd (solo Linux)
create_systemd_service() {
    if [[ "$OS" != "linux" ]]; then
        log_info "Omitiendo servicio systemd (no es Linux)"
        return 0
    fi
    
    log_info "Creando servicio systemd..."
    
    cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=Sistema Frigorifico - Solemar Alimentaria
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
Environment="NODE_ENV=production"
Environment="PATH=/root/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=/root/.bun/bin/bun .next/standalone/server.js
Restart=always
RestartSec=10
StandardOutput=append:$DATA_DIR/logs/app.log
StandardError=append:$DATA_DIR/logs/error.log

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    
    log_success "Servicio systemd creado: $SERVICE_NAME.service"
}

# Configurar firewall
setup_firewall() {
    if [[ "$OS" != "linux" ]]; then
        return 0
    fi
    
    log_info "Configurando firewall..."
    
    if command -v ufw &> /dev/null; then
        ufw allow 3000/tcp
        log_success "Puerto 3000 habilitado en UFW"
    elif command -v firewall-cmd &> /dev/null; then
        firewall-cmd --permanent --add-port=3000/tcp
        firewall-cmd --reload
        log_success "Puerto 3000 habilitado en firewalld"
    else
        log_warning "No se detecto firewall. Asegurese de habilitar el puerto 3000 manualmente."
    fi
}

# Crear script de inicio rapido
create_start_script() {
    log_info "Creando scripts de utilidad..."
    
    # Script de inicio
    cat > "$INSTALL_DIR/start.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
export NODE_ENV=production
bun .next/standalone/server.js
EOF
    chmod +x "$INSTALL_DIR/start.sh"
    
    # Script de backup
    cat > "$INSTALL_DIR/backup.sh" << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/lib/solemar/backups"
DATE=$(date +%Y%m%d_%H%M%S)
cp /var/lib/solemar/db/custom.db "$BACKUP_DIR/solemar_$DATE.db"
echo "Backup creado: solemar_$DATE.db"
# Mantener solo los ultimos 10 backups
ls -t $BACKUP_DIR/*.db | tail -n +11 | xargs rm -f 2>/dev/null
EOF
    chmod +x "$INSTALL_DIR/backup.sh"
    
    # Script de actualizacion
    cat > "$INSTALL_DIR/update.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "Actualizando sistema..."
git pull origin main
bun install
bun run db:generate
bun run db:push
bun run build
echo "Actualizacion completada. Reinicie el servicio."
EOF
    chmod +x "$INSTALL_DIR/update.sh"
    
    log_success "Scripts de utilidad creados"
}

# Mostrar informacion final
show_final_info() {
    echo ""
    echo "=========================================="
    echo -e "${GREEN}INSTALACION COMPLETADA${NC}"
    echo "=========================================="
    echo ""
    echo "Directorio de instalacion: $INSTALL_DIR"
    echo "Directorio de datos: $DATA_DIR"
    echo "Base de datos: $DATA_DIR/db/custom.db"
    echo ""
    echo "Comandos utiles:"
    echo "  Iniciar servicio:  systemctl start $SERVICE_NAME"
    echo "  Detener servicio:  systemctl stop $SERVICE_NAME"
    echo "  Ver estado:        systemctl status $SERVICE_NAME"
    echo "  Ver logs:          tail -f $DATA_DIR/logs/app.log"
    echo "  Backup manual:     $INSTALL_DIR/backup.sh"
    echo ""
    echo "Credenciales de acceso:"
    echo "  Usuario: admin"
    echo "  Password: admin123"
    echo "  PIN: 1234"
    echo ""
    echo "Acceda a: http://localhost:3000"
    echo ""
}

# Funcion principal
main() {
    echo ""
    echo "=========================================="
    echo "  INSTALADOR SISTEMA FRIGORIFICO"
    echo "  Solemar Alimentaria - CICLO I"
    echo "=========================================="
    echo ""
    
    # Verificar argumentos
    INSTALL_MODE=${1:-"full"}
    
    case $INSTALL_MODE in
        "full")
            check_root
            detect_os
            check_dependencies
            install_bun
            create_directories
            copy_files
            install_dependencies
            setup_database
            build_project
            create_systemd_service
            setup_firewall
            create_start_script
            show_final_info
            ;;
        "update")
            log_info "Modo actualizacion..."
            cd "$INSTALL_DIR"
            bun install
            bun run db:generate
            bun run db:push
            bun run build
            log_success "Actualizacion completada"
            ;;
        "seed-only")
            log_info "Modo solo seed..."
            cd "$INSTALL_DIR"
            bun run db:seed
            log_success "Datos cargados"
            ;;
        *)
            echo "Uso: $0 [full|update|seed-only]"
            exit 1
            ;;
    esac
}

# Ejecutar
main "$@"
