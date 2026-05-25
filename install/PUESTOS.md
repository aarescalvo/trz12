# 📋 CONFIGURACIÓN RÁPIDA DE PUESTOS - SOLEMAR ALIMENTARIA

## Configuración por Puesto

### PUESTO 1: Balanza de Camiones

| Componente | Configuración |
|------------|---------------|
| **IP Servidor** | 192.168.1.100 |
| **Balanza** | Puerto COM1, 9600 baudios |
| **Impresora** | Térmica de tickets |
| **Módulos** | Pesaje Camiones, Ingresos |

**Script de configuración:**
```
install\client\config-puesto.bat
```

---

### PUESTO 2: Pesaje Individual

| Componente | Configuración |
|------------|---------------|
| **IP Servidor** | 192.168.1.100 |
| **Balanza** | Puerto COM1, 9600 baudios |
| **Impresora** | No requiere |
| **Módulos** | Pesaje Individual |

**Script de configuración:**
```
install\client\config-puesto.bat
```

---

### PUESTO 3: Ingreso a Cajón

| Componente | Configuración |
|------------|---------------|
| **IP Servidor** | 192.168.1.100 |
| **Balanza** | No requiere |
| **Impresora** | No requiere |
| **Módulos** | Ingreso a Cajón |

**Script de configuración:**
```
install\client\config-puesto.bat
```

---

### PUESTO 4: Romaneo / Playa

| Componente | Configuración |
|------------|---------------|
| **IP Servidor** | 192.168.1.100 |
| **Balanza** | Puerto COM1, 9600 baudios |
| **Impresora** | Térmica de etiquetas (rótulos) |
| **Módulos** | Romaneo |

**Script de configuración:**
```
install\client\config-puesto.bat
```

**Etiquetas de rótulos:**
- Ancho: 100mm
- Alto: 50mm
- DPI: 203

---

### PUESTO 5: Facturación

| Componente | Configuración |
|------------|---------------|
| **IP Servidor** | 192.168.1.100 |
| **Balanza** | No requiere |
| **Impresora** | Láser o inyección |
| **Módulos** | Facturación |

**Script de configuración:**
```
install\client\config-puesto.bat
```

---

### PUESTO 6: Configuración

| Componente | Configuración |
|------------|---------------|
| **IP Servidor** | 192.168.1.100 |
| **Balanza** | No requiere |
| **Impresora** | No requiere |
| **Módulos** | Configuración (todos) |

**Script de configuración:**
```
install\client\config-puesto.bat
```

---

### PUESTO 7: Supervisión

| Componente | Configuración |
|------------|---------------|
| **IP Servidor** | 192.168.1.100 |
| **Balanza** | No requiere |
| **Impresora** | No requiere |
| **Módulos** | Dashboard, Reportes, Auditoría |

**Script de configuración:**
```
install\client\config-puesto.bat
```

---

### PUESTO 8: Reportes

| Componente | Configuración |
|------------|---------------|
| **IP Servidor** | 192.168.1.100 |
| **Balanza** | No requiere |
| **Impresora** | Láser o inyección |
| **Módulos** | Reportes |

**Script de configuración:**
```
install\client\config-puesto.bat
```

---

## Flujos de Configuración

### Solo Acceso (sin hardware)
```
install\client\install-client.bat
```

### Acceso + Balanza
```
1. install\client\install-client.bat
2. install\client\config-balanza.bat
```

### Acceso + Balanza + Impresora
```
1. install\client\install-client.bat
2. install\client\config-balanza.bat
3. install\client\config-impresora.bat
```

### Configuración Completa (Recomendado)
```
install\client\config-puesto.bat
```
Este script configura todo en un solo paso.

---

## Configuración de Balanzas por Defecto

| Balanza | Puerto | Baudios | Data | Stop | Paridad |
|---------|--------|---------|------|------|---------|
| Toledo 9091 | COM1 | 9600 | 8 | 1 | none |
| Mettler Toledo | COM1 | 9600 | 8 | 1 | none |
| Avery | COM1 | 4800 | 8 | 1 | none |
| Dini Argeo | COM1 | 9600 | 8 | 1 | none |

---

## Configuración de Impresoras por Defecto

| Uso | Tipo | Modelo Típico |
|-----|------|---------------|
| Tickets pesaje | Térmica Ticket | Epson TM-T20 |
| Rótulos medias | Térmica Etiqueta | Zebra ZT410 |
| Facturas | Láser | HP LaserJet |
| Reportes | Láser/Inyección | HP/Canon |

---

## Verificación Post-Instalación

### En cada puesto, verificar:

1. **Acceso al servidor**
   ```
   ping 192.168.1.100
   ```

2. **Apertura del sistema**
   ```
   http://192.168.1.100:3000
   ```

3. **Balanza (si aplica)**
   - Poner peso conocido
   - Verificar lectura en pantalla

4. **Impresora (si aplica)**
   - Imprimir página de prueba
   - Imprimir documento del sistema

---

*Documento de referencia rápida - Marzo 2026*
