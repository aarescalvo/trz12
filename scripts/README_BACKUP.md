# 📦 Sistema de Backup - Google Drive

Este sistema permite crear backups del proyecto Solemar Alimentaria y subirlos automáticamente a Google Drive.

---

## 🚀 INICIO RÁPIDO

### Opción 1: Backup Local (más simple)

```bash
# Crear backup comprimido
./scripts/backup.sh

# El archivo se guarda en: /home/z/my-project/backups/
# Luego subir manualmente a drive.google.com
```

### Opción 2: Backup Automático a Google Drive

```bash
# 1. Crear backup
./scripts/backup.sh

# 2. Subir a Google Drive (requiere configuración inicial)
python3 scripts/upload_gdrive.py
```

---

## ⚙️ CONFIGURACIÓN DE GOOGLE DRIVE API

### Paso 1: Crear proyecto en Google Cloud

1. Ir a: https://console.cloud.google.com/
2. Crear un **proyecto nuevo**:
   - Nombre: `Solemar Backup` (o el que prefieras)
   - ID: se genera automáticamente

### Paso 2: Habilitar Google Drive API

1. En el menú izquierdo: **APIs y servicios** → **Biblioteca**
2. Buscar: `Google Drive API`
3. Click en **Habilitar**

### Paso 3: Crear credenciales OAuth

1. En el menú: **APIs y servicios** → **Credenciales**
2. Click en **+ Crear credenciales** → **ID de cliente OAuth**
3. Si pide configurar pantalla de consentimiento:
   - Tipo de usuario: **Externo**
   - Nombre de app: `Solemar Backup`
   - Correo de soporte: tu email
   - Guardar y continuar
4. Tipo de aplicación: **Aplicación de escritorio**
5. Nombre: `Solemar Desktop`
6. Click en **Crear**
7. Click en **Descargar JSON**

### Paso 4: Guardar credenciales

```bash
# Renombrar el archivo descargado y moverlo a la carpeta scripts
mv ~/Downloads/client_secret_*.json /home/z/my-project/scripts/credentials.json
```

### Paso 5: Instalar dependencias Python

```bash
pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

---

## 📤 USO

### Crear backup local

```bash
./scripts/backup.sh
```

Esto crea un archivo en `/home/z/my-project/backups/` con nombre:
`solemar_backup_YYYYMMDD_HHMMSS.tar.gz`

### Subir a Google Drive

```bash
# Sube el backup más reciente
python3 scripts/upload_gdrive.py

# O especificar un archivo
python3 scripts/upload_gdrive.py /path/to/backup.tar.gz
```

**Primera vez:** Se abrirá el navegador para autorizar el acceso a Google Drive. El token se guarda para futuras ejecuciones.

---

## 🔄 AUTOMATIZACIÓN (CRON)

Para backups automáticos cada día a las 23:00:

```bash
# Editar crontab
crontab -e

# Agregar esta línea:
0 23 * * * cd /home/z/my-project && ./scripts/backup.sh && python3 scripts/upload_gdrive.py >> /home/z/my-project/backups/backup.log 2>&1
```

---

## 📂 ESTRUCTURA DE BACKUPS

```
/home/z/my-project/backups/
├── solemar_backup_20260304_230000.tar.gz
├── solemar_backup_20260303_230000.tar.gz
├── solemar_backup_20260302_230000.tar.gz
├── ...
└── (máximo 5 backups locales)

Google Drive:
└── Solemar_Backups/
    └── solemar_backup_*.tar.gz
```

---

## ⚠️ QUÉ SE INCLUYE EN EL BACKUP

✅ **Incluido:**
- Código fuente (`src/`)
- Schema Prisma (`prisma/`)
- Scripts (`scripts/`)
- Documentación (`*.md`)
- Configuración (`package.json`, `tsconfig.json`, etc.)
- Base de datos SQLite (`db/custom.db`)

❌ **Excluido:**
- `node_modules/` (muy grande, se regenera con `npm install`)
- `.next/` (cache de Next.js)
- `.git/` (historial, aunque se puede incluir si se desea)
- Archivos de log

---

## 🔧 ALTERNATIVAS

### rclone (más rápido para archivos grandes)

```bash
# Instalar rclone
curl https://rclone.org/install.sh | sudo bash

# Configurar
rclone config
# Seguir los pasos, seleccionar Google Drive

# Subir backup
rclone copy /home/z/my-project/backups/backup.tar.gz gdrive:/Solemar_Backups/
```

### gdrive CLI

```bash
# Instalar (Linux)
wget https://github.com/prasmussen/gdrive/releases/download/2.1.1/gdrive_2.1.1_linux_amd64.tar.gz
tar -xzf gdrive_2.1.1_linux_amd64.tar.gz
sudo mv gdrive /usr/local/bin/

# Autenticar
gdrive about

# Subir
gdrive upload /home/z/my-project/backups/backup.tar.gz
```

---

## 🆘 PROBLEMAS COMUNES

### "credentials.json not found"
- Verificar que descargaste el JSON de Google Cloud Console
- Renombrarlo correctamente y moverlo a `scripts/`

### "Token has been expired or revoked"
- Borrar `scripts/token.json`
- Ejecutar de nuevo para re-autenticar

### "Quota exceeded"
- Google Drive gratuito tiene 15GB
- Los backups se acumulan, borrar los antiguos

---

## 📞 CONTACTO

Para problemas con el backup, revisar:
1. Este archivo README
2. Los logs en `/home/z/my-project/backups/backup.log`
