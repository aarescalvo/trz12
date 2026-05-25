# ❓ CONSULTAS PENDIENTES - SOLEMAR ALIMENTARIA

---

## 🔴 FUNCIONALES - Proceso Operativo

### 1. Balanza RS232
- **Módulo:** Pesaje Camiones, Romaneo
- **Pregunta:** ¿Qué puerto/baudios usa la balanza? ¿Protocolo de comunicación?
- **Impacto:** Conexión automática con balanzas

### 2. Impresión de Rótulos
- **Módulo:** Romaneo
- **Pregunta:** ¿Qué impresora se usa para rótulos? ¿Formato de etiqueta (tamaño)?
- **Impacto:** Generar comandos de impresión correctos

### 3. Numeración de Tropas
- **Módulo:** Pesaje Camiones
- **Pregunta:** ¿La numeración es anual (B20260001) o continua desde inicio de operaciones?
- **Impacto:** Generador de códigos de tropa

### 4. Cierre de Faena
- **Módulo:** Romaneo, Lista Faena
- **Pregunta:** ¿Qué sucede al cerrar una faena? ¿Se genera algún documento automáticamente?
- **Impacto:** Flujo de finalización de jornada

### 5. Decomiso
- **Módulo:** Romaneo
- **Pregunta:** ¿Qué destino tienen los decomisos? ¿Se registra en algún lado adicional?
- **Impacto:** Manejo de animales decomisados

---

## 🟡 DE NEGOCIO - Facturación y Regulatorios

### 6. Facturación
- **Módulo:** Facturación
- **Pregunta:** ¿Se factura por tropa o por servicio? ¿Qué conceptos se facturan?
- **Impacto:** Modelo de datos de facturación

### 7. CCIR
- **Módulo:** CCIR
- **Pregunta:** ¿Qué datos se requieren para el certificado CCIR? ¿Quién lo emite?
- **Impacto:** Formulario de CCIR

### 8. Declaración Jurada
- **Módulo:** DDJJ
- **Pregunta:** ¿Qué información debe contener? ¿Plazos de presentación?
- **Impacto:** Formato de DDJJ

### 9. Integración SENASA
- **Módulo:** Todos
- **Pregunta:** ¿Hay integración con sistemas de SENASA? ¿Se envían datos automáticamente?
- **Impacto:** Exportación de datos oficiales

---

## 🟢 TÉCNICAS - Arquitectura

### 10. Concurrencia
- **Pregunta:** ¿Cuántos operadores trabajan simultáneamente?
- **Impacto:** Optimistic locking, websockets para updates en tiempo real

### 11. Backup
- **Pregunta:** ¿Cómo se realizan los backups de la base de datos?
- **Impacto:** Script de backup automático

### 12. Multi-sucursal
- **Pregunta:** ¿Hay proyección de múltiples frigoríficos?
- **Impacto:** Arquitectura multi-tenant

---

## 📋 PREGUNTAS ESPECÍFICAS DEL SISTEMA ACTUAL

### 13. Estados de Tropa
**Confirmar flujo:**
```
RECIBIDO → EN_CORRAL → EN_FAENA → FAENADO → DESPOSTADO → DESPACHADO
                ↓
           EN_OBSERVACION
```
- ¿Es correcto este flujo?
- ¿Hay estados adicionales?

### 14. Tipos de Animal
**Confirmar tipos utilizados:**
```
BOVINOS: TO, VA, VQ, MEJ, NO, NT
EQUINOS: PO, MU, BU, YU, GA, PS
```
- ¿Se usan todos estos tipos?
- ¿Hay tipos personalizados por cliente?

### 15. Cámaras y Capacidad
**Confirmar capacidades:**
```
Cámara 1 (FAENA): 90 animales - ¿OK?
Cámara 2 (FAENA): 77 animales - ¿OK?
Cámara 3 (FAENA): 30 animales - ¿OK?
```

### 16. Menudencias
**Pregunta:** ¿Qué tipos de menudencias se registran?
- ¿Lista predefinida o configurable?
- ¿Se pesan individualmente?

### 17. Reportes
**Pregunta:** ¿Qué reportes son prioritarios?
- Faena diaria
- Rendimiento por tropa
- Stock en cámaras
- Facturación pendiente
- Otros...

---

## ✅ RESPUESTAS RECIBIDAS

### 1. Balanza RS232 ✓
**Respuesta:** Se configura en Configuración → Balanzas
**Implementación:** Crear tab de configuración de balanzas con:
- Puerto COM (ej: COM1, COM3, /dev/ttyUSB0)
- Baudios (9600, 19200, etc.)
- Protocolo (continuo, bajo demanda)
- Nombre descriptivo
- Activo/Inactivo

### 2. Impresión de Rótulos ✓
**Respuesta:** Se configura en Configuración → Impresoras
**Implementación:** Crear tab de configuración de impresoras con:
- Nombre de impresora
- Tipo (Térmica, Inyección, etc.)
- Ancho de etiqueta (mm)
- Alto de etiqueta (mm)
- Margen superior (mm)
- Margen izquierdo (mm)
- DPI
- Activa/Inactiva

### 3. Numeración de Tropas ✓
**Respuesta:** ANUAL - Formato {ESPECIE}{AÑO}{SECUENCIAL}
**Confirmado:** B20260001, B20260002... se reinicia cada año

### 4. Cierre de Faena ✓
**Respuesta:** Al cerrar una faena se generan:
1. **Romaneo de playa** - Resumen de medias pesadas
2. **Rendimiento por tropa** - Cálculo de kg gancho / peso vivo
3. **Generación stock cámaras** - Actualiza StockMediaRes
4. **Reportes a SIGICA** - Exportación para sistema oficial
5. **Stocks para despachos** - Prepara mercadería para entrega

**Flujo de cierre:**
```
Cerrar Lista Faena
       ↓
Generar Romaneo de Playa (PDF)
       ↓
Calcular Rendimiento por Tropa
       ↓
Actualizar Stock en Cámaras
       ↓
Generar archivo SIGICA
       ↓
Actualizar Stocks para Despacho
```

### 5. Integración SENASA ✓
**Respuesta:** Está planeada a desarrollar
**Estado:** Pendiente - Futura implementación

---

*Documento de consultas - Actualizar con cada sesión*
