# INSTRUCTIVO DE INSTALACION - Printer Bridge v3.0
## PC de Pesaje - Windows 7 + Impresora Datamax Mark II (USB)

---

## PREPARACION — Desde otra PC con internet

### Paso 1: Descargar los archivos necesarios

Necesitás descargar **3 cosas** desde otra PC con internet y copiarlas a la PC de pesaje (pendrive, red, etc.):

| Archivo | Que es | Donde descargar |
|---------|--------|-----------------|
| `python-3.8.10.exe` | Instalador de Python 3.8.10 | https://www.python.org/ftp/python/3.8.10/python-3.8.10.exe |
| `pywin32-301.win32-py3.8.exe` | Libreria para imprimir | https://github.com/mhammond/pywin32/releases/download/b301/pywin32-301.win32-py3.8.exe |
| Carpeta `python/` | El bridge completo | Desde el repo: `mini-services/printer-bridge/python/` |

**Detalles de cada archivo:**

**Python 3.8.10:**
- Abrí el navegador y entra a: https://www.python.org/ftp/python/3.8.10/python-3.8.10.exe
- Descarga el archivo (~25 MB)
- Es la ULTIMA version de Python que funciona en Windows 7
- IMPORTANTE: No descargues Python 3.9 o superior, NO funcionan en Windows 7

**pywin32:**
- Abrí el navegador y entra a: https://github.com/mhammond/pywin32/releases/download/b301/pywin32-301.win32-py3.8.exe
- Descarga el archivo (~12 MB)
- Esta es la libreria que permite que Python se comunique con la impresora por USB
- Si la PC es de 64-bit, bajá: `pywin32-301.win-amd64.py3.8.exe`
  - https://github.com/mhammond/pywin32/releases/download/b301/pywin32-301.win-amd64.py3.8.exe

**Printer Bridge:**
- Desde el repo de GitHub (trz6), descargá/copiá toda la carpeta:
  `mini-services/printer-bridge/python/`
- Tiene que quedar una carpeta con estos archivos adentro:
  ```
  python/
  ├── index.py
  ├── install.bat
  ├── start.bat
  ├── install-service.bat
  ├── uninstall-service.bat
  ├── requirements.txt
  └── README.md
  ```

### Paso 2: Copiar todo a la PC de pesaje

1. Meté todo en un pendrive:
   - `python-3.8.10.exe`
   - `pywin32-301.win32-py3.8.exe` (o el amd64)
   - La carpeta `python/` completa
2. Conectá el pendrive a la PC de pesaje (Windows 7)
3. Copiá todo al escritorio o a una carpeta que encuentres fácil

---

## INSTALACION — En la PC de pesaje (Windows 7)

### Paso 3: Instalar Python 3.8.10

1. Hacé doble clic en `python-3.8.10.exe`
2. Se abre el instalador. **MUY IMPORTANTE**: 
   - **✅ Tildá** la casilla que dice **"Add Python 3.8 to PATH"** (abajo a la izquierda)
   - Si no tildás esto, Python no se va a poder usar desde la consola
3. Click en **"Install Now"**
4. Esperá a que termine (1-2 minutos)
5. Click en **"Close"**

**Verificar que se instaló bien:**
1. Click en **Inicio** → **Todos los programas** → **Accesorios** → **Símbolo del sistema** (CMD)
2. Escribí: `python --version`
3. Tiene que responder: `Python 3.8.10`
4. Si dice "python no se reconoce como comando", entonces no tildaste "Add to PATH". En ese caso:
   - Desinstalá Python (Inicio → Panel de Control → Programas → Desinstalar)
   - Volvé a instalar desde el .exe, esta vez tildando "Add Python to PATH"

### Paso 4: Instalar pywin32

1. Hacé doble clic en `pywin32-301.win32-py3.8.exe`
2. Click en **"Siguiente"**, **"Siguiente"**, **"Instalar"**
3. Esperá a que termine
4. Click en **"Finalizar"**

**Verificar que se instaló bien:**
1. Abrí CMD (Símbolo del sistema)
2. Escribí: `python -c "import win32print; print('OK')"`
3. Tiene que responder: `OK`
4. Si da error de que no encuentra el módulo, intentá instalar con pip:
   - `pip install pywin32`
   - o `python -m pip install pywin32`

### Paso 5: Verificar que la Datamax está instalada en Windows

1. Conectá la impresora Datamax por USB (si no estaba conectada)
2. Andá a **Inicio** → **Dispositivos e impresoras** (o Panel de Control → Dispositivos e impresoras)
3. Buscá la Datamax en la lista. Tiene que aparecer como algo tipo:
   - `Datamax Mark II`
   - `Datamax-O'Neil Mark II`
   - O el nombre que le pusieron cuando la instalaron

**Si NO aparece la Datamax:**
1. La impresora tiene que estar encendida y conectada por USB
2. Probá desconectar y reconectar el cable USB
3. SiWindows no la detecta automáticamente:
   - Buscá el driver de la Datamax Mark II (usualmente viene en un CD o se descarga de Datamax-O'Neil)
   - Instalá el driver
   - Reiniciá la PC

**Anotá el NOMBRE EXACTO de la impresora** — lo vas a necesitar en el paso siguiente. Tiene que ser EXACTAMENTE igual a como aparece en la lista, incluyendo espacios y caracteres especiales.

### Paso 6: Ejecutar el instalador del Bridge

1. Abrí la carpeta `python/` que copiaste del pendrive
2. Hacé **click derecho** en `install.bat`
3. Elegí **"Ejecutar como administrador"**
4. Se abre una ventana negra con el instalador. Vas a ver:

```
============================================================
  PRINTER BRIDGE v3.0 (PYTHON) - Solemar Alimentaria
  Instalador para Windows 7
============================================================

[OK] Python encontrado: 3.8.10

[INFO] pywin32 no esta instalado. Instalando...
(o bien [OK] pywin32 ya instalado)

Instalando en: C:\SolemarAlimentaria\printer-bridge
[OK] Archivos copiados.

============================================================
  IMPRESORAS DETECTADAS
============================================================

  [0] Datamax Mark II (Datamax Mark II)
  [1] Microsoft XPS Document Writer (Microsoft XPS Document Writer)
  ...

============================================================
  CONFIGURACION
============================================================

Escribi el nombre EXACTO de la impresora Datamax tal como aparece arriba.

Nombre de la impresora: _
```

5. **Escribí el nombre exacto** de la Datamax (tal cual aparece en la lista, incluyendo espacios)
   - Por ejemplo: `Datamax Mark II`
   - OJO: Si el nombre tiene comillas o caracteres raros, copialo con cuidado
6. Presioná Enter

7. El instalador continua:

```
[OK] Configuracion guardada.

============================================================
  CONFIGURACION DEL FIREWALL
============================================================

[OK] Puerto TCP 9100 abierto.
[OK] Puerto HTTP 9101 abierto.

============================================================
  INSTALACION COMPLETADA
============================================================

  Impresora:   Datamax Mark II
  Puerto TCP:  9100 (recibe datos de TrazAlan)
  Panel Web:   http://192.168.1.50:9101
  Archivos:    C:\SolemarAlimentaria\printer-bridge

  PROXIMOS PASOS:
  1. Ejecuta start.bat para iniciar el bridge
  2. Abri http://localhost:9101 en el navegador
  3. Hace clic en "Imprimir prueba"
  4. En TrazAlan configurar impresora con:
     IP: 192.168.1.50
     Puerto: 9100
```

**Anotá la IP** que muestra el instalador (ej: `192.168.1.50`). La vas a necesitar para configurar TrazAlan.

---

## PRUEBA — Verificar que funciona

### Paso 7: Iniciar el Bridge

1. Entrá a la carpeta: `C:\SolemarAlimentaria\printer-bridge\`
2. Hacé doble clic en **`start.bat`**
3. Se abre una ventana negra que dice:

```
========================================================
  PRINTER BRIDGE v3.0 (Python) - Solemar Alimentaria
========================================================
  Python:    3.8.10
  pywin32:   OK
  TCP:       192.168.1.50:9100
  Panel Web: http://192.168.1.50:9101
  Impresora: Datamax Mark II
========================================================

Abri http://localhost:9101 en tu navegador para configurar
```

**Esta ventana TIENE que quedar abierta** mientras querés imprimir. Si la cerrás, el bridge se detiene.

### Paso 8: Abrir el Panel de Control

1. Abrí el navegador (Internet Explorer, Firefox, Chrome, el que tenga)
2. Entrá a: **http://localhost:9101**
3. Vas a ver un panel con:
   - Estado: Conectado
   - Puerto TCP: 9100
   - Impresiones: 0
   - La impresora Datamax seleccionada

### Paso 9: Imprimir Etiqueta de Prueba

1. En el panel web, verificá que la Datamax esté seleccionada en el dropdown
2. Asegurate que el formato diga **"DPL (Datamax)"** en las pestañas
3. Hacé clic en **"Imprimir prueba"**
4. La Datamax debería imprimir una etiqueta que dice:
   ```
   SOLEMAR ALIMENTARIA
   ** PRUEBA **
   Printer Bridge v3.0
   30/04/2026 14:30:00
   Datamax Mark II
   ```

**Si imprimió correctamente** → El bridge funciona. Pasá al Paso 10.

**Si NO imprimió:**

| Síntoma | Causa probable | Solución |
|---------|---------------|----------|
| "No hay impresora configurada" | No se seleccionó la impresora | En el panel web, seleccioná la Datamax y hacé "Guardar" |
| "Impresora X no encontrada" | El nombre no coincide exactamente | Verificá en Panel de Control → Dispositivos e impresoras que el nombre sea idéntico |
| "Acceso denegado" | Permisos de Windows | Ejecutá start.bat como Administrador |
| "La impresora está pausada" | La Datamax está en pausa | Andá a Dispositivos e impresoras, click derecho → "Reanudar impresión" |
| La Datamax hace ruido pero sale etiqueta en blanco | Formato incorrecto | Probá con ZPL en vez de DPL, o viceversa |
| No hace nada | Cable USB desconectado o apagada | Verificá que la Datamax esté encendida y el cable USB conectado |

### Paso 9b: Diagnóstico

Si algo falló, usá el diagnóstico del panel web:

1. En el panel web (http://localhost:9101)
2. Scrolleá hasta **"Diagnóstico"**
3. Hacé clic en **"Ejecutar diagnóstico"**
4. Aparece un cuadro negro con info del sistema. Esto te dice:
   - Si pywin32 está instalado
   - Si la configuración existe
   - Qué impresoras detectó
   - Puerto de la impresora (ej: USB001)
   - Últimos errores

---

## CONFIGURACION EN TRAZALAN

### Paso 10: Configurar la impresora en TrazAlan

Desde la PC donde corre TrazAlan (o desde cualquier PC con acceso al sistema):

1. Entrá a TrazAlan
2. Andá a **Configuración** → **Impresoras** (o **Puestos de Trabajo**)
3. Creá una nueva impresora con estos datos:

| Campo | Valor |
|-------|-------|
| Nombre | `Datamax Pesaje` (o el que quieras) |
| Marca | `DATAMAX` |
| Modelo | `Mark II` |
| Tipo | `RED` (o `TCP/IP`) |
| IP | `192.168.1.50` (la IP que mostró el instalador en el Paso 6) |
| Puerto | `9100` |
| DPI | `203` |
| Ancho etiqueta | `90` (mm) o el tamaño que use |
| Alto etiqueta | `60` (mm) o el tamaño que use |
| Activa | ✅ Sí |

4. Guardá

### Paso 11: Configurar en Pesaje Individual

1. Andá al módulo **Pesaje Individual**
2. En la configuración de impresora del módulo (botón de impresora o configuración del puesto de trabajo)
3. Seleccioná la impresora que creaste: `Datamax Pesaje`
4. Asegurate que la plantilla seleccionada sea una DPL para Datamax

### Paso 12: Probar desde TrazAlan

1. Cerrá y volvé a abrir el navegador de TrazAlan
2. Andá a Pesaje Individual
3. Pesá un animal de prueba
4. Al registrar el peso, debería imprimir la etiqueta automáticamente en la Datamax

---

## OPCIONAL: Auto-inicio con Windows

Si querés que el bridge se inicie automáticamente cada vez que se enciende la PC (sin tener que ejecutar start.bat manualmente):

1. Hacé **click derecho** en `install-service.bat` (en `C:\SolemarAlimentaria\printer-bridge\`)
2. Elegí **"Ejecutar como administrador"**
3. Se configura una tarea programada de Windows
4. A partir de ahora, el bridge se inicia solo cuando arranca Windows

**Para verificar que funciona:**
- Reiniciá la PC
- Esperá 1-2 minutos
- Abrí http://localhost:9101 en el navegador
- El panel web debería cargar (significa que el bridge está corriendo)

**Para desinstalar el servicio:**
- Ejecutá `uninstall-service.bat` como Administrador

---

## RESOLUCION DE PROBLEMAS

### "No se puede conectar a python.org"
La PC de pesaje no tiene internet. No hace falta. Todos los archivos se descargan desde otra PC (Pasos 1-2).

### "pip no funciona" o "No se pudo instalar pywin32"
Instalá pywin32 manualmente con el archivo .exe que bajaste (Paso 4).

### "La impresora no se detecta"
1. Verificá que la Datamax esté encendida
2. Desconectá y reconectá el cable USB
3. Probá otro puerto USB
4. Andá a Panel de Control → Dispositivos e impresoras
5. Si no aparece, instalá el driver de la Datamax

### "El bridge arranca pero no imprime"
1. Abrí el panel web (http://localhost:9101)
2. Ejecutá el diagnóstico
3. Verificá que el nombre de impresora coincida EXACTAMENTE
4. Probá imprimir la etiqueta de prueba desde el panel

### "El bridge se cierra solo"
Verificá que no haya un antivirus bloqueando python.exe. Agregá una excepción si es necesario.

### "No puedo acceder al panel web desde otra PC"
1. Verificá que el firewall de Windows esté permitiendo los puertos 9100 y 9101
2. Verificá que ambas PCs estén en la misma red
3. Ejecutá install.bat de nuevo (abre los puertos del firewall)

### "Las etiquetas salen en blanco o con garabatos"
El formato de la plantilla no coincide con la impresora. La Datamax Mark II usa **DPL**, no ZPL. Verificá que en TrazAlan la plantilla sea tipo DPL para Datamax.
