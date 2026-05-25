# ⚖️ INSTRUCTIVO DE CONFIGURACIÓN DE BALANZAS
## Sistema de Gestión Frigorífica - Solemar Alimentaria

---

## 📋 ÍNDICE

1. [Introducción](#introducción)
2. [Requisitos Previos](#requisitos-previos)
3. [Configuración Automática](#configuración-automática)
4. [Configuración Manual](#configuración-manual)
5. [Parámetros de Comunicación](#parámetros-de-comunicación)
6. [Protocolos Soportados](#protocolos-soportados)
7. [Pruebas y Verificación](#pruebas-y-verificación)
8. [Solución de Problemas](#solución-de-problemas)

---

## 🔍 INTRODUCCIÓN

El sistema de balanzas permite la captura automática de pesos desde diferentes dispositivos conectados por puerto serial (RS232) a las PC de los puestos de trabajo.

### Puestos que Requieren Balanza

| Puesto | Tipo de Pesaje | Balanza Típica |
|--------|----------------|----------------|
| Balanza Camiones | Peso bruto/tara | 60.000 kg |
| Pesaje Individual | Animales en pie | 2.000 kg |
| Romaneo | Medias/reses | 500 kg |

---

## ⚙️ REQUISITOS PREVIOS

### Hardware Necesario

- ✅ Balanza con salida RS232
- ✅ Cable serial (DB9 o USB-Serie)
- ✅ Puerto COM disponible en la PC
- ✅ Convertidor USB-Serie (si la PC no tiene puerto serial)

### Software Necesario

- ✅ Windows 10/11
- ✅ Drivers del convertidor USB-Serie (si aplica)
- ✅ Sistema Solemar Alimentaria funcionando

### Verificar Puerto COM

```cmd
:: Opción 1: Línea de comandos
mode | findstr "COM"

:: Opción 2: Administrador de dispositivos
devmgmt.msc → Puertos (COM y LPT)
```

---

## 🚀 CONFIGURACIÓN AUTOMÁTICA

### Paso 1: Conectar la Balanza

1. Apague la balanza
2. Conecte el cable RS232 a la balanza y a la PC
3. Encienda la balanza
4. Verifique que el puerto COM aparezca en Windows

### Paso 2: Ejecutar el Configurador

```
Ejecutar como Administrador:
install\client\config-balanza.bat
```

### Paso 3: Seguir el Asistente

El configurador le pedirá:

1. **Seleccionar puesto de trabajo**
   - Balanza Camiones
   - Pesaje Individual
   - Romaneo
   - Calibración

2. **Seleccionar puerto COM**
   - Se detectan automáticamente los puertos disponibles

3. **Configurar comunicación serial**
   - Velocidad (baudios)
   - Bits de datos
   - Paridad
   - Bits de parada

4. **Configurar protocolo de lectura**
   - CONTINUO
   - BAJO_DEMANDA
   - STABLE

5. **Identificar la balanza**
   - Marca
   - Modelo
   - Capacidad máxima

### Paso 4: Registrar en el Sistema Web

1. Abra el navegador: `http://[IP-SERVIDOR]:3000`
2. Vaya a: **Configuración → Balanzas**
3. Haga clic en **Nueva Balanza**
4. Complete los datos:
   - Nombre: Balanza [Puesto]
   - Puerto: COM[x]
   - Baudios: 9600
   - Protocolo: CONTINUO
   - Decimales: 1

---

## 🔧 CONFIGURACIÓN MANUAL

### Configuración por Línea de Comandos

```cmd
:: Configurar puerto COM3 con parámetros estándar
mode COM3: BAUD=9600 PARITY=N DATA=8 STOP=1

:: Verificar configuración
mode COM3:
```

### Archivo de Configuración

Ubicación: `C:\SolemarAlimentaria\config\balanza_[puesto].json`

```json
{
  "puesto": "Balanza Camiones",
  "puerto_com": "COM3",
  "marca": "Toledo",
  "modelo": "9091",
  "capacidad_kg": 60000,
  "configuracion_serial": {
    "baudios": 9600,
    "data_bits": 8,
    "paridad": "N",
    "stop_bits": 1
  },
  "protocolo": "CONTINUO",
  "decimales": 1
}
```

---

## 📡 PARÁMETMETROS DE COMUNICACIÓN

### Configuraciones Comunes por Marca

| Marca | Modelo | Baudios | Data | Paridad | Stop |
|-------|--------|---------|------|---------|------|
| Toledo | 9091 | 9600 | 8 | N | 1 |
| Mettler Toledo | Tiger | 9600 | 8 | N | 1 |
| Avery | 7700 | 4800 | 7 | E | 1 |
| Dini Argeo | 3590 | 9600 | 8 | N | 1 |
| Adam Equipment | CKT | 9600 | 8 | N | 1 |
| Ohaus | Defender | 9600 | 8 | N | 1 |

### Velocidad (Baudios)

| Valor | Uso |
|-------|-----|
| 2400 | Balanzas muy antiguas |
| 4800 | Algunas Avery |
| **9600** | **Estándar (más común)** |
| 19200 | Alta velocidad |
| 38400 | Muy alta velocidad |

### Paridad

| Valor | Descripción |
|-------|-------------|
| **N (None)** | Sin paridad (más común) |
| E (Even) | Paridad par |
| O (Odd) | Paridad impar |

---

## 📋 PROTOCOLOS SOPORTADOS

### CONTINUO

La balanza envía el peso constantemente sin necesidad de solicitud.

```
Características:
- No requiere comando de solicitud
- Flujo constante de datos
- Mayor consumo de recursos
- Actualización en tiempo real

Uso recomendado: Balanza Camiones, Romaneo
```

### BAJO_DEMANDA

El sistema solicita el peso cuando lo necesita.

```
Características:
- Requiere comando de solicitud
- Menor consumo de recursos
- Peso bajo control
- Comando típico: "P" o "PRINT"

Uso recomendado: Pesaje Individual
```

### STABLE

La balanza solo envía datos cuando el peso es estable.

```
Características:
- Filtra oscilaciones
- Mayor precisión
- Puede tener delay
- Requiere tiempo de estabilización

Uso recomendado: Calibración, Pesaje de precisión
```

---

## ✅ PRUEBAS Y VERIFICACIÓN

### Prueba Básica de Comunicación

```cmd
:: 1. Configurar puerto
mode COM3: BAUD=9600 PARITY=N DATA=8 STOP=1

:: 2. Leer datos (si la balanza transmite continuamente)
:: Abrir PowerShell y ejecutar:
$port = new-Object System.IO.Ports.SerialPort COM3,9600,None,8,one
$port.Open()
$port.ReadLine()
$port.Close()
```

### Prueba desde el Sistema

1. Acceda al módulo de pesaje correspondiente
2. Verifique que el peso se actualice en tiempo real
3. Compare con el display de la balanza

### Verificar Datos Recibidos

El peso debe aparecer en formato similar a:
```
+00045.5 kg
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### El puerto COM no aparece

```
Causas posibles:
1. Cable no conectado
2. Driver no instalado (USB-Serie)
3. Puerto deshabilitado en BIOS

Solución:
1. Verificar conexiones físicas
2. Instalar driver del convertidor USB
3. Verificar en Administrador de Dispositivos
```

### No se reciben datos

```
Causas posibles:
1. Configuración de comunicación incorrecta
2. Cable dañado
3. Balanza no configurada para transmitir

Solución:
1. Verificar baudios, paridad, etc.
2. Probar con otro cable
3. Revisar configuración de la balanza
```

### El peso es incorrecto

```
Causas posibles:
1. Número de decimales incorrecto
2. Formato de trama diferente
3. Balanza necesita calibración

Solución:
1. Ajustar decimales en configuración
2. Consultar manual de la balanza
3. Calibrar balanza con pesos patrón
```

### Error de acceso denegado al puerto

```
Causa: Puerto en uso por otra aplicación

Solución:
1. Cerrar otras aplicaciones que usen el puerto
2. Reiniciar la PC
3. Verificar con: netstat -ano | findstr "COM"
```

---

## 📞 SOPORTE

Para asistencia técnica adicional:

- **Sistema**: Solemar Alimentaria
- **Repositorio**: https://github.com/aarescalvo/zaisoleweb

---

*Última actualización: Marzo 2026*
