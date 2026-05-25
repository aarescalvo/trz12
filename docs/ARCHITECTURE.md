# 🏗️ Arquitectura Modular - Sistema Frigorífico

## Estructura del Proyecto

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (endpoints REST)
│   ├── page.tsx                  # Página principal
│   └── layout.tsx                # Layout raíz
│
├── core/                         # Infraestructura base
│   ├── repository/               # Patrón Repository
│   │   └── base.repository.ts    # Repositorio genérico CRUD
│   ├── service/                  # Patrón Service
│   │   └── base.service.ts       # Servicio base
│   └── events/                   # Sistema de eventos
│       └── event-bus.ts          # Bus de eventos (Observer)
│
├── shared/                       # Código compartido
│   ├── types/                    # Tipos TypeScript globales
│   │   ├── common.types.ts       # Tipos base (PaginatedResult, etc.)
│   │   ├── api.types.ts          # Tipos de API (ApiResponse, etc.)
│   │   └── entities.types.ts     # Tipos de entidades (Estados, etc.)
│   ├── hooks/                    # Hooks reutilizables
│   └── utils/                    # Utilidades compartidas
│
├── modules/                      # Módulos de negocio
│   ├── pesaje/                   # Módulo: Pesaje de camiones
│   ├── tropas/                   # Módulo: Gestión de tropas
│   ├── faena/                    # Módulo: Ciclo de faena
│   ├── stock/                    # Módulo: Gestión de stock
│   ├── reportes/                 # Módulo: Reportes
│   ├── facturacion/              # Módulo: Facturación
│   ├── configuracion/            # Módulo: Configuración
│   ├── subproductos/             # Módulo: Subproductos
│   ├── trazabilidad/             # Módulo: Trazabilidad
│   ├── ciclo2/                   # Módulo: Ciclo II (Despostada)
│   ├── calidad/                  # Módulo: Calidad
│   ├── cumplimiento/             # Módulo: Cumplimiento regulatorio
│   └── administracion/           # Módulo: Administración
│
├── components/                   # Componentes UI
│   └── ui/                       # Componentes shadcn/ui
│
├── lib/                          # Utilidades de biblioteca
│   ├── db.ts                     # Cliente Prisma singleton
│   ├── utils.ts                  # Utilidades varias
│   ├── validations.ts            # Esquemas Zod
│   └── rate-limiter.ts           # Limitador de tasa
│
└── hooks/                        # Hooks globales
```

## Módulos de Negocio

Cada módulo es autónomo y contiene:

```
modules/[modulo]/
├── index.ts          # Fachada del módulo (exports públicos)
├── components/       # Componentes específicos del módulo
├── services/         # Lógica de negocio
├── repositories/     # Acceso a datos
├── types/            # Tipos TypeScript
├── hooks/            # Hooks específicos
├── constants/        # Constantes y configuración
└── utils/            # Utilidades del módulo
```

## Patrones de Diseño Implementados

### 1. Repository Pattern
```typescript
// BaseRepository proporciona operaciones CRUD genéricas
export class TropaRepository extends BaseRepository<Tropa> {
  protected model = db.tropa
  
  // Métodos específicos del dominio
  async findActivas(): Promise<Tropa[]> { ... }
}
```

### 2. Service Layer Pattern
```typescript
// BaseService encapsula lógica de negocio
export class TropaService extends BaseService<Tropa> {
  protected repository = new TropaRepository()
  
  async crearTropa(data: TropaCreate): Promise<Tropa> { ... }
}
```

### 3. Event Bus (Observer)
```typescript
// Comunicación desacoplada entre módulos
eventBus.emit('tropa.creada', nuevaTropa)
eventBus.on('tropa.creada', async (tropa) => {
  // Reaccionar al evento
})
```

### 4. Facade Pattern
```typescript
// Cada módulo expone una fachada limpia
// modules/pesaje/index.ts
export { PesajeCamionesModule } from './components/PesajeModule'
export { PesajeService } from './services/pesaje.service'
export type { Pesaje, PesajeCreate } from './types'
```

## Beneficios de esta Arquitectura

| Beneficio | Descripción |
|-----------|-------------|
| **Escalabilidad** | Nuevos módulos sin afectar existentes |
| **Mantenibilidad** | Cambios aislados por dominio |
| **Testabilidad** | Cada módulo es testeable independientemente |
| **Colaboración** | Equipos pueden trabajar en dominios separados |
| **Reutilización** | Componentes y servicios reutilizables |
| **Desacoplamiento** | Módulos independientes entre sí |

## Eventos del Sistema

El bus de eventos soporta:

| Evento | Descripción |
|--------|-------------|
| `tropa.creada` | Nueva tropa registrada |
| `tropa.actualizada` | Tropa modificada |
| `animal.pesado` | Animal pesado individualmente |
| `faena.iniciada` | Inicio de proceso de faena |
| `faena.completada` | Proceso de faena terminado |
| `romaneo.completado` | Romaneo finalizado |
| `stock.actualizado` | Cambio en stock |
| `factura.generada` | Factura emitida |

## Cómo Agregar un Nuevo Módulo

1. Crear carpeta en `/src/modules/[nombre]/`
2. Crear archivo `index.ts` con exports
3. Crear tipos en `types/`
4. Crear servicio en `services/`
5. Crear componentes en `components/`
6. Registrar en `/src/modules/index.ts`
7. Agregar ruta en NAV_GROUPS (page.tsx)

## Migración desde Código Existente

Los componentes existentes en `/src/components/` se mantienen y son re-exportados desde los módulos. Esto permite:
- Transición gradual
- Sin breaking changes
- Funcionalidad preservada

## Versión

- **Versión actual**: v2.5.0
- **Arquitectura**: Modular con Domain-Driven Design
- **Framework**: Next.js 16 + TypeScript
