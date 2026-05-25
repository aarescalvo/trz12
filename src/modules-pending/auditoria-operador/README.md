# Módulo: Auditoría por Operador

## Prioridad: ALTA

## Descripción
Sistema completo de registro y consulta de auditoría para rastrear todas las acciones realizadas por los operadores en el sistema.

## Funcionalidades

### Historial de Auditoría
- **Filtros Avanzados**:
  - Por operador
  - Por módulo
  - Por tipo de acción (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, ERROR)
  - Por rango de fechas
  - Búsqueda por descripción
- **Paginación** para grandes volúmenes de datos
- **Detalle completo** de cada acción con datos antes/después

### Estadísticas por Operador
- Ranking de actividad
- Conteos por tipo de acción:
  - Creaciones
  - Actualizaciones
  - Eliminaciones
  - Logins
  - Errores
- Último acceso registrado

### Exportación
- Exportar a CSV
- Exportar a Excel (pendiente)

### Tipos de Acciones Rastreadas
| Acción | Descripción | Color |
|--------|-------------|-------|
| CREATE | Creación de registros | Verde |
| UPDATE | Actualización de registros | Azul |
| DELETE | Eliminación de registros | Rojo |
| LOGIN | Inicio de sesión | Púrpura |
| LOGOUT | Cierre de sesión | Gris |
| ERROR | Errores del sistema | Rojo |
| VIEW | Visualización de datos | Gris |

### Módulos Rastreados
- Pesaje Camiones
- Pesaje Individual
- Movimiento Hacienda
- Lista de Faena
- Romaneo
- Menudencias
- Cueros
- Rendering
- Despachos
- Facturación
- Configuración
- Autenticación
- Y más...

## Dependencias
- `@/components/ui/*` - Componentes de UI
- `lucide-react` - Iconos
- `sonner` - Notificaciones toast

## Modelos Prisma Utilizados
- `Auditoria` - Registro de auditoría
- `Operador` - Información del operador

## APIs Requeridas

### Endpoints existentes
- `GET /api/auditoria` - Listar auditoría con filtros
- `POST /api/auditoria` - Registrar evento

### Endpoints a crear
- `GET /api/auditoria/stats` - Estadísticas por operador
- `GET /api/auditoria/por-modulo` - Actividad por módulo
- `GET /api/auditoria/por-dia` - Actividad por día
- `GET /api/auditoria/exportar` - Exportar a CSV/Excel
- `POST /api/auditoria/limpiar` - Limpiar registros antiguos

## Cómo Implementar

1. **Agregar al menú de navegación**:
```typescript
// En page.tsx, NAV_GROUPS (en Configuración)
{ id: 'auditoriaOperador', label: 'Auditoría', icon: History, permiso: 'puedeConfiguracion' }
```

2. **Agregar import**:
```typescript
import { AuditoriaOperadorModule } from '@/modules-pending/auditoria-operador'
```

3. **Agregar caso en switch**:
```typescript
case 'auditoriaOperador':
  return wrapModule('auditoriaOperador', <AuditoriaOperadorModule operador={operador} />)
```

4. **Crear APIs faltantes** (si no existen)

## Consideraciones de Seguridad
- Solo usuarios con permiso `puedeConfiguracion` pueden acceder
- Los datos sensibles (datosAntes/datosDespues) deben ser visibles solo para ADMINISTRADORES
- La limpieza de auditoría requiere rol ADMINISTRADOR

## Mejoras Futuras
- [ ] Gráficos de actividad temporal
- [ ] Alertas por actividad sospechosa
- [ ] Integración con notificaciones
- [ ] Retención configurable de datos
- [ ] Comparación de cambios (diff visual)

## Estado
- **Creado**: Pendiente de implementación
- **Versión**: 3.7.17
