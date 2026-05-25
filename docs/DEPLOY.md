# Despliegue en Produccion - Sistema de Gestion Frigorifica v3.17.0

## Opcion 1: Servidor Local Windows (Recomendado para frigorificos)

### Requisitos del Servidor
- **CPU**: Intel Core i5 o superior
- **RAM**: 8 GB minimo (16 GB recomendado)
- **Disco**: 50 GB SSD
- **Red**: IP fija en la LAN
- **Sistema**: Windows 10/11 o Windows Server 2019+

### Pasos de Instalacion

#### 1. Instalar PostgreSQL 16
```powershell
# Descargar desde https://www.postgresql.org/download/windows/
# Ejecutar instalador:
# - Puerto: 5432 (por defecto)
# - Contrasena de superuser: [elegir contrasena segura]
```

Crear base de datos:
```sql
-- Abrir pgAdmin o psql
CREATE DATABASE trz5;
```

#### 2. Instalar Bun
```powershell
# PowerShell como Administrador
powershell -c "irm bun.sh/install.ps1 | iex"
# Cerrar y reabrir PowerShell
```

#### 3. Clonar y Configurar
```powershell
git clone https://github.com/aarescalvo/trz5.git C:\TRZ5
cd C:\TRZ5
bun install
copy .env.example .env
notepad .env
```

Editar `.env` con:
```
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/trz5"
```

#### 4. Inicializar
```powershell
bun run db:generate
bun run db:push
bun run db:seed
bun run build
```

#### 5. Iniciar
```powershell
npx next start
```

#### 6. Configurar como Servicio con NSSM (opcional)
```powershell
choco install nssm
nssm install TRZ5 "C:\Program Files\nodejs\node.exe" "C:\TRZ5\node_modules\next\dist\bin\next" "start"
nssm set TRZ5 AppDirectory "C:\TRZ5"
nssm set TRZ5 DisplayName "Sistema Frigorifico TRZ5"
nssm set TRZ5 Start SERVICE_AUTO_START
nssm start TRZ5
```

#### 7. Abrir Firewall
```powershell
netsh advfirewall firewall add rule name="TRZ5" dir=in action=allow protocol=TCP localport=3000
```

---

## Opcion 2: Servidor Linux (Ubuntu Server)

### Requisitos
- **CPU**: 2 nucleos minimo, 4 recomendados
- **RAM**: 8 GB minimo
- **Disco**: 50 GB SSD
- **Red**: IP fija en la LAN
- **Sistema**: Ubuntu Server 20.04+ o 22.04 LTS

### Pasos

#### 1. Instalar dependencias
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y postgresql-16 git nginx
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

#### 2. Configurar PostgreSQL
```bash
sudo -u postgres psql
```
```sql
CREATE DATABASE trz5;
CREATE USER trz5_user WITH ENCRYPTED PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE trz5 TO trz5_user;
\q
```

#### 3. Clonar y configurar
```bash
sudo git clone https://github.com/aarescalvo/trz5.git /opt/trz5
sudo chown -R $USER:$USER /opt/trz5
cd /opt/trz5
bun install
```

Editar `/opt/trz5/.env`:
```
DATABASE_URL="postgresql://trz5_user:tu_password_seguro@localhost:5432/trz5"
```

#### 4. Inicializar
```bash
bun run db:generate
bun run db:push
bun run db:seed
bun run build
```

#### 5. Configurar servicio systemd
```bash
sudo nano /etc/systemd/system/trz5.service
```
```ini
[Unit]
Description=Sistema Frigorifico TRZ5
After=network.target postgresql.service

[Service]
Type=simple
User=trz5
WorkingDirectory=/opt/trz5
ExecStart=/home/trz5/.bun/bin/bun run start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable trz5
sudo systemctl start trz5
sudo systemctl status trz5
```

#### 6. Configurar Nginx (proxy inverso, opcional)
```bash
sudo nano /etc/nginx/sites-available/trz5
```
```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/trz5 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. Firewall
```bash
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP (Nginx)
sudo ufw allow 3000/tcp   # Directo (sin Nginx)
sudo ufw enable
```

---

## Acceso desde la Red

Las PCs de la red acceden via navegador:

**Sin Nginx (directo):**
```
http://IP-DEL-SERVIDOR:3000
```

**Con Nginx:**
```
http://IP-DEL-SERVIDOR
```

---

## Backups Automaticos

### Linux (cron)
```bash
# Crear script
sudo nano /opt/trz5/scripts/backup-auto.sh
```
```bash
#!/bin/bash
BACKUP_DIR="/opt/trz5/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U trz5_user trz5 -F c -f "$BACKUP_DIR/trz5_$DATE.backup"
find $BACKUP_DIR -name "*.backup" -mtime +30 -delete
echo "Backup completado: trz5_$DATE.backup"
```

```bash
chmod +x /opt/trz5/scripts/backup-auto.sh
# Ejecutar diario a las 2 AM
crontab -e
# Agregar:
0 2 * * * /opt/trz5/scripts/backup-auto.sh >> /opt/trz5/backups/backup.log 2>&1
```

### Windows (con backup-sistema.bat)
El script `backup-sistema.bat` ya esta incluido. Para programarlo:
1. Abrir "Programador de tareas" de Windows
2. Crear tarea basica
3. Desencadenador: Diario a las 2:00 AM
4. Accion: Iniciar programa → `C:\TRZ5\backup-sistema.bat`

---

## Seguridad en Produccion

### Checklist post-instalacion
1. [ ] Cambiar credenciales por defecto (admin, supervisor, balanza)
2. [ ] Configurar firewall correctamente
3. [ ] Verificar que el servidor no es accesible desde Internet
4. [ ] Programar backups automaticos
5. [ ] Probar restauracion de backup
6. [ ] Configurar servicio para inicio automatico

### HTTPS (opcional, con Nginx + Certbot)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

---

## Verificacion Post-Instalacion

1. [ ] El sistema carga en http://IP:3000
2. [ ] Se puede iniciar sesion con admin/admin123
3. [ ] El dashboard muestra estadisticas
4. [ ] Se pueden crear tropas nuevas
5. [ ] Los reportes se generan correctamente
6. [ ] El backup se ejecuta correctamente

---

## Repositorio

- **GitHub**: https://github.com/aarescalvo/trz5
- **Branch**: master
- **Issues**: https://github.com/aarescalvo/trz5/issues
