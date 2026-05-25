# 🖨️ INSTRUCTIVO DE CONFIGURACIÓN DE IMPRESORAS
## Sistema de Gestión Frigorífica - Solemar Alimentaria

---

## 📋 ÍNDICE

1. [Introducción](#introducción)
2. [Tipos de Impresoras](#tipos-de-impresoras)
3. [Requisitos Previos](#requisitos-previos)
4. [Configuración por Puesto](#configuración-por-puesto)
5. [Configuración Automática](#configuración-automática)
6. [Configuración de Etiquetas](#configuración-de-etiquetas)
7. [Configuración de Tickets](#configuración-de-tickets)
8. [Pruebas de Impresión](#pruebas-de-impresión)
9. [Solución de Problemas](#solución-de-problemas)

---

## 🔍 INTRODUCCIÓN

El sistema de impresión permite generar diferentes tipos de documentos según el puesto de trabajo: etiquetas de rótulos, tickets de pesaje, facturas y reportes oficiales.

### Puestos que Requieren Impresora

| Puesto | Tipo de Impresión | Impresora Recomendada |
|--------|-------------------|----------------------|
| Balanza Camiones | Tickets de pesaje | Térmica tickets |
| Romaneo | Etiquetas de rótulos | Térmica etiquetas |
| Facturación | Facturas/Remitos | Láser |
| Reportes | Reportes oficiales | Láser |

---

## 📦 TIPOS DE IMPRESORAS

### 1. Térmica de Etiquetas

```
Uso: Rótulos de medias/reses
Marcas comunes: Zebra, Datamax, Sato, Godex

Características:
- Imprime en material adhesivo
- Resolución: 203 o 300 DPI
- Ancho típico: 100-110 mm
- Conexión: USB, Red, Serial

Ejemplos:
- Zebra ZT410
- Datamax I-4212
- Sato CL4NX
- Godex G500
```

### 2. Térmica de Tickets

```
Uso: Tickets de pesaje, comprobantes
Marcas comunes: Epson, Star, Bixolon

Características:
- Papel térmico en rollo
- Ancho típico: 80 mm
- Sin cinta de tinta
- Corte automático

Ejemplos:
- Epson TM-T20III
- Star TSP143III
- Bixolon SRP-350III
```

### 3. Láser

```
Uso: Facturas, remitos, reportes
Marcas comunes: HP, Brother, Canon

Características:
- Alta calidad de impresión
- Papel común A4/Legal
- Rápida impresión
- Tóner de larga duración

Ejemplos:
- HP LaserJet Pro M404n
- Brother HL-L2350DW
- Canon imageCLASS MF445dw
```

### 4. Matricial

```
Uso: Formularios continuos, facturas preimpresas
Marcas comunes: Epson, OKI

Características:
- Imprime formularios con copias
- Mayor durabilidad
- Más lenta pero económica
- Cinta de tinta

Ejemplos:
- Epson LX-350
- OKI ML321
```

---

## ⚙️ REQUISITOS PREVIOS

### Hardware Necesario

- ✅ Impresora compatible
- ✅ Cable de conexión (USB, Red, Paralelo)
- ✅ Insumos (etiquetas, papel térmico, tóner)

### Software Necesario

- ✅ Drivers de la impresora instalados
- ✅ Impresora configurada en Windows
- ✅ Sistema Solemar Alimentaria funcionando

### Verificar Impresoras Instaladas

```cmd
:: Ver impresoras
wmic printer get name,default

:: O en PowerShell
Get-Printer | Select-Object Name, PortName, DriverName
```

---

## 💻 CONFIGURACIÓN POR PUESTO

### Balanza Camiones

```
Tipo de impresión: Tickets de pesaje
Impresora recomendada: Térmica tickets 80mm
Tamaño de papel: 80mm x 150mm (rollo)

Información impresa:
- Número de ticket
- Fecha y hora
- Número de tropa
- Peso bruto
- Peso tara
- Peso neto
- Operador
```

### Romaneo

```
Tipo de impresión: Etiquetas de rótulos
Impresora recomendada: Térmica etiquetas 100mm
Tamaño de etiqueta: 100mm x 50mm

Información impresa:
- Número de media
- Número de tropa
- Fecha de faena
- Peso
- Clasificación
- Destino
- Código de barras
```

### Facturación

```
Tipo de impresión: Facturas y remitos
Impresora recomendada: Láser A4
Tamaño de papel: A4 (210mm x 297mm)

Documentos:
- Facturas A/B/C
- Remitos
- Notas de crédito/débito
- Comprobantes de despacho
```

### Reportes

```
Tipo de impresión: Reportes oficiales
Impresora recomendada: Láser A4
Tamaño de papel: A4 o Legal

Documentos:
- Reportes a SENASA
- Stock de cámaras
- Rendimientos
- Estadísticas
```

---

## 🚀 CONFIGURACIÓN AUTOMÁTICA

### Paso 1: Instalar la Impresora

1. Conecte la impresora a la PC
2. Instale los drivers del fabricante
3. Configure en Windows:
   ```
   Panel de Control → Dispositivos e Impresoras → Agregar impresora
   ```

### Paso 2: Ejecutar el Configurador

```
Ejecutar como Administrador:
install\client\config-impresora.bat
```

### Paso 3: Seguir el Asistente

1. **Seleccionar puesto de trabajo**
   - Balanza Camiones
   - Romaneo
   - Facturación
   - Reportes

2. **Seleccionar impresora**
   - Se detectan automáticamente las instaladas

3. **Especificar tipo de impresora**
   - Térmica Etiquetas
   - Térmica Tickets
   - Láser
   - Inyección
   - Matricial

4. **Configurar etiqueta** (solo térmica etiquetas)
   - Ancho en mm
   - Alto en mm
   - Resolución DPI

5. **Establecer como impresora por defecto** (opcional)

### Paso 4: Probar Impresión

El configurador ofrece imprimir una página de prueba.

### Paso 5: Registrar en el Sistema Web

1. Abra el navegador: `http://[IP-SERVIDOR]:3000`
2. Vaya a: **Configuración → Impresoras**
3. Haga clic en **Nueva Impresora**
4. Complete los datos según corresponda

---

## 🏷️ CONFIGURACIÓN DE ETIQUETAS

### Especificaciones Técnicas

| Parámetro | Valor Típico | Descripción |
|-----------|--------------|-------------|
| Ancho | 100 mm | Ancho de la etiqueta |
| Alto | 50 mm | Alto de la etiqueta |
| DPI | 203 | Resolución de impresión |
| Gap | 2 mm | Espacio entre etiquetas |
| Margen Sup. | 2 mm | Margen superior |
| Margen Izq. | 2 mm | Margen izquierdo |

### Diseño de Rótulo Estándar

```
┌─────────────────────────────────────┐
│  SOLEMAR ALIMENTARIA S.A.           │
│  ───────────────────────────────    │
│  Media: 001234    Tropa: T-0045     │
│  Fecha: 07/03/2026                  │
│  Peso: 125.5 kg                     │
│  Clas.: A                           │
│  ───────────────────────────────    │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│  ▓  001234  ▓  ▓  ▓  ▓  ▓  ▓  ▓  ▓ │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│           Código de barras          │
└─────────────────────────────────────┘
```

### Configuración Zebra (ZPL)

```
^XA
^PW800
^LL400
^FO50,30^A0N,30,30^FD SOLEMAR ALIMENTARIA S.A.^FS
^FO50,70^A0N,25,25^FD Media: 001234^FS
^FO350,70^A0N,25,25^FD Tropa: T-0045^FS
^FO50,110^A0N,25,25^FD Fecha: 07/03/2026^FS
^FO50,150^A0N,25,25^FD Peso: 125.5 kg^FS
^FO250,150^A0N,25,25^FD Clas.: A^FS
^FO50,200^BY3,3,100^BCN,100,Y,N,N^FD001234^FS
^XZ
```

---

## 🎫 CONFIGURACIÓN DE TICKETS

### Especificaciones Técnicas

| Parámetro | Valor Típico |
|-----------|--------------|
| Ancho de papel | 80 mm |
| Diámetro rollo | 80 mm |
| Tipo | Térmico |

### Diseño de Ticket Estándar

```
╔══════════════════════════════════════╗
║     SOLEMAR ALIMENTARIA S.A.         ║
║     TICKET DE PESAJE                 ║
╠══════════════════════════════════════╣
║  Ticket:  00001234                   ║
║  Fecha:   07/03/2026  14:35          ║
║  Tropa:   T-0045                     ║
╠══════════════════════════════════════╣
║  Peso Bruto:   25,500 kg             ║
║  Peso Tara:     8,200 kg             ║
║  ─────────────────────               ║
║  Peso Neto:    17,300 kg             ║
╠══════════════════════════════════════╣
║  Operador:   Juan Pérez              ║
║  Observaciones:                      ║
║  __________________________________  ║
╚══════════════════════════════════════╝
```

---

## ✅ PRUEBAS DE IMPRESIÓN

### Prueba desde Windows

```cmd
:: Imprimir página de prueba
rundll32 printui.dll,PrintUIEntry /k /n "Nombre de impresora"

:: Imprimir archivo de texto
notepad /p "archivo.txt"
```

### Prueba desde el Sistema

1. Acceda al módulo correspondiente
2. Realice una operación que genere impresión
3. Verifique que la impresora produzca el documento

### Verificar Cola de Impresión

```cmd
:: Ver trabajos en cola
wmic printjob get name,jobstatus

:: O en PowerShell
Get-PrintJob -PrinterName "Nombre de impresora"
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### La impresora no imprime

```
Causas posibles:
1. Impresora sin papel/insumos
2. Impresora en pausa
3. Cola de impresión bloqueada
4. Conexión física fallida

Solución:
1. Verificar papel, etiquetas, tóner
2. Panel de Control → Ver impresoras → Reanudar
3. Limpiar cola: net stop spooler && net start spooler
4. Verificar cables y conexión
```

### Impresión borrosa o ilegible

```
Causas posibles:
1. Bajo nivel de tóner/tinta
2. Cabezal sucio (térmicas)
3. Resolución incorrecta

Solución:
1. Reemplazar tóner/cartucho
2. Limpiar cabezal con alcohol isopropílico
3. Verificar configuración DPI
```

### Etiquetas desalineadas

```
Causas posibles:
1. Calibración incorrecta
2. Tamaño de etiqueta mal configurado
3. Gap mal medido

Solución:
1. Ejecutar calibración de la impresora
2. Verificar dimensiones en el driver
3. Ajustar sensor de gap según manual
```

### La impresora térmica imprime caracteres extraños

```
Causas posibles:
1. Driver incorrecto
2. Emulación mal configurada
3. Fuente no instalada

Solución:
1. Instalar driver del fabricante
2. Configurar emulación correcta (ZPL, EPL, etc.)
3. Usar fuentes internas de la impresora
```

### Error de acceso denegado a impresora de red

```
Causas posibles:
1. Permisos insuficientes
2. Impresora no compartida
3. Firewall bloqueando

Solución:
1. Verificar permisos en el servidor de impresión
2. Habilitar uso compartido
3. Abrir puertos en firewall (9100, 515)
```

---

## 📞 SOPORTE

Para asistencia técnica adicional:

- **Sistema**: Solemar Alimentaria
- **Repositorio**: https://github.com/aarescalvo/zaisoleweb

---

*Última actualización: Marzo 2026*
