# Instructivo de Instalación — Printer Bridge v2.0

## Solemar Alimentaria — Sistema Frigorífico

---

> **Guía para personal no técnico.** Si alguna cosa no te queda clara, anotá tus dudas y consultá con soporte.
> Todo lo que necesitás hacer está explicado paso a paso acá.

---

## Índice

1. [¿Qué es el Printer Bridge y cómo funciona?](#1-qué-es-el-printer-bridge-y-cómo-funciona)
2. [Conexión física (¡MUY IMPORTANTE!)](#2-conexión-física-muy-importante)
3. [¿Qué es una dirección IP y por qué la necesitamos?](#3-qué-es-una-dirección-ip-y-por-qué-la-necesitamos)
4. [Cómo encontrar la dirección IP de tu PC (PASO A PASO)](#4-cómo-encontrar-la-dirección-ip-de-tu-pc-paso-a-paso)
5. [¿Qué son los puertos y por qué el 9100?](#5-qué-son-los-puertos-y-por-qué-el-9100)
6. [Requisitos previos](#6-requisitos-previos)
7. [Instalación en PC 1 (Zebra ZT230)](#7-instalación-en-pc-1-zebra-zt230)
8. [Instalación en PC 2 (Datamax Mark II 4206)](#8-instalación-en-pc-2-datamax-mark-ii-4206)
9. [Configurar el Firewall de Windows](#9-configurar-el-firewall-de-windows)
10. [¿Qué pasa si están en switches/routers distintos?](#10-qué-pasa-si-están-en-switchesrouters-distintos)
11. [Verificar que funciona (PASO A PASO)](#11-verificar-que-funciona-paso-a-paso)
12. [Configurar las impresoras en el sistema](#12-configurar-las-impresoras-en-el-sistema)
13. [Servicio Windows (arranque automático)](#13-servicio-windows-arranque-automático)
14. [Solución de problemas](#14-solución-de-problemas)
15. [Preguntas frecuentes](#15-preguntas-frecuentes)
16. [Checklist final](#16-checklist-final)

---

## 1. ¿Qué es el Printer Bridge y cómo funciona?

### El problema

El sistema del frigorífico necesita imprimir etiquetas (rótulos) en dos impresoras que están en lugares distintos dentro de la planta. Pero las impresoras **no están conectadas directamente a la red** — están conectadas por **cable USB** a una PC.

```
                ¿Cómo llegan las órdenes de impresión
                desde el sistema hasta la impresora?

  Sistema            ???          PC             Impresora
  Frigorífico   ───────────▶  ───────────▶  ───────────▶
  (en un PC)                  (puente)
```

### La solución: el Printer Bridge

El **Printer Bridge** es un programita chico que instalás en cada PC que tiene una impresora conectada por USB. Este programita:

1. **Recibe** las órdenes de impresión que llegan por la **red** (desde el sistema)
2. **Manda** esas órdenes a la impresora por **cable USB**

Es como un "puente" (bridge) entre la red y la impresora USB. Por eso se llama así.

### Diagrama completo

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         PLANTA DEL FRIGORÍFICO                              ║
║                                                                              ║
║  ┌──────────────────┐                                                       ║
║  │   Sistema del    │  Envía órdenes de impresión                           ║
║  │   Frigorífico    │  por la red (TCP puerto 9100)                         ║
║  │   (Next.js)      │                                                       ║
║  └────────┬─────────┘                                                       ║
║           │                                                                 ║
║           │  Red (cables de red / switch / router)                          ║
║           │                                                                 ║
║     ┌─────┴──────────────────────────────┐                                  ║
║     │                                    │                                  ║
║     ▼                                    ▼                                  ║
║  ┌─────────────────┐                ┌─────────────────┐                     ║
║  │     PC 1        │                │     PC 2        │                     ║
║  │  Printer Bridge │                │  Printer Bridge │                     ║
║  │  (programita)   │                │  (programita)   │                     ║
║  └────────┬────────┘                └────────┬────────┘                     ║
║           │ cable USB                          │ cable USB                   ║
║           ▼                                    ▼                            ║
║  ┌─────────────────┐                ┌─────────────────┐                     ║
║  │  Zebra ZT230    │                │  Datamax        │                     ║
║  │  (Rótulos       │                │  Mark II 4206   │                     ║
║  │   Media Res)    │                │  (Rótulos       │                     ║
║  │                 │                │   Cuarto/Caja)  │                     ║
║  └─────────────────┘                └─────────────────┘                     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Cosas MUY importantes para recordar

> **La impresora se conecta a la PC con cable USB, NO con cable de red.**

> **La impresora NO tiene su propia dirección IP.** La IP que necesitás es la de la PC donde está enchufada la impresora.

> **El Printer Bridge tiene que estar corriendo (funcionando) en la PC** para que las etiquetas se impriman. Si cerrás el programa, no imprime nada.

---

## 2. Conexión física (¡MUY IMPORTANTE!)

Antes de tocar cualquier cosa en la computadora, asegurate de que todo esté bien conectado.

### Lo que necesitamos

```
  Cable USB          Cable de red         Cable USB
    ═══════             ═══════             ═══════
      │                   │                   │
      ▼                   ▼                   ▼
┌──────────┐        ┌──────────┐        ┌──────────┐
│ Impresora│  USB   │  PC 1    │  RED   │  Router/ │
│  Zebra   │◄───────│          │◄───────│  Switch  │
│  ZT230   │        └──────────┘        └────┬─────┘
└──────────┘                                   │
                                               │
┌──────────┐        ┌──────────┐                │
│ Impresora│  USB   │  PC 2    │  RED           │
│ Datamax  │◄───────│          │◄───────────────┘
│  4206    │        └──────────┘
└──────────┘
```

### Paso a paso

#### PC 1 (con la Zebra ZT230)

1. **Conectá el cable USB** de la impresora Zebra a la PC
   - El cable USB es el chato, no el de red (el de red es más ancho)
   - En la Zebra, el enchufe USB está en un costado o atrás
   - En la PC, va en cualquier puerto USB (los rectangulares chicos)

2. **Prendé la impresora**
   - El botón de encendido suele estar en el frente o panel lateral
   - Esperá a que la luz esté fija (no parpadeando)

3. **Verificá que la PC tenga conexión de red**
   - La PC debe estar conectada al router/switch de la planta con cable de red
   - O por Wi-Fi, pero cable es más estable (ver FAQ)

#### PC 2 (con la Datamax Mark II 4206)

1. **Conectá el cable USB** de la Datamax a la PC (mismo procedimiento)

2. **Prendé la impresora**

3. **Verificá que la PC tenga conexión de red**

### Lo que NO hay que hacer

| ❌ NO hagas esto | ✅ Hacé esto |
|---|---|
| Conectar un cable de red a la impresora | Conectar la impresora a la PC con cable USB |
| Buscar una IP para la impresora | La IP es de la PC, no de la impresora |
| Conectar la impresora al router directamente | Conectar la impresora a la PC |

> **Resumen:** Impresora → (cable USB) → PC → (cable de red) → Router. Listo.

---

## 3. ¿Qué es una dirección IP y por qué la necesitamos?

### Explicación simple

Imaginate que la red de la planta es como un edificio con muchos departamentos. Cada PC es un departamento.

- La **dirección IP** es como el **número de departamento**.
- Para que el sistema le mande una orden a la PC 1, necesita saber su "número" (IP).
- Para que le mande una orden a la PC 2, necesita saber el "número" de la PC 2.

```
  Edificio (Red del frigorífico - 192.168.1.x)

  ┌─────────────────────────────────────────┐
  │                                         │
  │  Dpto 10 ──── PC 1 (Zebra ZT230)       │   → IP: 192.168.1.10
  │  Dpto 20 ──── PC 2 (Datamax 4206)      │   → IP: 192.168.1.20
  │  Dpto 50 ──── PC del Sistema            │   → IP: 192.168.1.50
  │  ...                                    │
  │                                         │
  └─────────────────────────────────────────┘
```

Las IPs en una red doméstica/de planta suelen ser algo como:

- `192.168.1.10`
- `192.168.1.20`
- `192.168.0.100`
- `10.0.0.5`

### La confusión más común

> **"¿Tengo que poner la IP de la impresora?"** → **NO.** La impresora no tiene IP porque está conectada por USB.
>
> **La IP que ponés en el sistema es la IP de la PC** donde está conectada la impresora.

```
  ❌ INCORRECTO:                        ✅ CORRECTO:

  Sistema → IP de la impresora          Sistema → IP de la PC donde
           (no existe, no tiene IP)              está la impresora
```

### ¿Puede cambiar la IP?

**Sí, si la PC obtiene la IP automáticamente (DHCP).** Esto es normal y no es un problema. Solo anotá la IP actual y si alguna vez la PC se reinicia y no imprime, verificá la IP de nuevo (ver sección 4).

> **Tip:** Si querés evitar que cambie, podés configurar una IP fija en Windows. Pero no es obligatorio — con DHCP funciona bien, solo anotá la IP.

---

## 4. Cómo encontrar la dirección IP de tu PC (PASO A PASO)

### Método: usar `ipconfig` (el más confiable)

#### Paso 1: Abrir la ventana de comandos

1. Presioná las teclas **Windows + R** al mismo tiempo
   - `Windows` es la tecla con el logo de Windows (abajo a la izquierda del teclado)
   - `R` es la letra R
2. Se abre una ventanita chiquita que dice "Ejecutar"
3. En el cuadro de texto, escribí: `cmd`
4. Hacé clic en **"Aceptar"** o presioná **Enter**

```
  ┌─────────────────────────────────────┐
  │  Ejecutar                    [X]   │
  ├─────────────────────────────────────┤
  │                                     │
  │  Abrir:  ┌───────────┐              │
  │          │  cmd       │              │
  │          └───────────┘              │
  │                                     │
  │         [Aceptar] [Cancelar]        │
  └─────────────────────────────────────┘
```

Se abre una ventana **negra** con texto blanco. No te asustes, es normal.

#### Paso 2: Ejecutar el comando

En esa ventana negra, escribí:

```
ipconfig
```

y presioná **Enter**.

#### Paso 3: Leer el resultado

Aparece un montón de texto. Buscá la parte que dice **"Adaptador de Ethernet"** o **"Adaptador de red inalámbrica Wi-Fi"** (depende de si estás conectado por cable o Wi-Fi). Debajo de eso, buscá la línea que dice **"Dirección IPv4"**.

Ejemplo de lo que ves:

```
Configuración IP de Windows

Adaptador de Ethernet Conexión de área local:

   Estado de los medios. . . . . . . . : Conectado
   Sufijo DNS específico de conexión . . :
   Dirección IPv4. . . . . . . . . . . : 192.168.1.153    ◄── ESTA ES TU IP
   Máscara de subred . . . . . . . . . : 255.255.255.0
   Puerta de enlace predeterminada . . : 192.168.1.1

Adaptador de red inalámbrica Wi-Fi:

   Estado de los medios. . . . . . . . : Desconectado
```

En este ejemplo, la IP es **`192.168.1.153`**.

#### Paso 4: ¡Anotala!

**Escribí esa IP en un papel o en el celular.** La vas a necesitar para configurar el sistema.

```
  ┌──────────────────────────────────┐
  │  MIS IPS (anotá acá):            │
  │                                  │
  │  PC 1 (Zebra ZT230):             │
  │  IP: _____._____._____._____     │
  │                                  │
  │  PC 2 (Datamax 4206):            │
  │  IP: _____._____._____._____     │
  │                                  │
  └──────────────────────────────────┘
```

### ¿DHCP o IP fija?

Tu PC probablemente obtiene la IP automáticamente (DHCP). Eso está **perfectamente bien**. Solo acordate:

- Si la PC se reinicia o se desconecta de la red, **la IP podría cambiar**
- Si un día no imprime, lo primero que hacés es verificar la IP de nuevo con `ipconfig`
- Si querés que no cambie nunca, podés poner una IP fija, pero eso es opcional

---

## 5. ¿Qué son los puertos y por qué el 9100?

### Explicación simple

Si la IP es como la **dirección de un edificio**, los puertos son como los **números de puerta o departamento** dentro de ese edificio.

```
  La PC es como un edificio con muchas puertas:

  ┌─────────────────────────────────────────┐
  │  PC (edificio)  →  IP: 192.168.1.153   │
  │                                         │
  │  Puerta 80   ──→  Navegador web        │
  │  Puerta 9100 ──→  Printer Bridge       │  ◄── Por acá entran las
  │  Puerta 9101 ──→  Panel de control     │       órdenes de impresión
  │  Puerta 3389 ──→  Escritorio remoto    │
  │  ...                                   │
  └─────────────────────────────────────────┘
```

- Cuando el sistema quiere mandar una orden de impresión, se conecta a la IP de la PC **y al puerto 9100**
- El Printer Bridge está "escuchando" en esa puerta (puerto 9100)
- Cuando llega algo, lo toma y lo manda a la impresora por USB

### ¿Por qué 9100?

El puerto **9100** es un estándar mundial para impresoras de etiquetas. Casi todas las impresoras Zebra, Datamax, Sato, etc., usan ese puerto. Es como una convención: "si querés hablar con una impresora de etiquetas, llamá a la puerta 9100".

### ¿Y el 9101?

El puerto **9101** es para el **panel de control web**. Desde un navegador podés entrar a `http://192.168.1.153:9101` y ver un panel donde podés probar la impresión, ver estadísticas, etc.

| Puerto | Para qué sirve | ¿En qué equipo? |
|--------|---------------|-----------------|
| **9100** | Recibir datos de impresión (ZPL/DPL) | En la PC (no en la impresora) |
| **9101** | Panel de control web | En la PC (no en la impresora) |

> **Importante:** Ambos puertos son de la PC, no de la impresora. La impresora no tiene puertos de red porque está conectada por USB.

---

## 6. Requisitos previos

Antes de instalar el Printer Bridge, necesitás tener todo esto listo **en cada PC** que tiene una impresora.

### Checklist de requisitos

- [ ] **Windows 10 o 11** instalado
- [ ] **Node.js** instalado (ver paso a paso abajo)
- [ ] **Driver de la impresora** instalado en Windows (ver paso a paso abajo)
- [ ] **Impresora prendida** y conectada por cable USB
- [ ] **La PC conectada a la red** (al mismo router/switch que las otras PCs)
- [ ] **La IP de la PC anotada** (ver sección 4)

### Paso a paso: Instalar Node.js

Node.js es un programa que necesita el Printer Bridge para funcionar. Es como un "motor" para ejecutar el programita.

1. Abrí el navegador (Chrome, Edge, Firefox, el que uses)
2. Andá a: **https://nodejs.org/**
3. Descargá la versión que dice **"LTS"** (la que dice "Recommended for Most Users")
   - Es el botón grande verde que dice algo como `20.x.x LTS`
4. Hacé doble clic en el archivo descargado para instalarlo
5. Aparece un instalador. **Dejá todo por defecto** y hacé clic en "Next" hasta que termine
   - No cambies nada. Next → Next → Next → Install → Finish
6. Listo

**Para verificar que se instaló bien:**

1. Abrí CMD (Windows + R → `cmd` → Enter)
2. Escribí: `node --version`
3. Presioná Enter
4. Si aparece un número como `v20.11.0`, está todo bien ✅
5. Si dice "no se reconoce como comando interno", Node.js no se instaló bien. Volvé a intentarlo.

### Paso a paso: Instalar el driver de la Zebra ZT230

El driver es el programita que hace que Windows sepa cómo hablar con la impresora.

1. Conectá la impresora Zebra por USB a la PC y prendela
2. Descargá el driver desde: **https://www.zebra.com/us/en/software/printer-software/drivers.html**
3. Buscá "ZT230" en la lista
4. Descargá e instalá el driver
5. Al instalar, elegí el puerto USB donde está conectada

**Para verificar que se instaló:**

1. Abrí el **Panel de Control** de Windows
   - Podés buscar "Panel de Control" en el menú Inicio
2. Andá a **"Dispositivos e Impresoras"** (o "Impresoras y escáneres" en Windows 10/11)
3. La **Zebra ZT230** tiene que aparecer en la lista
4. Tiene que estar sin ningún ícono de error (sin triángulo amarillo)

### Paso a paso: Instalar el driver de la Datamax Mark II 4206

1. Conectá la Datamax por USB y prendela
2. En Windows 10/11, la Datamax se puede detectar automáticamente. Probá:
   - **Configuración** → **Bluetooth y dispositivos** → **Impresoras y escáneres** → **"Agregar dispositivo"**
   - Si la detecta, listísimo
3. Si no la detecta automáticamente:
   - Descargá el driver desde: **https://www.honeywellaidc.com/en-us/support/driver-downloads**
   - Buscá "Datamax" o "Honeywell printer driver"
   - Instalalo y verificá que aparezca en Dispositivos e Impresoras

### Verificar que ambas PCs están en la misma red

Las dos PCs (la de la Zebra y la de la Datamax) tienen que estar conectadas al **mismo router o switch**. Si una está en un Wi-Fi y la otra en otro Wi-Fi diferente, no se van a poder comunicar.

```
  ✅ CORRECTO: Ambas en el mismo router

  ┌──────────┐      ┌──────────┐
  │  PC 1    │──────│          │
  │  (Zebra) │      │  Router  │
  └──────────┘      │          │
                    │  del     │
  ┌──────────┐      │  frigo   │
  │  PC 2    │──────│          │
  │ (Datamax)│      │          │
  └──────────┘      └──────────┘


  ❌ INCORRECTO: En redes diferentes

  ┌──────────┐      ┌──────────┐
  │  PC 1    │──────│ Router 1 │    ← Red 1
  │  (Zebra) │      └──────────┘
  └──────────┘

  ┌──────────┐      ┌──────────┐
  │  PC 2    │──────│ Router 2 │    ← Red 2 (¡no se comunican!)
  │ (Datamax)│      └──────────┘
  └──────────┘
```

### Archivos que se van a instalar

El instalador automático (v2.0) se encarga de bajar todo desde internet. No necesitás copiar nada a mano. Estos son los archivos que quedan en tu PC después de la instalación:

```
printer-bridge/
├── index.js              ← El programa principal
├── print-helper.ps1      ← Script auxiliar de impresión
├── start.bat             ← Para iniciar rápidamente
└── printer-config.json   ← Configuración (impresora, puertos, etc.)
```

> **Nota v2.0:** Ya no necesitás `npm install` ni dependencias externas. El programa es 100% standalone — se baja y funciona.

---

## 7. Instalación en PC 1 (Zebra ZT230)

En la versión 2.0, la instalación es **automática** con un solo comando. No tenés que copiar archivos a mano ni instalar dependencias.

### Paso 1: Abrir PowerShell como Administrador

1. Hacé clic en el botón **Inicio** de Windows
2. Escribí la palabra **`PowerShell`**
3. Te va a aparecer "Windows PowerShell"
4. Hacé **clic derecho** sobre "Windows PowerShell"
5. Elegí **"Ejecutar como administrador"**
6. Si pregunta "¿Querés permitir que esta app haga cambios?", hacé clic en **"Sí"**

> ⚠️ **¡Importante!** Tiene que ser "como administrador", si no el instalador no puede abrir los puertos del firewall. Vas a saber que es correcto si arriba de la ventana dice "Administrador".

### Paso 2: Permitir la ejecución de scripts (solo la primera vez)

La primera vez que usás PowerShell, tenés que permitirle que corra scripts. Escribí esto y presioná Enter:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Si pregunta algo, escribí **`S`** (Sí) y presioná Enter.

> Esto lo hacés **una sola vez** en cada PC. No hace falta repetirlo.

### Paso 3: Ejecutar el instalador automático

Escribí este comando en PowerShell y presioná Enter:

```powershell
irm https://raw.githubusercontent.com/aarescalvo/trz5/master/mini-services/printer-bridge/install.ps1 | iex
```

> **Tip:** Este comando descarga e instala todo automáticamente desde internet. Solo necesitás conexión a internet.

El instalador hace todo solo:

```
============================================================
  PRINTER BRIDGE v2.0 — Solemar Alimentaria
  Instalador automático
============================================================

[OK] Node.js encontrado: v20.11.0
[OK] Descargando archivos desde GitHub...

Instalando en: C:\SolemarAlimentaria\printer-bridge
[OK] Archivos descargados.

Detectando impresoras conectadas...

  N°  Impresora
  ──  ──────────────────────────────────────
  1)  Zebra ZT230
  2)  Microsoft Print to Image
  3)  Microsoft XPS Document Writer

Escribí el NÚMERO de la impresora que querés usar: _
```

**Escribí el número** de la impresora (en este caso, `1`) y presioná Enter. El instalador automáticamente:

1. ✅ Descarga los archivos de GitHub
2. ✅ Detecta las impresoras conectadas
3. ✅ Crea el archivo de configuración
4. ✅ Abre los puertos 9100 y 9101 en el firewall
5. ✅ Muestra la IP de la PC

```
[OK] Impresora seleccionada: Zebra ZT230
[OK] Configuración creada.
[OK] Firewall: puertos 9100 y 9101 abiertos.

============================================================
  INSTALACIÓN COMPLETADA
============================================================

  Impresora: Zebra ZT230
  Puerto TCP: 9100 (para recibir datos del sistema)
  Panel Web:  http://192.168.1.153:9101

  ARCHIVOS EN: C:\SolemarAlimentaria\printer-bridge

============================================================
  PRÓXIMOS PASOS:
============================================================

  1. Para iniciar el bridge, ejecutá:
     cd C:\SolemarAlimentaria\printer-bridge
     node index.js

  2. O hacé doble clic en start.bat

  3. Abrí http://localhost:9101 en el navegador

  4. Hacé clic en "Imprimir prueba" para verificar

============================================================
```

**ANOTÁ LA IP** que muestra (en este ejemplo, `192.168.1.153`).

### Paso 4: Iniciar el Printer Bridge

Para empezar a usar el bridge, tenés dos opciones:

**Opción A — Con el atajo `start.bat`:**
1. Andá a la carpeta `C:\SolemarAlimentaria\printer-bridge\`
2. Hacé **doble clic** en `start.bat`
3. Se abre una ventana negra que queda corriendo:

```
============================================================
         PRINTER BRIDGE v2.0 — Solemar Alimentaria
============================================================
║  TCP:  192.168.1.153:9100 (recibe datos ZPL/DPL)
║  HTTP: http://192.168.1.153:9101 (panel de control)
║  Impresora: Zebra ZT230
============================================================

Abrí http://localhost:9101 en tu navegador para configurar
```

**Opción B — Desde la consola:**
1. Abrí CMD o PowerShell
2. Ejecutá: `cd C:\SolemarAlimentaria\printer-bridge`
3. Ejecutá: `node index.js`

> ⚠️ **¡MUY IMPORTANTE! Esta ventana negra tiene que quedar abierta.** No la cierres. Mientras esté abierta, el bridge funciona. Si la cerrás, no imprime nada.

> **Tip:** Si te molesta tener la ventana abierta, después podés instalarlo como servicio (ver sección 13) para que corra en segundo plano.

### Paso 5: Probar desde el panel web

1. Abrí el navegador en esa PC (Chrome, Edge, el que uses)
2. En la barra de direcciones, escribí: **`http://localhost:9101`**
3. Se abre el panel de control del Printer Bridge
4. Verificá que diga "Zebra ZT230" donde dice "Impresora"
5. Hacé clic en el botón **"🖨️ Imprimir prueba"**
6. La Zebra debería imprimir una etiqueta que dice:

```
  ** PRUEBA **
  Zebra ZT230 - Bridge OK
  15/1/2025 10:30:00
  Solemar Alimentaria
```

- ✅ **Si imprimió** → La PC 1 está lista. Pasá a la PC 2.
- ❌ **Si no imprimió** → Andá a la sección [Solución de problemas](#14-solución-de-problemas)

---

## 8. Instalación en PC 2 (Datamax Mark II 4206)

Los pasos son **exactamente los mismos** que en la PC 1. Solo cambia la impresora que seleccionás en el instalador.

### Paso 1: Abrir PowerShell como Administrador

Mismo que PC 1 (ver sección 7, Paso 1).

### Paso 2: Permitir la ejecución de scripts (solo la primera vez)

Mismo que PC 1 (ver sección 7, Paso 2). Si ya lo hiciste antes en esta PC, salteamé este paso.

### Paso 3: Ejecutar el instalador automático

Mismo comando que PC 1:

```powershell
irm https://raw.githubusercontent.com/aarescalvo/trz5/master/mini-services/printer-bridge/install.ps1 | iex
```

Cuando aparezca la lista de impresoras, **elegí el número de la Datamax**:

```
Detectando impresoras conectadas...

  N°  Impresora
  ──  ──────────────────────────────────────
  1)  Datamax Mark II 4206
  2)  Microsoft Print to Image
  3)  Microsoft XPS Document Writer

Escribí el NÚMERO de la impresora que querés usar: 1
```

**ANOTÁ LA IP** que muestra al final (puede ser distinta a la PC 1).

> **Nota:** Cada PC tiene su propia IP. Que ambas usen el puerto 9100 no es un problema porque están en PCs distintas. Es como dos edificios que ambos tienen un "departamento 9100" — son edificios diferentes.

### Paso 4: Iniciar el Printer Bridge

Hacé doble clic en `start.bat` o ejecutá `node index.js` desde la carpeta `C:\SolemarAlimentaria\printer-bridge\`.

Verificá que muestre la IP correcta y "Datamax Mark II 4206". Dejá la ventana abierta.

### Paso 5: Probar

1. Abrí **`http://localhost:9101`** en esta PC
2. Hacé clic en **"🖨️ Imprimir prueba"**
3. La Datamax debería imprimir una etiqueta de prueba

- ✅ **Si imprimió** → La PC 2 está lista.
- ❌ **Si no imprimió** → Andá a [Solución de problemas](#14-solución-de-problemas)

---

## 9. Configurar el Firewall de Windows

### ¡Buenas noticias! En v2.0 es automático 🎉

El instalador `install.ps1` abre automáticamente los puertos **9100** y **9101** en el firewall de Windows. **No tenés que hacer nada manualmente** ... siempre y cuando hayas ejecutado el PowerShell **como Administrador**.

> ⚠️ **Si ejecutaste el PowerShell sin "Ejecutar como administrador"**, el instalador no pudo abrir los puertos del firewall. En ese caso, cerrá todo, volvé a abrir PowerShell como administrador y ejecutá el instalador de nuevo.

### ¿Cómo verificar que el firewall está bien configurado?

1. Abrí el panel web: `http://localhost:9101` en la PC del bridge
2. Hacé clic en el botón **"Diagnóstico"**
3. Si dice "Firewall: OK", todo bien
4. Si dice "Firewall: PROBLEMA", leé la sección de abajo

### Instrucciones manuales (SOLO si el instalador no pudo abrir los puertos automáticamente)

> ⚠️ **Solo necesitás hacer esto si el instalador falló o si por alguna razón los puertos no se abrieron.** Probá primero acceder a `http://localhost:9101` desde otra PC. Si se abre, el firewall está bien.

#### ¿Qué es el Firewall y por qué lo tenemos que configurar?

El Firewall de Windows es como un **guardia de seguridad** en la puerta de tu PC. Su trabajo es **bloquear** las conexiones que vienen de afuera para protegerte.

El problema es que este guardia **bloquea por defecto TODO** lo que viene de otra PC. Así que cuando el sistema del frigorífico intenta hablar con el Printer Bridge, el guardia lo frena.

Lo que tenemos que hacer es decirle al guardia: *"Mirá, las conexiones a los puertos 9100 y 9101 dejalas pasar, son de confianza"*.

```
  ANTES del firewall:

  Sistema ──"¡Quiero imprimir!"──▶ GUARDIA ──"NO, no pasás" ──✗

  DESPUÉS del firewall:

  Sistema ──"¡Quiero imprimir!"──▶ GUARDIA ──"OK, pasá" ──▶ Printer Bridge ──▶ Impresora
                                                (puertos 9100 y 9101 habilitados)
```

#### Paso a paso manual (¡seguilo al pie de la letra!)

**Esto tenés que hacerlo en LAS DOS PCs** (la de la Zebra y la de la Datamax).

**Paso 1: Abrir el Firewall**

1. Hacé clic en el botón **Inicio** de Windows (el logo de Windows abajo a la izquierda)
2. Escribí la palabra **`Firewall`**
3. En los resultados, aparecen varias opciones. Hacé clic en la que dice **"Firewall de Windows Defender"**
   - También puede aparecer como **"Windows Defender Firewall con seguridad avanzada"** — si es esa, directamente abrí esa

**Paso 2: Entrar a la configuración avanzada**

1. En la ventana del Firewall, mirá a la **izquierda**
2. Hacé clic en **"Configuración avanzada"**
   - Puede pedirte permiso de administrador. Hacé clic en **"Sí"**

Se abre una ventana más grande con un árbol de opciones a la izquierda.

**Paso 3: Ir a "Reglas de entrada"**

1. En el panel izquierdo, expandí **"Reglas de seguridad de conexión local"** si no está expandido
2. Hacé clic en **"Reglas de entrada"** (el segundo item)

A la derecha vas a ver una lista larga de reglas (muchas, no te asustes).

**Paso 4: Crear una nueva regla**

1. Mirá a la **derecha** de la ventana
2. Hacé clic en **"Nueva regla..."**
3. Seleccioná **"Puerto"** → **Siguiente**
4. Dejá marcado **"TCP"**, escribí **`9100, 9101`** en puertos locales → **Siguiente**
5. Seleccioná **"Permitir la conexión"** → **Siguiente**
6. **Marcá las tres casillas:** Dominio, Privada y Pública → **Siguiente**
7. Nombre: **`Printer Bridge`**, Descripción: **`Puertos para el sistema de impresión del frigorífico`**
8. Hacé clic en **"Finalizar"**

¡Listo! La regla está creada.

#### ¿Cómo verificar que la regla se creó bien?

1. En la ventana de "Reglas de entrada", buscá la regla **"Printer Bridge"** en la lista
2. Tiene que estar con un **ícono verde** (con un cachito verde)
3. Si está deshabilitada (ícono gris), hacé clic derecho → **"Habilitar regla"**

### Alternativa: Desactivar el firewall temporalmente (SOLO para probar)

> ⚠️ **NO recomendado para uso normal.** Solo hacelo si querés probar rápido y luego volvé a activarlo.

1. En el Firewall de Windows Defender, hacé clic en **"Activar o desactivar el Firewall"** a la izquierda
2. Elegí **"Desactivar"** en la red que estés usando
3. Probá si funciona
4. **Volvé a activarlo** cuando termines de probar

---

## 10. ¿Qué pasa si están en switches/routers distintos?

Puede que la PC del sistema y las PCs con las impresoras estén conectadas a switches o routers distintos dentro de la planta. Acá te explicamos los dos casos posibles.

### Caso 1: Misma subred (los primeros 3 números de la IP son iguales) → Funciona solo ✅

Si las IPs comparten los primeros tres números, están en la misma red lógica aunque estén en switches distintos. Esto funciona sin configuración extra.

```
  Ejemplo:

  PC del sistema:    192.168.1.50
  PC 1 (Zebra):      192.168.1.10    ← mismos "192.168.1" ✅
  PC 2 (Datamax):    192.168.1.20    ← mismos "192.168.1" ✅


  ┌──────────┐      ┌────────┐      ┌──────────┐
  │ Sistema  │──────│Switch 1│──────│  Router  │
  └──────────┘      └────────┘      │          │
                                   │          │
  ┌──────────┐      ┌────────┐      │          │
  │  PC 1    │──────│Switch 2│──────│          │
  │  (Zebra) │      └────────┘      └──────────┘
  └──────────┘

  Funciona sin tocar nada. ✅
```

**¿Cómo verificarlo?** Ejecutá `ipconfig` en las tres PCs. Si las tres empiezan con los mismos tres números (ej: `192.168.1.xxx`), todo bien.

### Caso 2: Distinta subred (los primeros 3 números son distintos) → Necesita configuración extra ⚠️

Si las IPs tienen distintos primeros tres números, necesitan un router que conecte ambas redes. Esto es más complejo.

```
  Ejemplo:

  PC del sistema:    192.168.1.50
  PC 1 (Zebra):      10.0.0.10       ← ¡distinto! ⚠️
  PC 2 (Datamax):    10.0.0.20       ← ¡distinto! ⚠️


  ┌──────────┐      ┌────────┐      ┌────────┐      ┌────────┐
  │ Sistema  │──────│Router A│──────│Router B│──────│Switch  │
  └──────────┘      └────────┘      └────────┘      └────────┘
   192.168.1.x                       10.0.0.x         │
                                                   ┌────┴────┐
                                                   │  PC 1   │
                                                   │  PC 2   │
                                                   └─────────┘
```

**En este caso, consultá con soporte.** Se necesita configurar rutas estáticas o un router que haga de puente entre ambas redes. No es complicado pero requiere acceso a la configuración del router.

> **Regla práctica:** Fijate los primeros 3 números de las IPs. Si coinciden en todas las PCs, no te preocupés — funciona. Si no coinciden, llamá a soporte.

---

## 11. Verificar que funciona (PASO A PASO)

Ahora vamos a verificar que el sistema puede comunicarse con los Printer Bridges.

### Prueba desde el navegador (LA PRUEBA REAL)

Esta es la prueba que importa. Olvidate del ping (ver explicación más abajo).

#### Paso 1: Desde otra PC de la red

Parate en otra PC que esté en la misma red (por ejemplo, la PC donde corre el sistema).

#### Paso 2: Abrí el navegador y navegá a la IP del bridge

Escribí en la barra de direcciones:

```
http://192.168.1.153:9101
```

*(Reemplazá `192.168.1.153` por la IP real de la PC donde instalaste el bridge)*

#### Paso 3: Verificá el resultado

- ✅ **Se abre el panel de control del Printer Bridge** → ¡Todo bien! El sistema puede comunicarse con esa PC.
- ❌ **No se abre, se queda cargando o da error** → Hay un problema. Verificá:
  1. ¿La IP es correcta? (ejecutá `ipconfig` en la PC del bridge)
  2. ¿El firewall está configurado? (ver sección 9, o ejecutá el instalador como administrador)
  3. ¿El bridge está corriendo? (¿la ventana negra de `node index.js` está abierta?)
  4. ¿Ambas PCs están en la misma red?

Hacé lo mismo para la otra PC:

```
http://192.168.1.20:9101
```

*(Con la IP de la PC 2)*

### ¿Y el ping?

> **IMPORTANTE: Que el ping no funcione es TOTALMENTE NORMAL.**

El `ping` es otra forma de verificar si una PC es alcanzable, pero **Windows Firewall bloquea el ping por defecto** (bloquea un protocolo llamado ICMP). Así que es muy probable que al hacer ping te dé error aunque todo funcione perfectamente.

```
  Ejemplo de lo que vas a ver:

  C:\> ping 192.168.1.153

  Haciendo ping a 192.168.1.153 con 32 bytes de datos:
  Tiempo de espera agotado para esta solicitud.
  Tiempo de espera agotado para esta solicitud.
  Tiempo de espera agotado para esta solicitud.
  Tiempo de espera agotado para esta solicitud.

  Estadísticas de ping para 192.168.1.153:
      Paquetes: enviados = 4, recibidos = 0, perdidos = 4 (100% perdidos)


  ...PERO el navegador SÍ puede abrir http://192.168.1.153:9101

  ¿Eso está bien? → ¡SÍ! Es completamente normal.
```

**No te preocupes por el ping.** La prueba que importa es la del **navegador**. Si el navegador puede abrir `http://IP:9101`, todo funciona.

### Prueba final: imprimir desde el sistema

Una vez que verificaste que el navegador puede abrir el panel de control, ya podés configurar las impresoras en el sistema (ver sección 12).

---

## 12. Configurar las impresoras en el sistema

Ahora vamos a decirle al sistema del frigorífico dónde están las impresoras.

### Configurar la Zebra ZT230 (Rótulos de Media Res)

1. Entrá al sistema del frigorífico
2. Andá a **Configuración → Impresoras**
3. Hacé clic en **"Agregar impresora"** o en el botón **"+"**
4. Completá los datos según esta tabla:

| Campo | Valor que tenés que poner |
|-------|--------------------------|
| **Nombre** | `Zebra ZT230 - Rótulos` |
| **Tipo de rótulo** | `MEDIA_RES` |
| **Marca** | `ZEBRA` |
| **Modelo** | `ZT230` |
| **Puerto** | `RED` |
| **Dirección IP** | La IP de la PC 1 (ej: `192.168.1.153`) |
| **Ancho etiqueta** | `100` mm |
| **Alto etiqueta** | `50` mm |
| **DPI** | `203` |
| **Activa** | ✅ Sí |
| **Predeterminada** | ✅ Sí (para tipo MEDIA_RES) |

5. Hacé clic en **Guardar**

### Configurar la Datamax Mark II 4206 (Rótulos de Cuarto/Caja)

1. En la misma pantalla de **Configuración → Impresoras**
2. Agregá otra impresora:

| Campo | Valor que tenés que poner |
|-------|--------------------------|
| **Nombre** | `Datamax 4206 - Cuartos` |
| **Tipo de rótulo** | `CUARTO` (o el que uses) |
| **Marca** | `DATAMAX` |
| **Modelo** | `Mark II 4206` |
| **Puerto** | `RED` |
| **Dirección IP** | La IP de la PC 2 (ej: `192.168.1.20`) |
| **Ancho etiqueta** | `100` mm |
| **Alto etiqueta** | `50` mm |
| **DPI** | `203` |
| **Activa** | ✅ Sí |
| **Predeterminada** | ✅ Sí (para tipo CUARTO) |

3. Hacé clic en **Guardar**

### Resumen de IPs

| Impresora | PC | IP que ponés en el sistema |
|-----------|-----|---------------------------|
| Zebra ZT230 | PC 1 | La IP de la PC 1 |
| Datamax 4206 | PC 2 | La IP de la PC 2 |

> **Recordá:** La IP es de la PC, NO de la impresora. La impresora no tiene IP porque está conectada por USB.

---

## 13. Servicio Windows (arranque automático)

Si no querés tener que ejecutar `node index.js` cada vez que encendés la PC, podés instalar el Printer Bridge como **servicio de Windows**. Así se inicia solo cuando prendés la PC, sin que tengas que hacer nada.

### Instalar como servicio

1. Abrí PowerShell **como Administrador**
2. Ejecutá:

```powershell
cd C:\SolemarAlimentaria\printer-bridge
.\install-service.ps1
```

3. Esperá a que termine el proceso
4. Cuando diga "SERVICIO INSTALADO", listo

> **Nota:** Si ya tenías `node index.js` corriendo, podés cerrar esa ventana. El servicio lo reemplaza.

### Verificar que está corriendo

1. Presioná **Windows + R**
2. Escribí `services.msc` y presioná Enter
3. Se abre la ventana de "Servicios"
4. Buscá en la lista **"PrinterBridge"**
5. El estado debería decir **"En ejecución"** y el tipo de inicio **"Automático"**

```
  Nombre                Estado        Tipo de inicio
  ──────────────────────────────────────────────────────
  ...
  PrinterBridge         En ejecución  Automático     ← Tiene que verse así
  ...
```

### Comandos útiles (ejecutar en CMD como administrador)

| Comando | Para qué sirve |
|---------|---------------|
| `net stop PrinterBridge` | Detener el servicio |
| `net start PrinterBridge` | Iniciar el servicio |
| `sc query PrinterBridge` | Ver si está corriendo |

### Desinstalar el servicio

Si alguna vez necesitás sacarlo:

1. Abrí PowerShell como Administrador
2. Ejecutá:

```powershell
cd C:\SolemarAlimentaria\printer-bridge
.\uninstall-service.ps1
```

---

## 14. Solución de problemas

### Herramienta de diagnóstico (¡NUEVO en v2.0!)

El panel web tiene un botón de **"Diagnóstico"** que te dice automáticamente qué está mal. También podés acceder directo desde el navegador:

```
http://localhost:9101/api/diagnose
```

Te va a mostrar algo así:

```json
{
  "node": "v20.11.0 ✅",
  "printer": "Zebra ZT230 ✅",
  "printerFound": true,
  "port9100": "escuchando ✅",
  "port9101": "escuchando ✅",
  "firewall": "OK ✅",
  "ip": "192.168.1.153",
  "configFile": "OK ✅"
}
```

Si algo dice ❌, ese es el problema. Andá a la sección correspondiente más abajo.

### "No imprime nada"

Seguí este checklist en orden:

1. **¿El bridge está corriendo?**
   - Si usás `node index.js`: la ventana negra tiene que estar abierta
   - Si usás servicio: verificá en "Servicios" que PrinterBridge esté "En ejecución"
   - Si no está corriendo, ejecutá `node index.js` o hacé doble clic en `start.bat`

2. **¿La impresora está prendida?**
   - Fijate que la luz de la impresora esté prendida
   - Verificá que tenga etiquetas cargadas
   - Fijate que no tenga pilas de luz parpadeando (error)

3. **¿La impresora está bien conectada por USB?**
   - Desconectá el cable USB y volvelo a conectar
   - Probá otro puerto USB de la PC
   - Fijate que el cable no esté dañado

4. **¿Funciona la prueba desde el panel web?**
   - Abrí `http://localhost:9101` en la PC con la impresora
   - Hacé clic en "Imprimir prueba"
   - **Si acá funciona** pero desde el sistema no → es problema de red/firewall
   - **Si acá tampoco funciona** → es problema de la impresora (driver, conexión USB)

5. **¿La IP en el sistema es correcta?**
   - Ejecutá `ipconfig` en la PC del bridge
   - Verificá que la IP en el sistema coincida con la IP real de la PC

6. **¿El firewall está configurado?**
   - Ejecutá el diagnóstico: `http://localhost:9101/api/diagnose`
   - Si dice firewall ❌: ejecutá el instalador de nuevo como administrador, o hacé la configuración manual (sección 9)

### "Error al conectar" (desde el sistema)

El sistema no puede llegar al Printer Bridge. Verificá:

1. **IP correcta:** Ejecutá `ipconfig` en la PC del bridge y verificá que coincida con lo que pusiste en el sistema

2. **Firewall:** ¿El instalador se ejecutó como administrador? Probá el diagnóstico: `http://IP-DEL-BRIDGE:9101/api/diagnose`. Hacé la prueba del navegador: abrí `http://IP-DEL-BRIDGE:9101` desde otra PC

3. **Red:** ¿Ambas PCs están en el mismo router/switch? (ver sección 10)

4. **Bridge corriendo:** ¿El bridge está funcionando? (¿ventana negra abierta o servicio corriendo?)

### "Ping no funciona" / "Host unreachable" / "Tiempo de espera agotado"

> **ESTO ES NORMAL. No te preocupes.**

Windows Firewall **bloquea el ping por defecto**. El ping puede dar "host unreachable", "tiempo de espera agotado" o "Request timed out" y aún así todo funcionar perfectamente.

**La prueba real es el navegador, no el ping.**

Si abrís `http://IP:9101` en el navegador y se abre el panel, todo funciona. El ping es irrelevante.

### "Puerto 9100 ya está en uso" / "EADDRINUSE"

Significa que ya hay otro programa usando ese puerto en la PC. Probablemente el bridge ya está corriendo.

1. Cerrá la ventana de `node index.js` si está abierta
2. O detené el servicio: `net stop PrinterBridge`
3. Esperá unos segundos
4. Volvé a iniciar

Si persiste, verificá qué está usando el puerto:

1. Abrí CMD
2. Escribí: `netstat -ano | findstr :9100`
3. Si aparece un número en la última columna (PID), ese es el proceso que lo está usando
4. Para ver qué proceso es: abrí el **Administrador de tareas** → Details → buscá el PID

### "No detecta la impresora" (en el panel web o durante la instalación)

1. Verificá que la impresora esté en **Panel de Control → Dispositivos e Impresoras** (o Configuración → Bluetooth y dispositivos → Impresoras y escáneres)
2. Si no aparece:
   - Desconectá y volvé a conectar el cable USB
   - Reiniciá la PC
   - Instalá el driver de la impresora (ver sección 6)
3. Si aparece con un triángulo amarillo: hay un problema con el driver. Desinstalá la impresora y volvé a instalar el driver

### "Access denied" / Error de permisos

Si ves un error de permisos al intentar imprimir:

1. **Si usás el bridge manualmente:** Probá ejecutar `start.bat` (que levanta `node index.js`) en vez de correrlo directo desde la consola
2. **Si es problema de la impresora en Windows:** Andá a Panel de Control → Dispositivos e Impresoras → clic derecho en la impresora → "Propiedades" → pestaña "Seguridad" → verificá que tu usuario tenga permisos
3. **Si es problema del PowerShell:** Asegurate de ejecutarlo como Administrador (ver sección 7, Paso 1)

### "Printer not found" / "Impresora no encontrada"

El archivo `printer-config.json` tiene un nombre de impresora que no existe en Windows.

1. Abrí `http://localhost:9101/api/diagnose` y fijate qué dice "printer"
2. Si dice ❌, editá el archivo `C:\SolemarAlimentaria\printer-bridge\printer-config.json`
3. Verificá que el campo `"printerName"` coincida exactamente con el nombre en Windows
4. Para ver los nombres correctos, abrí PowerShell y ejecutá: `Get-Printer | Select Name`
5. Reiniciá el bridge después de editar el config

### "La impresora hace ruido pero sale etiqueta en blanco"

La impresora recibe la orden pero no imprime nada. Probablemente es un problema de calor o densidad de impresión:

1. Verificá que no se terminó el ribbon (cinta de transferencia térmica)
2. Probá aumentar la densidad en la configuración de la impresora
3. Si usás plantillas ZPL, el comando `~SD` controla la densidad (valores de 0 a 30). Probá `~SD20`

### "La etiqueta sale cortada o mal alineada"

1. **Verificá que el tamaño de etiqueta en el sistema coincida con el papel físico:**

| Papel físico | En el sistema |
|-------------|--------------|
| 100 mm de ancho | Ancho: 100 mm |
| 50 mm de alto | Alto: 50 mm |
| 25 mm de alto | Alto: 25 mm |

2. Verificá que los **sensores** de la impresora estén limpios (los que detectan el inicio de la etiqueta)
3. Calibrá la impresora (generalmente manteniendo presionado el botón de "Feed" por unos segundos)

### "No imprime después de reiniciar la PC"

1. Si usás `node index.js` manualmente: tenés que ejecutarlo de nuevo después de reiniciar. Instalá el servicio (sección 13) para que sea automático
2. Si usás servicio: verificá que el servicio esté "En ejecución" en la ventana de Servicios
3. Si la PC obtiene IP por DHCP, la IP puede haber cambiado. Ejecutá `ipconfig` y verificá que coincida con lo que hay en el sistema

---

## 15. Preguntas frecuentes

### ¿La impresora necesita cable de red?

**NO.** La impresora se conecta a la PC con **cable USB** (el chato). No conectes un cable de red a la impresora.

```
  Impresora ──cable USB──▶ PC ──cable de red──▶ Router
                (sí)                 (sí)
  Impresora ──cable de red──▶ Router  ← NO, esto no
```

### ¿La impresora tiene su propia dirección IP?

**NO.** Como la impresora está conectada por USB (no por red), no tiene una IP propia. La IP que necesitás es la de la **PC** donde está enchufada la impresora.

### ¿Puedo usar Wi-Fi en lugar de cable de red?

**Sí, podés.** Si la PC está conectada por Wi-Fi a la red del frigorífico, funciona igual. Pero cable de red es más estable y recomendado:

| | Cable de red | Wi-Fi |
|---|---|---|
| Velocidad | Más rápida | Más lenta |
| Estabilidad | Muy estable | Puede fluctuar |
| Recomendado | ✅ Sí | Funciona, pero no es ideal |

### ¿El ping tiene que funcionar para que imprima?

**NO.** Es completamente normal que el ping no funcione. Windows bloquea el ping por defecto. Lo que importa es que el navegador pueda abrir `http://IP:9101`.

### ¿Se pierde la IP si reinicio la PC?

**Puede pasar, sí.** Si la PC tiene configuración automática (DHCP), el router le puede asignar una IP distinta después de reiniciar. Esto es normal.

**¿Qué hacer?**

- La opción fácil: Si un día no imprime, ejecutá `ipconfig` en la PC del bridge, verificá la nueva IP y actualizala en el sistema
- La opción pro: Configurar una IP fija en Windows para que no cambie nunca (consultá con soporte si querés hacer esto)

### ¿Puedo tener ambas impresoras en la misma PC?

**Sí, pero no es lo ideal.** Podés instalar el Printer Bridge una vez por PC, y cada bridge maneja una sola impresora. Si tenés dos impresoras en la misma PC, necesitás configurar algo distinto. Consultá con soporte.

### ¿Qué pasa si cierro la ventana negra?

El bridge se deja de correr y no se imprime nada más. Tenés que volver a ejecutar `node index.js`, o hacé doble clic en `start.bat`, o mejor, instalá el servicio para que no tengas que preocuparte (ver sección 13).

### ¿Puedo apagar la impresora?

**Sí, podés.** Pero obviamente mientras esté apagada no va a imprimir. Cuando la prendas de nuevo, el bridge va a seguir funcionando e intentará imprimir lo que llegue.

### ¿Necesito instalar npm o algo más?

**NO.** La versión 2.0 del Printer Bridge no tiene dependencias. Solo necesitás Node.js instalado. El programa es un solo archivo (`index.js`) que funciona solo, sin necesidad de `npm install` ni paquetes extra.

### ¿Puedo reinstalar si algo sale mal?

**Sí, sin drama.** Borrá la carpeta `C:\SolemarAlimentaria\printer-bridge\` y ejecutá el instalador (`install.ps1`) de nuevo. No pierdes nada porque el instalador baja todo de internet.

---

## 16. Checklist final

Usá esta lista para verificar que todo está bien hecho. Marcá cada item con un ✅ cuando lo termines.

### PC 1 — Zebra ZT230

- [ ] Cable USB conectado entre la Zebra y la PC
- [ ] Zebra prendida y con etiquetas
- [ ] Zebra aparece en "Dispositivos e Impresoras" de Windows
- [ ] Node.js instalado (`node --version` muestra un número)
- [ ] Driver de la Zebra instalado
- [ ] PC conectada a la red (mismo router que las otras PCs)
- [ ] `install.ps1` ejecutado como Administrador (impresora correcta seleccionada)
- [ ] IP de la PC anotada: `_____._____._____._____`
- [ ] `node index.js` corriendo (ventana negra abierta) **O** servicio instalado
- [ ] Prueba de impresión exitosa desde `http://localhost:9101`
- [ ] Firewall configurado (el instalador lo hizo automáticamente, o verificación manual OK)
- [ ] Diagnóstico OK: `http://localhost:9101/api/diagnose` todo en ✅
- [ ] Prueba desde otra PC: `http://IP-PC1:9101` se abre en el navegador

### PC 2 — Datamax Mark II 4206

- [ ] Cable USB conectado entre la Datamax y la PC
- [ ] Datamax prendida y con etiquetas
- [ ] Datamax aparece en "Dispositivos e Impresoras" de Windows
- [ ] Node.js instalado (`node --version` muestra un número)
- [ ] Driver de la Datamax instalado
- [ ] PC conectada a la red (mismo router que las otras PCs)
- [ ] `install.ps1` ejecutado como Administrador (impresora correcta seleccionada)
- [ ] IP de la PC anotada: `_____._____._____._____`
- [ ] `node index.js` corriendo (ventana negra abierta) **O** servicio instalado
- [ ] Prueba de impresión exitosa desde `http://localhost:9101`
- [ ] Firewall configurado (el instalador lo hizo automáticamente, o verificación manual OK)
- [ ] Diagnóstico OK: `http://localhost:9101/api/diagnose` todo en ✅
- [ ] Prueba desde otra PC: `http://IP-PC2:9101` se abre en el navegador

### Sistema del Frigorífico

- [ ] Zebra ZT230 configurada (Configuración → Impresoras → RED → IP de la PC 1)
- [ ] Datamax 4206 configurada (Configuración → Impresoras → RED → IP de la PC 2)
- [ ] Plantillas asignadas correctamente (Media Res → Zebra, Cuarto → Datamax)
- [ ] Prueba de impresión real desde el sistema exitosa

### Notas

| PC | Impresora | IP anotada | Bridge corriendo | Firewall OK | Imprime |
|----|-----------|-----------|-----------------|-------------|---------|
| PC 1 | Zebra ZT230 | | | | |
| PC 2 | Datamax 4206 | | | | |

---

## Datos de contacto

Si tenés algún problema que no lográs resolver con esta guía, contactá a soporte:

- **Soporte técnico:** (número o email de soporte)
- **Horario:** (horario de atención)

---

*Instructivo preparado para Solemar Alimentaria — Sistema Frigorífico*
*Printer Bridge v2.0 — Última actualización: 2025*
