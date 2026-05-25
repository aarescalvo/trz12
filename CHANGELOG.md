# Changelog - Sistema Frigorífico

## [3.18.1] - 2026-04-30

### Agregado
- **Printer Bridge v3.0 (Python)**: Nuevo bridge TCP→USB para Windows 7
  - Compatible con Python 3.8.10 (última versión para Windows 7)
  - Usa `win32print` (pywin32) para impresión RAW directa a impresora USB
  - Servidor TCP puerto 9100: recibe ZPL/DPL desde TrazAlan
  - Servidor HTTP puerto 9101: panel web de control, diagnóstico, prueba de impresión
  - Detección automática de formato (ZPL vs DPL vs RAW)
  - Etiqueta de prueba DPL nativa para Datamax Mark II
  - Etiqueta de prueba ZPL para Zebra
  - Scripts de instalación: install.bat, start.bat, install-service.bat, uninstall-service.bat
  - Servicio Windows para auto-inicio con el sistema
  - Documentación completa con solución de problemas
  - Ubicación: `mini-services/printer-bridge/python/`

### Arquitectura
```
TrazAlan → TCP :9100 → Python Bridge → win32print → USB Datamax Mark II
```

## [3.17.0] - 2026-04-20

### Agregado - Mejoras UX (20 items)

**Dashboard:**
- D1: Tarjetas de estadísticas clickeables que navegan a módulos correspondientes
- D2: Feed de actividad en tiempo real (últimos 10 movimientos)

**Pesaje Camiones:**
- PC1: Resumen visual antes de guardar (dialog con datos del vehículo, tropa, productor, tipos de animal, pesos)

**Pesaje Individual:**
- PI1: Modo producción pantalla completa (sidebar se oculta, vista simplificada)
- PI2: Barra de progreso X/Y animales pesados por tropa
- PI3: Feedback visual (flash verde) al registrar peso exitosamente

**Lista de Faena:**
- LF2: Tarjetas de tropa informativas con íconos de especie, bordes por estado, badges de corral
- LF4: Empty state mejorado con ícono y mensajes descriptivos

**Romaneo:**
- RO1: Modo producción con balanza integrada, vista fullscreen, últimos 3 items registrados
- T7: Atajos de teclado (Enter=registrar peso, Esc=salir dialogs/modo producción)

**Cuarteo:**
- CU3: Empty state mejorado con ícono Scissors y mensaje descriptivo

**Ciclo II - Producción:**
- C2-2: Diagrama visual de flujo (Ingreso → Desposte → Producción → Empaque → Stock) con estados activos/completados/pendientes

**Stock Cámaras:**
- SC2: Alertas de vencimiento inline (badges rojo "Vencido", ámbar "Vence en X días") con highlight de fila
- SC3: Filtros persistentes con sessionStorage

**Facturación:**
- FA1: Separación visual con tabs (Pendientes, Emitidas, Cobradas)
- FA2: Tarjetas resumen financiero (Total del Mes, Pendiente de Cobro, Vencidas)
- FA3: Timeline visual de factura (Emitida → Enviada → Cobrada)

**Configuración:**
- CF2: Command palette estilo VS Code (Ctrl+K) con secciones agrupadas por categoría

**Transversales:**
- SB1: Sidebar colapsable (w-16 iconos / w-64 completo)
- T6: Componente ConfirmDeleteDialog reutilizable estandarizado
- T7: Atajos de teclado en Pesaje Individual y Romaneo

### Corregido (QA v3.17.0)
- pesaje-camiones: Bug crítico - referencia a variable `tropaSeleccionada` inexistente en validación del botón guardar, reemplazada por validaciones correctas (usuarioFaenaId, totalCabezas, corralId)
- page.tsx: Imports no utilizados eliminados (ChevronLeft, ChevronRightIcon)
- stock-camaras: Import Filter no utilizado eliminado
- facturacion: Badge "Facturas Vencidas" renderizaba array en vez de count
- romaneo: Interface AsignacionGarron faltaban propiedades productorNombre/Cuit/Matricula
- lista-faena: Dialog "Quitar Tropa" no se abría cuando requería confirmación
- pesaje-camiones: Ticket # se renderizaba como string literal en vez del número formateado
- pesaje-camiones: Imports no utilizados (useCallback, Plus, Eye, Minus, X)
- facturacion: Imports no utilizados (Calendar, User, ArrowDownToLine)
- cuarteo: Import Textarea no utilizado
- stock-camaras: Inconsistencia en umbrales de vencimiento (23 vs 21 días) unificados a 21
- stock-camaras: Referencia muerta a proximoVencer eliminada

### Verificado (QA v3.17.0)
- Build: Compilación exitosa sin errores
- Permisos: Todos los módulos respetan el sistema de permisos existente (puedePesajeCamiones, puedeRomaneo, etc.)
- APIs: 47 endpoints verificados, todos existen y usan rutas relativas
- Iconos: Todos los íconos de lucide-react verificados (versión 0.525.0)
- Modo producción: Evento `production-mode-change` funciona correctamente entre Romaneo/Pesaje Individual y el sidebar

## [0.5.0] - 2025-03-18

### Agregado
- **Sistema de Plantillas ZPL desde Zebra Designer**:
  - Importación de archivos .zpl, .prn, .txt desde Zebra Designer
  - Detección automática de variables en formato {{VAR}} y &VAR&
  - Mapeo inteligente a campos del sistema (30+ variables soportadas)
  - Vista previa de ZPL con datos de prueba
  - Copiar ZPL al portapapeles
  - Descargar ZPL procesado

- **APIs para plantillas ZPL**:
  - `POST /api/rotulos/upload-zpl`: Subir archivos ZPL
  - `GET/POST /api/rotulos/procesar-zpl`: Procesar ZPL con datos
  - `GET/POST /api/rotulos/imprimir`: Imprimir rótulos (ambos tipos)

- **Variables ZPL soportadas**:
  - FECHA, FECHA_FAENA → fechaFaena
  - FECHA_VENC, FECHA_VENCIMIENTO → fechaVencimiento
  - TROPA, TROPA_CODIGO → tropa
  - GARRON, NUMERO_GARRON → garrón
  - PESO, PESO_KG → peso
  - PRODUCTO, NOMBRE_PRODUCTO → nombreProducto
  - ESTABLECIMIENTO → establecimiento
  - NRO_ESTABLECIMIENTO → número de establecimiento
  - USUARIO_FAENA, NOMBRE_USUARIO_FAENA → usuario de faena
  - CUIT_PRODUCTOR, CUIT_USUARIO → CUITs
  - MATRICULA → matrícula
  - CODIGO_BARRAS, BARRAS → código de barras
  - Y más...

- **Interfaz actualizada**:
  - Tabs para Editor Drag & Drop vs Zebra Designer
  - Indicadores visuales para tipo de plantilla (EDITOR/ZPL)
  - Estadísticas separadas por tipo de rótulo
  - Modal de importación con preview del ZPL

- **Modelo de datos actualizado**:
  - Campo `tipoPlantilla` (EDITOR | ZPL)
  - Campo `contenidoZPL` para almacenar ZPL raw
  - Campo `camposZPL` para mapeo de variables
  - Campo `nombreArchivoZPL` para referencia

### Flujo de trabajo ZPL
1. Diseñar etiqueta en Zebra Designer con variables {{VAR}}
2. Exportar como archivo .zpl o .prn
3. Importar en el sistema con "Importar ZPL"
4. Al imprimir, las variables se reemplazan automáticamente

## [0.4.0] - 2025-03-17

### Agregado
- **Editor de Rótulos Drag & Drop**:
  - Canvas interactivo para diseño visual de etiquetas
  - 7 tipos de elementos: texto, campo dinámico, imagen, rectángulo, círculo, línea, código de barras
  - Drag & drop para mover elementos
  - Handles de resize en las 4 esquinas
  - Panel de propiedades completo (posición, tamaño, rotación, opacidad, colores, fuentes)
  - Control de capas (zIndex): subir/bajar elementos
  - Sistema de zoom 1x-6x (zoom inicial 3x)
  - Subida de logos/imágenes

- **Campos dinámicos del rótulo** (31 campos organizados por categoría):
  - **Faena**: fechaFaena, fechaVencimiento (calculada), tropa, garrón, tipificador, clasificación, peso, lado, nombreProducto, especie
  - **Establecimiento**: nombre, número, CUIT, matrícula, dirección, localidad, provincia
  - **Usuario de Faena**: nombre, CUIT, matrícula, dirección, localidad, provincia, teléfono
  - **Productor**: nombre, CUIT
  - **Otros**: código de barras, lote, N° SENASA, días de consumo, temperatura máxima

- **Campo calculado - Fecha de Vencimiento**:
  - Se calcula automáticamente: fecha actual + días de conservación
  - Indicador visual en el selector de campos

- **Selector de campos agrupado por categoría**:
  - Mejor organización visual
  - Indicador para campos calculados

### Corregido
- **Zoom del editor de rótulos**:
  - Zoom inicial aumentado de 1x a 3x
  - Zoom máximo aumentado de 2x a 6x
  - Incrementos de zoom de 0.5x

## [0.3.0] - 2025-01-17

### Corregido
- **Lista de Faena**: Stocks ahora visibles para agregar a la lista
  - Corregido API stock-corrales: campo `disponibles` (plural) en lugar de `disponible`
  - Agregado campo `tropaEspecie` y `usuarioFaena` como objeto
  - Estados de búsqueda corregidos de `PESADO,LISTO_FAENA` a `RECIBIDO,PESADO`
  
- **Lista de Faena**: Animales visibles en Ingreso a Cajón y Romaneo después de cerrar lista
  - API animales-hoy ahora busca listas CERRADA además de ABIERTA
  - Busca la lista más reciente con tropas asignadas

- **Lista de Faena**: Lista cerrada visible en "Lista Actual"
  - Priorización: ABIERTA hoy > CERRADA hoy > más reciente
  - Botón de imprimir disponible para listas cerradas

- **Lista de Faena**: Error al quitar tropas corregido
  - Cambiado `findUnique` por `findFirst` en DELETE
  - `corralId` pasado correctamente desde el componente
  - Orden de tropas preservado con `orderBy createdAt`

- **Base de datos**: Error "readonly database" corregido
  - APIs de escritura usan conexión Prisma fresca
  - Patrón `getPrisma()` con `datasourceUrl` explícito

- **EditableBlock**: Contenido visible en modo normal
  - Separación de modos de renderizado (normal vs edición)

## [0.2.0] - 2025-01-15

### Agregado
- Sistema WYSIWYG completo en 40+ módulos
  - TextoEditable para textos inline
  - EditableBlock para drag & drop
  - Persistencia en SQLite via API layout-modulo

- Módulos implementados:
  - CICLO I: Pesaje Camiones, Pesaje Individual, Movimiento Hacienda, Lista Faena, Ingreso Cajón, Romaneo, VB Romaneo, Expedición
  - CICLO II: Cuarteo, Ingreso Despostada, Movimientos Despostada, Cortes Despostada, Empaque
  - SUBPRODUCTOS: Menudencias, Cueros, Rendering
  - STOCKS: Insumos, Corrales, Cámaras
  - ADMINISTRACIÓN: Despachos, Facturación, Reportes SENASA
  - REPORTES: Planilla 01, Búsqueda Filtro, VB Faena
  - CALIDAD: Registro de Usuarios

## [0.1.0] - 2025-01-10

### Agregado
- Proyecto inicial Next.js 16 con TypeScript
- Sistema de autenticación con operadores
- Gestión de tropas y animales
- Módulos de pesaje
- Configuración del sistema
