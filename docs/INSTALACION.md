# 🐄 Solemar Alimentaria - Sistema de Gestión Frigorífica

Sistema integral de gestión para frigoríficos con módulos de:
- Pesaje de camiones y animales
- Lista de faena
- Romaneo de medias reses
- Stock de cámaras
- Facturación de servicios
- **Funcionamiento OFFLINE**

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
bun install

# 2. Crear base de datos
bun run db:push

# 3. Cargar datos iniciales
bun run db:seed

# 4. Iniciar servidor
bun run dev
```

**Acceso**: http://localhost:3000
**Usuario**: `admin`
**Contraseña**: `admin123`

## 📦 Módulos Principales

| Módulo | Descripción |
|--------|-------------|
| Pesaje Camiones | Ingreso de hacienda con DTE |
| Pesaje Individual | Pesaje de animales con rótulos EAN-128 |
| Lista de Faena | Programación de faena diaria |
| Ingreso a Faena | Asignación de garrones |
| Romaneo | Pesaje de medias reses |
| Stock Cámaras | Control de inventario |
| Facturación | Facturas de servicio con IVA 21% |

## 🔧 Tecnologías

- **Framework**: Next.js 16 con App Router
- **Base de Datos**: SQLite con Prisma ORM
- **UI**: shadcn/ui + Tailwind CSS
- **Offline**: IndexedDB + Service Workers

## 📶 Modo Offline

El sistema funciona sin conexión en los módulos críticos:
- Pesaje Individual ✅
- Ingreso a Faena ✅
- Romaneo ✅
- Menudencias ✅

Los datos se sincronizan automáticamente al recuperar la conexión.

## 📄 Documentación

- `INSTALACION.md` - Guía de instalación detallada
- `worklog.md` - Historial de desarrollo
- `FLUJOS.md` - Flujos de trabajo del sistema

## 📞 Soporte

Para soporte técnico o consultas:
- Revisar `worklog.md` para cambios recientes
- Consultar los flujos en `FLUJOS.md`

---

**Versión**: 1.0.0
**Licencia**: Propietaria - Solemar Alimentaria
