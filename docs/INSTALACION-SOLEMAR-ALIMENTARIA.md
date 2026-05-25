# 📦 SISTEMA FRIGORÍFICO SOLEMAR ALIMENTARIA
## Instructivo de Instalación y Configuración

---

## 📋 REQUISITOS PREVIOS

### Hardware Mínimo
- **Procesador**: Intel Core i3 o equivalente
- **RAM**: 4 GB mínimo (8 GB recomendado)
- **Disco**: 10 GB de espacio libre
- **Red**: Conexión a internet para instalación y sincronización

### Software Necesario

| Software | Versión | Descarga |
|----------|---------|----------|
| Node.js | 18.x o superior | https://nodejs.org |
| Bun (recomendado) | 1.0 o superior | https://bun.sh |
| Git | Última versión | https://git-scm.com |

### Sistema Operativo Compatible
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Ubuntu 20.04+
- ✅ Debian 11+

---

## 🚀 INSTALACIÓN PASO A PASO

### Paso 1: Descomprimir el archivo

```bash
# Windows: Click derecho → Extraer todo
# macOS/Linux:
unzip solemar-alimentaria-sistema-completo.zip
cd my-project
```

### Paso 2: Instalar dependencias

```bash
# Con Bun (recomendado - más rápido)
bun install

# O con npm
npm install

# O con yarn
yarn install
```

### Paso 3: Configurar base de datos

```bash
# Crear la base de datos y tablas
bun run db:push

# O con npm
npm run db:push
```

### Paso 4: Cargar datos iniciales

```bash
# Ejecutar script de datos de prueba
bun run db:seed

# O con npm
npm run db:seed
```

### Paso 5: Iniciar el servidor

```bash
# Modo desarrollo
bun run dev

# El servidor iniciará en: http://localhost:3000
```

### Paso 6: Acceder al sistema

1. Abrir navegador en: `http://localhost:3000`
2. Iniciar sesión con:
   - **Usuario**: `admin`
   - **Contraseña**: `admin123`

---

## ⚙️ CONFIGURACIÓN INICIAL

### 1. Configurar datos del frigorífico

1. Ir a **Configuración** → **Frigorífico**
2. Completar los campos:
   - Nombre: `Solemar Alimentaria S.A.`
   - Dirección: `[Dirección del frigorífico]`
   - CUIT: `[CUIT del frigorífico]`
   - N° Establecimiento: `[Número SENASA]`
   - N° Matrícula: `[Matrícula]`
   - Logo: Subir imagen del logo

### 2. Configurar corrales

1. Ir a **Configuración** → **Corrales**
2. Crear los corrales necesarios:
   - Nombre: `Corral A`, `Corral B`, etc.
   - Capacidad: Número de animales
   - Observaciones: Ubicación física

### 3. Configurar cámaras frigoríficas

1. Ir a **Configuración** → **Cámaras**
2. Crear las cámaras:
   - Nombre: `Cámara 1`, `Cámara 2`, etc.
   - Tipo: `FAENA`, `CUARTEO`, o `DEPOSITO`
   - Capacidad: En ganchos o KG según tipo

### 4. Configurar clientes (Usuarios de Faena)

1. Ir a **Configuración** → **Clientes**
2. Crear cada cliente con:
   - Nombre
   - CUIT
   - Emails (múltiples separados por ;)
   - Precio servicio con recupero ($/kg)
   - Precio servicio sin recupero ($/kg)
   - Tipo facturación (A, B, C)

### 5. Configurar operadores

1. Ir a **Configuración** → **Operadores**
2. Crear usuarios con sus permisos:
   - OPERADOR: Pesaje básico
   - SUPERVISOR: Autorización de listas de faena
   - ADMINISTRADOR: Acceso total

---

## 📁 ESTRUCTURA DEL PROYECTO

```
my-project/
├── prisma/
│   ├── schema.prisma      # Esquema de base de datos
│   ├── seed.ts            # Datos iniciales
│   └── dev.db             # Base de datos SQLite
├── src/
│   ├── app/
│   │   ├── api/           # Endpoints REST
│   │   ├── page.tsx       # Página principal
│   │   └── layout.tsx     # Layout principal
│   ├── components/
│   │   ├── ui/            # Componentes shadcn/ui
│   │   ├── configuracion/ # Módulo de configuración
│   │   ├── pesaje-*       # Módulos de pesaje
│   │   ├── romaneo/       # Módulo de romaneo
│   │   └── ...            # Otros módulos
│   └── lib/
│       ├── db.ts          # Cliente Prisma
│       ├── offline/       # Sistema offline
│       └── pdf/           # Generación de PDFs
├── public/
│   └── logo.png           # Logo del frigorífico
├── .env                   # Variables de entorno
├── package.json           # Dependencias
└── README.md              # Documentación
```

---

## 🔧 MÓDULOS DEL SISTEMA

### 1. Pesaje de Camiones
- Ingreso de hacienda con DTE y guía
- Pesaje bruto y tara
- Generación de tickets
- Creación automática de tropas

### 2. Pesaje Individual
- Pesaje de animales uno a uno
- Rótulos EAN-128 únicos
- Confirmación de tipos según DTE
- Generación de Planilla 01 (PDF)

### 3. Movimiento de Hacienda
- Control de stock por corral
- Movimientos entre corrales
- Registro de bajas

### 4. Lista de Faena
- Creación de listas diarias
- Selección de tropas y cantidades
- Autorización de supervisor

### 5. Ingreso a Faena (Cajón)
- Asignación de garrones
- Escaneo de código de animal
- Opción sin asignar

### 6. Cierre de Faena
- Asignación de animales pendientes
- Corrección de asignaciones

### 7. Romaneo
- Pesaje de medias reses
- Rótulos A/T/D
- Cálculo de rinde
- Generación de PDF por tropa

### 8. Menudencias por Tropa
- Registro de artículos
- Pesaje interno y báscula

### 9. Stock de Cámaras
- Stock automático desde romaneo
- Alertas de capacidad
- Movimientos manuales

### 10. Facturación
- Facturas de servicio
- Cálculo con IVA 21%
- Estado de pagos
- Resumen mensual

---

## 🔌 CONEXIÓN CON BALANZAS

### Configuración RS232

1. Conectar balanza al puerto serial/USB
2. Configurar en el sistema:
   - Puerto COM (Windows) o /dev/ttyUSB (Linux)
   - Baud rate: 9600 (por defecto)
   - Paridad: None
   - Bits de datos: 8
   - Bits de parada: 1

### Integración
```typescript
// El sistema captura automáticamente el peso
// desde la balanza al recibir el dato serial
```

---

## 🖨️ IMPRESIÓN DE RÓTULOS

### Impresoras Recomendadas
- Zebra ZT410
- Datamax I-4210
- Cualquier impresora térmica ZPL

### Configuración
1. Instalar drivers de la impresora
2. Configurar tamaño de etiqueta:
   - Animal en pie: 5 x 10 cm
   - Media res: 10 x 11 cm
   - Menudencias: 10 x 10 cm
   - Cajas: 10 x 25 cm

---

## 📶 MODO OFFLINE

### Funcionamiento
- El sistema detecta automáticamente la pérdida de conexión
- Los datos se guardan localmente en IndexedDB
- Sincronización automática al recuperar conexión

### Módulos que funcionan offline:
- ✅ Pesaje Individual
- ✅ Ingreso a Faena
- ✅ Romaneo
- ✅ Menudencias

### Indicadores visuales:
- 🟢 Online: Sistema conectado
- 🟡 Offline: Guardando localmente + cantidad pendiente

---

## 🔄 ACTUALIZACIÓN DEL SISTEMA

### Backup antes de actualizar
```bash
# Backup de base de datos
cp prisma/dev.db prisma/dev.db.backup

# Backup completo
tar -czf backup-$(date +%Y%m%d).tar.gz prisma/ public/logo.png
```

### Actualizar código
```bash
git pull origin main
bun install
bun run db:push
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### El servidor no inicia
```bash
# Verificar puerto 3000 libre
lsof -i :3000

# Matar proceso si existe
kill -9 [PID]

# Reiniciar
bun run dev
```

### Error de base de datos
```bash
# Regenerar cliente Prisma
bunx prisma generate

# Recrear base de datos
bun run db:push
```

### Error de dependencias
```bash
# Limpiar e reinstalar
rm -rf node_modules bun.lock
bun install
```

---

## 📞 SOPORTE TÉCNICO

### Contacto
- **Email**: soporte@solemar.com.ar
- **Documentación**: Ver carpeta `/docs`
- **Worklog**: `/worklog.md`

### Información útil para soporte
- Versión del sistema: 1.0.0
- Sistema operativo
- Pasos para reproducir el error
- Capturas de pantalla
- Logs del servidor (`/dev.log`)

---

## 📊 DATOS DE PRUEBA

### Usuarios predefinidos

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | ADMINISTRADOR |
| supervisor | super123 | SUPERVISOR |
| operador | op123 | OPERADOR |

### Datos de ejemplo incluidos
- 4 tropas de prueba
- 4 clientes/usuarios de faena
- 3 transportistas
- 5 corrales
- 3 cámaras
- 6 razas bovinas
- 5 razas equinas
- 106 artículos con códigos EAN-128

---

## 🚀 DESPLIEGUE EN PRODUCCIÓN

### Opción 1: VPS/Servidor propio

```bash
# 1. Instalar PM2
npm install -g pm2

# 2. Construir aplicación
bun run build

# 3. Iniciar con PM2
pm2 start bun --name "solemar" -- run start

# 4. Guardar configuración
pm2 save
pm2 startup
```

### Opción 2: Docker

```dockerfile
# Dockerfile incluido en el proyecto
docker build -t solemar-alimentaria .
docker run -p 3000:3000 solemar-alimentaria
```

### Variables de entorno para producción
```env
NODE_ENV=production
DATABASE_URL="file:./prod.db"
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

---

## ✅ CHECKLIST DE INSTALACIÓN

- [ ] Node.js/Bun instalado
- [ ] Archivos descomprimidos
- [ ] Dependencias instaladas (`bun install`)
- [ ] Base de datos creada (`bun run db:push`)
- [ ] Datos iniciales cargados (`bun run db:seed`)
- [ ] Servidor funcionando (`bun run dev`)
- [ ] Login funcionando (admin/admin123)
- [ ] Logo actualizado
- [ ] Datos del frigorífico configurados
- [ ] Corrales creados
- [ ] Cámaras creadas
- [ ] Clientes cargados
- [ ] Operadores configurados
- [ ] Balanza conectada (si aplica)
- [ ] Impresora configurada (si aplica)
- [ ] Backup inicial realizado

---

**¡Sistema listo para usar!**

*Solemar Alimentaria - Sistema de Gestión Frigorífica v1.0*
