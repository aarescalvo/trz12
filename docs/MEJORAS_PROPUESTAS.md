# 🚀 MEJORAS PROPUESTAS - SOLEMAR ALIMENTARIA

---

## 🔴 CRÍTICAS (Implementar primero)

### 1. Dividir page.tsx en rutas separadas
**Problema:** page.tsx tiene 580 líneas y carga todos los módulos
**Solución:** Usar App Router con layouts y dynamic imports

```typescript
// Estructura propuesta:
/src/app/
├── (auth)/
│   └── login/page.tsx
├── (dashboard)/
│   ├── layout.tsx
│   ├── page.tsx              # Dashboard
│   ├── pesaje-camiones/page.tsx
│   ├── lista-faena/page.tsx
│   ├── romaneo/page.tsx
│   └── ...
```

**Beneficio:** Code splitting automático, carga bajo demanda

---

### 2. Modularizar componentes grandes (>600 líneas)

| Componente | Líneas | Propuesta |
|------------|--------|-----------|
| declaracion-jurada.tsx | 833 | Dividir en: Formulario, Tabla, PrintTemplate |
| ingresreso-cajon.tsx | 795 | Dividir en: SelectorMedia, AsignacionCamara, Movimientos |
| facturacion.tsx | 787 | Dividir en: FormularioFactura, TablaFacturas, Detalle |
| ccir.tsx | 745 | Dividir en: FormularioCCIR, TablaCCIR, PrintTemplate |
| stock-camaras.tsx | 708 | Dividir en: VistaCamara, StockList, Movimientos |
| romaneo.tsx | 616 | Dividir en: TropaSelector, PesajePanel, ProximosPanel |
| lista-faena.tsx | 604 | Dividir en: TropaSelector, GarronAssignment, EstadoPanel |

**Ejemplo de estructura:**
```
/src/components/romaneo/
├── index.tsx           # Main container
├── TropaSelector.tsx   # Panel izquierdo
├── PesajePanel.tsx     # Panel central
├── ProximosPanel.tsx   # Panel derecho
├── hooks/
│   └── useRomaneo.ts   # Lógica de estado
├── types.ts            # Tipos
└── utils.ts            # Utilidades
```

---

### 3. Desactivar log de queries en producción

**Archivo:** `/src/lib/db.ts`
```typescript
// ❌ Actual
export const db = new PrismaClient({ log: ['query'] });

// ✅ Propuesto
export const db = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
```

---

## 🟠 IMPORTANTES (Segunda prioridad)

### 4. Implementar paginación en APIs

**Problema:** Todas las APIs devuelven todos los registros
**Solución:** Agregar limit/offset

```typescript
// Ejemplo:
GET /api/tropas?limit=20&offset=0

// API response:
{
  data: [...],
  pagination: {
    total: 150,
    limit: 20,
    offset: 0,
    hasMore: true
  }
}
```

---

### 5. Crear componentes UI compartidos

**Componentes reutilizables identificados:**
- `SearchBar` - Barra de búsqueda con filtros
- `DataTable` - Tabla con sorting, paginación, selección
- `FormDialog` - Diálogo de formulario estándar
- `ConfirmDialog` - Diálogo de confirmación
- `StatusBadge` - Badge de estado con colores
- `PrintButton` - Botón de impresión con preview

```typescript
// /src/components/shared/index.ts
export { SearchBar } from './SearchBar';
export { DataTable } from './DataTable';
export { FormDialog } from './FormDialog';
// ...
```

---

### 6. Extraer tipos TypeScript

**Crear:** `/src/types/`
```
/src/types/
├── index.ts         # Re-export todos
├── tropa.ts         # Tropa, TropaWithRelations, etc.
├── animal.ts        # Animal, AnimalWithTropa
├── pesaje.ts        # PesajeCamion, PesajeInput
├── romaneo.ts       # Romaneo, MediaRes, GarronState
├── api.ts           # ApiResponse, PaginatedResponse
└── enums.ts         # Todos los enums
```

---

### 7. Implementar React Query

**Problema:** Fetch manual en cada componente, sin cache
**Solución:** TanStack Query

```typescript
// /src/hooks/useTropas.ts
import { useQuery } from '@tanstack/react-query';

export function useTropas(filters) {
  return useQuery({
    queryKey: ['tropas', filters],
    queryFn: () => fetch('/api/tropas?' + new URLSearchParams(filters)).then(r => r.json()),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
```

---

## 🟡 DESEABLES (Tercera prioridad)

### 8. Lazy loading de módulos

```typescript
// page.tsx actual
import { RomaneoModule } from '@/components/romaneo';

// Propuesto
const RomaneoModule = dynamic(() => import('@/components/romaneo'), {
  loading: () => <RomaneoSkeleton />,
  ssr: false
});
```

---

### 9. Error Boundaries

```typescript
// /src/components/ErrorBoundary.tsx
export class ModuleErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ModuleErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
```

---

### 10. Loading Skeletons

```typescript
// /src/components/skeletons/
├── TableSkeleton.tsx
├── CardSkeleton.tsx
├── FormSkeleton.tsx
└── DashboardSkeleton.tsx
```

---

### 11. API Client Abstraction

**Crear:** `/src/lib/api-client.ts`

```typescript
class ApiClient {
  private baseUrl = '/api';

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(this.baseUrl + path, window.location.origin);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url);
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  }

  async post<T>(path: string, data: unknown): Promise<T> { ... }
  async put<T>(path: string, data: unknown): Promise<T> { ... }
  async delete<T>(path: string): Promise<T> { ... }
}

export const api = new ApiClient();
```

---

## 📊 MÉTRICAS DE MEJORA ESPERADAS

| Métrica | Actual | Esperado | Mejora |
|---------|--------|----------|--------|
| Bundle inicial | ~2MB | ~400KB | 80% menos |
| Tiempo carga inicial | ~4s | ~1s | 75% más rápido |
| Líneas por archivo | 800+ | 300- | 60% menos |
| Re-renders innecesarios | Alto | Bajo | Memoización |
| Código duplicado | Alto | Bajo | Componentes shared |

---

## 🗓️ PLAN DE IMPLEMENTACIÓN

### Fase 1 (Semana 1)
1. Desactivar query logging
2. Crear directorio /src/types/
3. Extraer enums a archivo compartido

### Fase 2 (Semana 2-3)
4. Dividir page.tsx en rutas
5. Modularizar componentes > 700 líneas

### Fase 3 (Semana 4-5)
6. Implementar paginación
7. Crear componentes compartidos

### Fase 4 (Semana 6+)
8. React Query
9. Error boundaries
10. Loading skeletons

---

*Documento de mejoras - Generado automáticamente*
