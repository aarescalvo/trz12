# Módulos Pendientes - TrazaSole v3.7.17

Este directorio contiene todos los módulos pendientes de implementación en el sistema TrazaSole.

## Resumen

| Total | Alta Prioridad | Media Prioridad | Baja Prioridad |
|-------|----------------|-----------------|----------------|
| 10    | 2              | 5               | 3              |

---

## Módulos de ALTA PRIORIDAD

### 1. Rotulos/Labels Mejoras
- **Directorio**: `rotulos-mejoras/`
- **Estado**: Creado, pendiente de implementación
- **Descripción**: Editor visual avanzado para diseñar etiquetas ZPL/DPL para impresoras Zebra y Datamax.
- **Funcionalidades**:
  - Editor drag & drop de elementos
  - Soporte para Zebra (ZPL) y Datamax (DPL)
  - Vista previa en tiempo real
  - Variables dinámicas {{VARIABLE}}
  - Exportación/importación de plantillas
- **Archivos**: `index.tsx`, `types.ts`, `api.ts`, `README.md`

### 2. Auditoría por Operador
- **Directorio**: `auditoria-operador/`
- **Estado**: Creado, pendiente de implementación
- **Descripción**: Sistema completo de registro y consulta de auditoría para rastrear acciones de operadores.
- **Funcionalidades**:
  - Historial completo de acciones
  - Filtros avanzados (operador, módulo, acción, fecha)
  - Estadísticas por operador
  - Exportación a CSV/Excel
  - Detalle con datos antes/después
- **Archivos**: `index.tsx`, `types.ts`, `api.ts`, `README.md`

---

## Módulos de MEDIA PRIORIDAD

### 3. Historial de Precios
- **Directorio**: `historial-precios/`
- **Estado**: Creado, pendiente de implementación
- **Descripción**: Gestión y seguimiento de precios para productos, servicios e insumos.
- **Funcionalidades**:
  - Registro de cambios de precio
  - Variación porcentual automática
  - Análisis de tendencias
  - Soporte multi-moneda
- **Archivos**: `index.tsx`, `types.ts`, `api.ts`, `README.md`

### 4. Reportes Gerenciales
- **Directorio**: `reportes-gerenciales/`
- **Estado**: Creado, pendiente de implementación
- **Descripción**: Panel de indicadores clave del negocio para toma de decisiones.
- **Funcionalidades**:
  - KPIs de faena, rinde, stock, ingresos
  - Gráficos de tendencias
  - Comparación con períodos anteriores
  - Exportación de reportes
- **Archivos**: `index.tsx`, `README.md`

### 5. Dashboard Ejecutivo
- **Directorio**: `dashboard-ejecutivo/`
- **Estado**: Creado, pendiente de implementación
- **Descripción**: Panel de control para supervisores y administradores.
- **Funcionalidades**:
  - KPIs principales en tiempo real
  - Sistema de alertas
  - Solo visible para ADMINISTRADOR
- **Archivos**: `index.tsx`, `README.md`

### 6. Control de Vencimientos FIFO
- **Directorio**: `control-vencimientos/`
- **Estado**: Creado, pendiente de implementación
- **Descripción**: Sistema de control de vencimientos para stock con gestión FIFO.
- **Funcionalidades**:
  - Alertas por niveles (crítico, próximo, normal)
  - Filtrado por urgencia
  - Sugerencias de despacho FIFO
- **Archivos**: `index.tsx`, `README.md`

### 7. Alertas de Stock
- **Directorio**: `alertas-stock/`
- **Estado**: Creado, pendiente de implementación
- **Descripción**: Sistema de alertas automáticas para stock bajo y crítico.
- **Funcionalidades**:
  - Alertas configurables por producto
  - Niveles: BAJO, CRÍTICO
  - Notificaciones automáticas
- **Archivos**: `index.tsx`, `README.md`

---

## Módulos de BAJA PRIORIDAD

### 8. Sincronización SIGICA
- **Directorio**: `sincronizacion-sigica/`
- **Estado**: Creado, pendiente de implementación
- **Descripción**: Integración con el sistema SIGICA de SENASA.
- **Funcionalidades**:
  - Verificación de conexión
  - Envío automático de datos
  - Historial de sincronizaciones
- **Archivos**: `index.tsx`, `README.md`

### 9. Integración AFIP
- **Directorio**: `integracion-afip/`
- **Estado**: Creado, pendiente de implementación
- **Descripción**: Integración con servicios web de AFIP para facturación electrónica.
- **Funcionalidades**:
  - Configuración de certificado digital
  - Facturación electrónica
  - Obtención de CAE
- **Archivos**: `index.tsx`, `README.md`

### 10. Stock Predictivo
- **Directorio**: `predictivo-stock/`
- **Estado**: Creado, pendiente de implementación
- **Descripción**: Sistema de predicción de stock basado en consumo histórico.
- **Funcionalidades**:
  - Análisis de consumo promedio
  - Predicción de días de cobertura
  - Sugerencias de compra
- **Archivos**: `index.tsx`, `README.md`

---

## Cómo Implementar un Módulo

1. **Revisar el README.md** del módulo para entender su funcionalidad
2. **Crear APIs necesarias** según lo documentado
3. **Agregar modelos Prisma** si se requiere nueva persistencia
4. **Importar el módulo** en `src/app/page.tsx`:
   ```typescript
   import { NombreModule } from '@/modules-pending/nombre-modulo'
   ```
5. **Agregar al menú de navegación** en `NAV_GROUPS`:
   ```typescript
   { id: 'nombreModulo', label: 'Nombre', icon: Icono, permiso: 'puedeConfiguracion' }
   ```
6. **Agregar caso en el switch** de `renderPage()`:
   ```typescript
   case 'nombreModulo':
     return wrapModule('nombreModulo', <NombreModule operador={operador} />)
   ```
7. **Ejecutar `bun run lint`** para verificar errores
8. **Probar el módulo** en el navegador
9. **Mover el módulo** de `modules-pending/` a `components/` cuando esté listo

---

## Estructura de Archivos

Cada módulo contiene:
```
nombre-modulo/
├── index.tsx      # Componente principal React
├── types.ts       # Tipos TypeScript (opcional)
├── api.ts         # Funciones de API (opcional)
└── README.md      # Documentación del módulo
```

---

## Notas

- Estos módulos están **listos para implementar** pero no están integrados en el sistema principal
- No modificar archivos existentes hasta que el módulo esté probado
- Seguir el flujo de trabajo documentado en cada README.md
- Verificar siempre con `bun run lint` después de cambios

---

**Creado**: 2026-01-XX
**Versión del sistema**: 3.7.17
**Total de módulos pendientes**: 10
