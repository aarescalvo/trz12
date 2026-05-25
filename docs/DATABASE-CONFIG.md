# Configuración de Base de Datos

## Desarrollo Local (SQLite)

Por defecto, el sistema usa **SQLite** para desarrollo local. No requiere configuración adicional.

Archivo `.env`:
```
DATABASE_URL="file:./dev.db"
```

## Producción (PostgreSQL) - Multi-PC

Para trabajo en red con múltiples PCs, usar **PostgreSQL**:

### 1. Instalar PostgreSQL en el servidor

Ver instrucciones completas en: `/installers/MANUAL_RED_SERVIDOR.txt`

### 2. Cambiar el schema de Prisma

Editar `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"   // Cambiar de "sqlite" a "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Configurar el archivo .env

```
DATABASE_URL="postgresql://solemar_user:Solemar2024!@localhost:5432/solemar_frigorifico?schema=public"
```

### 4. Regenerar Prisma Client

```bash
bun run db:generate
bun run db:push
```

## Instaladores Disponibles

- `/installers/install-server.bat` - Instalador automático para Windows Server
- `/installers/MANUAL_RED_SERVIDOR.txt` - Manual completo del servidor
- `/installers/MANUAL_RED_CLIENTE.txt` - Manual para PCs cliente

## Arquitectura de Red

```
┌─────────────────────────────────────────────────────┐
│                 SERVIDOR CENTRAL                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ PostgreSQL  │  │  Next.js    │  │   Node.js   │ │
│  │  (Puerto    │  │  App        │  │  (Puerto    │ │
│  │   5432)     │  │             │  │   3000)     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   ┌─────────┐    ┌─────────┐    ┌─────────┐
   │  PC 1   │    │  PC 2   │    │  PC 3   │
   │ Balanza │    │ Romaneo │    │  Admin  │
   └─────────┘    └─────────┘    └─────────┘
```

## Ventajas de PostgreSQL para Multi-PC

1. **Múltiples conexiones simultáneas** - Varios operadores pueden trabajar al mismo tiempo
2. **Transacciones ACID** - Evita conflictos de datos
3. **Mejor rendimiento** - Optimizado para consultas complejas
4. **Respaldos más robustos** - pg_dump y herramientas profesionales
5. **Acceso remoto** - Las PCs cliente se conectan vía red
