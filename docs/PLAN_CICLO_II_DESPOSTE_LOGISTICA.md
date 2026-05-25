================================================================================
PLAN MAESTRO DE IMPLEMENTACIÓN: CICLO II (DESPOSTE Y LOGÍSTICA) - PRODUCCION4Z
================================================================================

1. OBJETIVO DEL MÓDULO
Transformar la unidad "Media Res" (Ciclo I) en "Cortes/Cajas" (Ciclo II), 
manteniendo trazabilidad total, control de rendimientos (rindes), gestión 
automática de insumos, sistema FIFO y despacho logístico.

2. ARQUITECTURA DE BASE DE DATOS (NUEVAS TABLAS)

A. MAESTROS (Configuración)
- c2_rubros: (id, nombre, descripcion) -> Ej: Cortes, Menudencias, Elaborados.
- c2_productos: (id, rubro_id, nombre, cod_interno, gtin, dias_vence, temp_min, temp_max, peso_tara_caja).
- c2_insumos: (id, nombre, tipo [Bolsa, Caja, Etiqueta], stock_actual, stock_minimo, unidad_medida).
- c2_bom (Bill of Materials): (id, producto_id, insumo_id, cantidad_por_unidad) -> Para descuento automático.

B. PROCESO DE TRANSFORMACIÓN
- c2_cuarteo_pesos: (id, faena_id [FK de Ciclo I], peso_trasero, peso_delantero, peso_asado, fecha_cuarteo, usuario_id).
  *Nota: Se usa el código de barras de la Media Res original para identificar estos pesos.*
- c2_ingreso_desposte: (id, faena_id, fecha_ingreso, peso_total_ingreso, estado [En Proceso, Finalizado]).

C. PRODUCCIÓN Y EMPAQUE
- c2_produccion_cajas: (id, faena_id, producto_id, peso_neto, peso_bruto, piezas, fecha_faena, fecha_desposte, fecha_vence, lote_tropa, barcode_gs1_128, usuario_id, pallet_id, estado [En Stock, Despachado, Degradado]).
- c2_movimientos_degradacion: (id, caja_id_original, tipo [Trimming, Decomiso, Aprovechamiento], peso, motivo, nuevo_producto_id).
- c2_subproductos_pesaje: (id, faena_id, tipo [Hueso, Grasa, Incomestible], peso, fecha).

D. LOGÍSTICA
- c2_pallets: (id, sscc_code, producto_id, cantidad_cajas, peso_total, estado [Abierto, Cerrado, Despachado]).
- c2_expedicion_ordenes: (id, cliente_id, nro_remito, fecha_despacho, transporte_id).
- c2_expedicion_items: (id, orden_id, caja_id, pallet_id).

--------------------------------------------------------------------------------

3. ETAPAS DE IMPLEMENTACIÓN Y LÓGICA DE PROGRAMACIÓN

ETAPA 1: EL PUENTE (CUARTEO Y CÁMARA PULMÓN)
- Lógica: No se re-etiqueta. El sistema reconoce el ID de la Media Res. Al cuartear, se registran 3 pesos adicionales asociados a ese ID.
- Funcionalidad: Pantalla de "Pesaje de Cuarteo". Al escanear MR, habilita 3 inputs (Trasero, Delantero, Asado).
- Trazabilidad: El peso total de los 3 cuartos debe compararse contra el peso de la Media Res en caliente (Merma por oreo).

ETAPA 2: INGRESO A DESPOSTE Y CONTROL DE MASA
- Lógica: Al ingresar el cuarto a la sala, se escanea la etiqueta original. El sistema "resta" de stock de Cámara de Maduración y "suma" a Stock de Sala de Desposte.
- Objetivo: El sistema no debe permitir producir más kilos de cortes que los kilos de carne ingresados (Control de fraude).

ETAPA 3: MÓDULO DE PESAJE DE CORTES Y EMPAQUE (MODO OPERARIO)
- Interfaz: Pantalla táctil rápida. 
- Botones: "Pesaje Normal", "Degradación/Golpeado", "Trimming".
- Proceso de Degradación: Si un corte (ej: Lomo) está golpeado, el operario presiona "Degradar". El sistema pide pesar el descarte (Trimming) y el aprovechamiento. Ambos heredan la tropa pero cambian el código de producto.
- Insumos: Al confirmar el pesaje de una caja, un Trigger/Observer descuenta del stock de `c2_insumos` según la tabla `c2_bom`.

ETAPA 4: INTEGRACIÓN ZEBRA Y GS1-128
- Estructura del Código de Barras (Zebra ZPL):
  (01) GTIN_PRODUCTO
  (10) NRO_TROPA
  (11) FECHA_FAENA (YYMMDD)
  (13) FECHA_DESPOSTE (YYMMDD)
  (3102) PESO_NETO (000000)
  (21) SERIAL_UNICO_CAJA
- Programación: Servicio en Next.js que abra un socket TCP al puerto 9100 de la impresora Zebra y envíe el RAW ZPL.

ETAPA 5: SISTEMA FIFO Y EXPEDICIÓN
- Lógica FIFO: El query de stock para despacho DEBE estar ordenado por `fecha_faena` ASC.
- Validación: Al escanear una caja para despacho, el sistema verifica si existe en stock otra caja del mismo producto con una `fecha_faena` más antigua. Si existe, lanza Alerta Crítica.
- Palletizado: Función de agrupación. Un pallet solo puede contener un tipo de producto (o mixto según regla de negocio) y genera un código SSCC único.

--------------------------------------------------------------------------------

4. REPORTES Y RENDIMIENTOS (RINDES)

A. Reporte de Merma de Cuarteo:
   (Peso Media Res Caliente) - (Suma de Pesos 3 Cuartos) = % Merma Oreo.

B. Reporte de Rinde de Desposte (Por Tropa/Día/Lote):
   Entrada: Suma Peso Cuartos.
   Salida: Suma Peso Cajas + Suma Peso Trimming + Suma Peso Subproductos (Hueso/Grasa).
   Cálculo: (Salida Total / Entrada Total) * 100.

C. Reporte de Degradación:
   Listado de cortes degradados por operario y por tropa para identificar problemas en el manejo de la hacienda o en la faena.

--------------------------------------------------------------------------------

5. PROMPT DE PROGRAMACIÓN PARA GENERACIÓN DE CÓDIGO (RESUMEN TÉCNICO)

"Actúa como desarrollador senior Next.js/TypeScript. Implementa el módulo de Ciclo II para 'produccion4z'. 
1. Crea las migraciones Prisma siguiendo la estructura de tablas definida anteriormente, usando llaves foráneas hacia las tablas de faena existentes.
2. Implementa un ServiceLayer llamado 'DesposteService' que maneje la lógica de transformación de Cuartos a Cajas.
3. El sistema de insumos debe ser automático: usa un Observer/Trigger en el modelo 'C2ProduccionCaja' que al crearse un registro, busque en 'C2_BOM' y descuente el stock de bolsas y cajas.
4. Crea un Middleware de FIFO que valide la fecha de faena en el módulo de expedición.
5. Diseña un Dashboard de Rindes usando SQL nativo para optimizar el cálculo de pesos entre miles de registros, agrupando por Tropa y Marca."

--------------------------------------------------------------------------------

NOTA: Este documento es un plan de implementación a futuro. Las tablas con prefijo "c2_" 
son NUEVAS y no deben confundirse con las tablas existentes del Ciclo I que ya están 
en producción. La implementación debe hacerse incrementalmente por etapa.

Versión del plan: v3.8.0
Fecha de actualización: 2026-04-15
Estado: PLANIFICACIÓN
