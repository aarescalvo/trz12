# ☁️ INSTRUCTIVO DE BACKUP EN LA NUBE
## Sistema de Gestión Frigorífica - Solemar Alimentaria

---

## 📋 ÍNDICE

1. [Introducción](#introducción)
2. [Servicios Soportados](#servicios-soportados)
3. [Requisitos Previos](#requisitos-previos)
4. [Configuración Automática](#configuración-automática)
5. [Configuración Manual](#configuración-manual)
6. [Frecuencias de Backup](#frecuencias-de-backup)
7. [Retención de Backups](#retención-de-backups)
8. [Restauración](#restauración)
9. [Monitoreo y Logs](#monitoreo-y-logs)
10. [Solución de Problemas](#solución-de-problemas)

---

## 🔍 INTRODUCCIÓN

El sistema de backup en la nube proporciona una capa adicional de seguridad para los datos críticos del frigorífico, permitiendo recuperar la base de datos en caso de fallo del servidor local.

### Arquitectura de Backup

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   SERVIDOR      │       │   BACKUP LOCAL  │       │   BACKUP NUBE   │
│   LOCAL         │──────▶│   (Diario)      │──────▶│   (Configurable)│
│   SQLite        │       │   C:\backups    │       │   Cloud Drive   │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### Ventajas del Backup en la Nube

- ✅ Protección contra pérdida total de datos
- ✅ Acceso desde cualquier ubicación
- ✅ Sincronización automática
- ✅ Historial de versiones
- ✅ Recuperación rápida en caso de desastre

---

## 🌐 SERVICIOS SOPORTADOS

### 1. Google Drive

```
Requisitos:
- Aplicación de escritorio de Google Drive instalada
- Cuenta de Google configurada
- Sincronización activada

Carpeta por defecto:
%USERPROFILE%\Google Drive\SolemarAlimentaria

Ventajas:
+ 15 GB gratis
+ Sincronización automática
+ Acceso desde cualquier dispositivo
+ Historial de versiones

Limitaciones:
- Requiere conexión a internet para sincronizar
- Consume ancho de banda
```

### 2. OneDrive

```
Requisitos:
- Windows 10/11 (incluido por defecto)
- Cuenta Microsoft configurada
- Sincronización activada

Carpeta por defecto:
%USERPROFILE%\OneDrive\SolemarAlimentaria

Ventajas:
+ Incluido en Windows 10/11
+ Integración nativa
+ 5 GB gratis
+ Sincronización inteligente

Limitaciones:
- Requiere cuenta Microsoft
- Consume ancho de banda
```

### 3. Dropbox

```
Requisitos:
- Aplicación de escritorio de Dropbox instalada
- Cuenta de Dropbox configurada

Carpeta por defecto:
%USERPROFILE%\Dropbox\SolemarAlimentaria

Ventajas:
+ Sincronización muy rápida
+ Historial de versiones extendido
+ Recuperación de archivos eliminados

Limitaciones:
- Solo 2 GB gratis
- Requiere instalación adicional
```

### 4. Carpeta de Red (NAS/Servidor)

```
Requisitos:
- NAS o servidor de archivos en la red
- Permisos de escritura en la carpeta

Ruta por defecto:
\\SERVIDOR\backups\SolemarAlimentaria

Ventajas:
+ Sin límite de almacenamiento
+ Sin dependencia de internet
+ Control total de los datos
+ Rápida restauración

Limitaciones:
- Requiere infraestructura local
- Sin acceso externo directo
```

### 5. FTP

```
Requisitos:
- Servidor FTP externo
- Credenciales de acceso

Configuración:
- Servidor: ftp.miservidor.com
- Puerto: 21
- Usuario: [usuario]
- Contraseña: [contraseña]

Ventajas:
+ Flexible en ubicación
+ Compatible con muchos proveedores
+ Sin dependencia de aplicaciones

Limitaciones:
- Requiere configuración manual
- Sin sincronización automática
- Transmisión no encriptada (a menos que use FTPS)
```

---

## ⚙️ REQUISITOS PREVIOS

### Para Servicios de Nube (Google Drive, OneDrive, Dropbox)

1. **Instalar la aplicación de escritorio**
   - Descargar desde el sitio oficial
   - Instalar y configurar cuenta
   - Verificar que la sincronización está activa

2. **Verificar carpeta de sincronización**
   ```cmd
   :: Google Drive
   dir "%USERPROFILE%\Google Drive"
   
   :: OneDrive
   dir "%USERPROFILE%\OneDrive"
   
   :: Dropbox
   dir "%USERPROFILE%\Dropbox"
   ```

3. **Verificar espacio disponible**
   - Asegurar suficiente espacio para backups
   - Considerar crecimiento de la base de datos

### Para Carpeta de Red

1. **Crear carpeta compartida**
   ```cmd
   :: En el servidor de archivos
   mkdir C:\Backups\SolemarAlimentaria
   net share backups=C:\Backups /grant:todos,FULL
   ```

2. **Verificar acceso desde el servidor**
   ```cmd
   :: Probar acceso
   dir \\SERVIDOR\backups
   ```

### Para FTP

1. **Obtener credenciales del proveedor**
   - Servidor FTP
   - Puerto
   - Usuario
   - Contraseña

2. **Verificar conexión**
   ```cmd
   ftp ftp.miservidor.com
   ```

---

## 🚀 CONFIGURACIÓN AUTOMÁTICA

### Paso 1: Ejecutar el Configurador

```
Ejecutar como Administrador:
install\server\cloud-backup-setup.bat
```

### Paso 2: Seleccionar Servicio de Nube

```
╔══════════════════════════════════════════════════════════════╗
║  [1] Google Drive   - Requiere app de escritorio instalada  ║
║  [2] OneDrive       - Incluido en Windows 10/11             ║
║  [3] Dropbox        - Requiere app de escritorio instalada  ║
║  [4] Carpeta de Red - NAS o servidor en la red              ║
║  [5] FTP            - Servidor FTP externo                  ║
║  [6] Ninguno        - Desactivar backup en la nube          ║
╚══════════════════════════════════════════════════════════════╝
```

### Paso 3: Configurar Ruta

- Aceptar la ruta por defecto, o
- Ingresar una ruta personalizada

### Paso 4: Configurar Frecuencia

```
[1] Cada hora      - Máxima seguridad
[2] Cada 4 horas   - Alta frecuencia
[3] Cada 12 horas  - Frecuencia media
[4] Diario         - RECOMENDADO
[5] Semanal        - Baja frecuencia
```

### Paso 5: Configurar Retención

```
[1] 7 días
[2] 14 días
[3] 30 días (RECOMENDADO)
[4] 60 días
[5] 90 días
```

### Paso 6: Probar Backup

El configurador ofrece ejecutar un backup de prueba.

---

## 🔧 CONFIGURACIÓN MANUAL

### Archivo de Configuración

Ubicación: `C:\SolemarAlimentaria\config\cloud_backup.json`

```json
{
  "servicio": "GOOGLE_DRIVE",
  "nombre_servicio": "Google Drive",
  "ruta_backup": "C:\\Users\\Usuario\\Google Drive\\SolemarAlimentaria",
  "frecuencia": "DAILY",
  "retencion_dias": 30,
  "script_path": "C:\\SolemarAlimentaria\\cloud-backup.bat",
  "fecha_configuracion": "07/03/2026 14:00:00"
}
```

### Script de Backup

Ubicación: `C:\SolemarAlimentaria\cloud-backup.bat`

```batch
@echo off
:: Script de Backup en la Nube

set "db_path=C:\SolemarAlimentaria\app\db\custom.db"
set "backup_path=C:\Users\Usuario\Google Drive\SolemarAlimentaria"
set "date_stamp=%date:~6,4%%date:~3,2%%date:~0,2%"
set "time_stamp=%time:~0,2%%time:~3,2%"
set "time_stamp=%time_stamp: =0%"
set "backup_file=solemar_%date_stamp%_%time_stamp%.db"

:: Crear backup
if exist "%db_path%" (
    copy "%db_path%" "%backup_path%\%backup_file%" >nul
    echo %date% %time% - Backup creado: %backup_file% >> "C:\SolemarAlimentaria\logs\cloud-backup.log"
)

:: Limpiar backups antiguos (30 días)
forfiles /p "%backup_path%" /m *.db /d -30 /c "cmd /c del @path" 2>nul
```

### Crear Tarea Programada Manualmente

```cmd
:: Backup diario a las 23:00
schtasks /create /tn "SolemarAlimentaria_CloudBackup" /tr "C:\SolemarAlimentaria\cloud-backup.bat" /sc daily /st 23:00 /rl HIGHEST

:: Backup cada 4 horas
schtasks /create /tn "SolemarAlimentaria_CloudBackup" /tr "C:\SolemarAlimentaria\cloud-backup.bat" /sc hourly /mo 4 /st 00:00 /rl HIGHEST
```

---

## ⏰ FRECUENCIAS DE BACKUP

### Recomendación por Tipo de Operación

| Frecuencia | Uso Recomendado | Pros | Contras |
|------------|-----------------|------|---------|
| Cada hora | Alta rotación | Pérdida mínima | Mucho espacio |
| Cada 4 horas | Rotación media | Balanceado | Algunos datos perdidos |
| Cada 12 horas | Rotación baja | Poco espacio | Hasta 12h perdidas |
| **Diario** | **Estándar** | **Recomendado** | Hasta 24h perdidas |
| Semanal | Solo lectura | Mínimo espacio | Hasta 7 días perdidos |

### Configuración de Tarea Programada

| Frecuencia | Comando schtasks |
|------------|------------------|
| Cada hora | `/sc hourly /mo 1` |
| Cada 4 horas | `/sc hourly /mo 4` |
| Cada 12 horas | `/sc hourly /mo 12` |
| Diario | `/sc daily /st 23:00` |
| Semanal | `/sc weekly /d SUN /st 23:00` |

---

## 📦 RETENCIÓN DE BACKUPS

### Cálculo de Espacio Requerido

```
Tamaño base de datos: ~50 MB
Retención: 30 días
Espacio requerido: 50 MB × 30 = 1.5 GB

Recomendación: Mínimo 5 GB disponibles
```

### Política de Limpieza

El sistema elimina automáticamente backups antiguos:

```batch
:: Mantener solo últimos N días
forfiles /p "%backup_path%" /m *.db /d -30 /c "cmd /c del @path"
```

### Recuperación de Backups Eliminados

- **Google Drive**: Papelera hasta 30 días
- **OneDrive**: Papelera hasta 93 días
- **Dropbox**: Hasta 180 días (plan pago)

---

## 🔄 RESTAURACIÓN

### Restaurar desde la Nube

1. **Detener el servidor**
   ```cmd
   C:\SolemarAlimentaria\stop-server.bat
   ```

2. **Localizar backup en la nube**
   - Abrir carpeta de Google Drive/OneDrive/Dropbox
   - Navegar a carpeta SolemarAlimentaria
   - Seleccionar archivo de backup deseado

3. **Restaurar la base de datos**
   ```cmd
   :: Copiar backup a la ubicación de la base de datos
   copy "[ruta_nube]\solemar_20260307_230000.db" "C:\SolemarAlimentaria\app\db\custom.db"
   ```

4. **Iniciar el servidor**
   ```cmd
   C:\SolemarAlimentaria\start-server.bat
   ```

### Restaurar desde FTP

```cmd
:: Conectar al servidor FTP
ftp ftp.miservidor.com

:: Descargar backup
get solemar_20260307_230000.db

:: Copiar a ubicación
copy solemar_20260307_230000.db C:\SolemarAlimentaria\app\db\custom.db
```

---

## 📊 MONITOREO Y LOGS

### Verificar Estado de Sincronización

**Google Drive:**
- Icono en bandeja del sistema
- Verde = Sincronizado
- Girando = Sincronizando

**OneDrive:**
- Icono en bandeja del sistema
- Centro de actividades de OneDrive

**Dropbox:**
- Icono en bandeja del sistema
- Preferencias de Dropbox

### Archivo de Log

Ubicación: `C:\SolemarAlimentaria\logs\cloud-backup.log`

```
07/03/2026 23:00:15 - Iniciando backup en la nube...
07/03/2026 23:00:16 - Backup creado: solemar_20260307_230000.db
08/03/2026 23:00:12 - Iniciando backup en la nube...
08/03/2026 23:00:13 - Backup creado: solemar_20260308_230000.db
```

### Verificar Tarea Programada

```cmd
:: Ver estado de la tarea
schtasks /query /tn "SolemarAlimentaria_CloudBackup" /v

:: Ver historial de ejecuciones
schtasks /query /tn "SolemarAlimentaria_CloudBackup" /v /fo list | findstr "Última"
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Los backups no se sincronizan

```
Causas posibles:
1. Sin conexión a internet
2. Aplicación de nube cerrada
3. Espacio insuficiente en la nube

Solución:
1. Verificar conexión a internet
2. Abrir aplicación de Google Drive/OneDrive/Dropbox
3. Liberar espacio o ampliar plan
```

### Error: Ruta no encontrada

```
Causas posibles:
1. Carpeta de nube no configurada
2. Ruta personalizada incorrecta
3. Permisos insuficientes

Solución:
1. Verificar que la carpeta de la nube existe
2. Corregir ruta en cloud_backup.json
3. Verificar permisos de escritura
```

### El backup es muy lento

```
Causas posibles:
1. Conexión a internet lenta
2. Base de datos muy grande
3. Archivos anteriores no limpiados

Solución:
1. Verificar velocidad de conexión
2. Reducir frecuencia de backup
3. Limpiar backups antiguos manualmente
```

### Tarea programada no se ejecuta

```
Causas posibles:
1. Tarea deshabilitada
2. Permisos insuficientes
3. Equipo apagado a la hora programada

Solución:
1. Verificar estado: schtasks /query /tn "SolemarAlimentaria_CloudBackup"
2. Recrear tarea con permisos de administrador
3. Configurar equipo para no suspender
```

### No se puede conectar al FTP

```
Causas posibles:
1. Credenciales incorrectas
2. Servidor FTP caído
3. Firewall bloqueando conexión

Solución:
1. Verificar usuario y contraseña
2. Probar conexión con cliente FTP externo
3. Abrir puerto 21 en firewall
```

---

## 📞 SOPORTE

Para asistencia técnica adicional:

- **Sistema**: Solemar Alimentaria
- **Repositorio**: https://github.com/aarescalvo/zaisoleweb

---

*Última actualización: Marzo 2026*
