# Printer Bridge v3.0 (Python) - Solemar Alimentaria

## Que es?

Puente TCP → Impresora USB que permite al sistema TrazAlan enviar etiquetas
a una impresora Datamax Mark II conectada por USB en una PC con Windows 7.

## Requisitos

- **Windows 7 Service Pack 1** (OBLIGATORIO - Python no se instala sin SP1)
- **KB2999226** (Universal C Runtime - necesario para Python 3.8+)
- Python 3.8.10 (ultima version compatible con Windows 7)
- pywin32 (para comunicarse con la impresora via Win32 API)
- Impresora Datamax Mark II conectada por USB e instalada en Windows

## Preparacion de Windows 7 (PRIMERO)

**IMPORTANTE:** Antes de instalar Python, asegurese de tener SP1 y KB2999226.
Si el setup de Python muestra "setup failed", faltan estos prerequisitos.

### Paso 0: Ejecutar diagnostico

Ejecute `setup-prep.bat` para ver que falta exactamente.

### Instalar Service Pack 1

**NOTA:** Microsoft borró los links oficiales de descarga. Usar estas alternativas:

- **Opcion A (Recomendada):** LegacyUpdate.net (sitio comunitario que mantiene los instaladores):
  - https://legacyupdate.net/download-center/download/5842/windows-7-and-windows-server-2008-r2-sp1-kb976932
  - 32-bit: `windows6.1-KB976932-X86.exe`
  - 64-bit: `windows6.1-KB976932-X64.exe` (elegir en la página)
- **Opcion B:** Windows Update → Buscar actualizaciones → Instalar todo → Reiniciar (puede no funcionar si Win7 está muy desactualizado)

### Instalar KB2999226 (Universal C Runtime)

- **Opcion A (64-bit):** Descarga directa desde Microsoft:
  - https://download.microsoft.com/download/1/1/5/11565A9A-EA09-4F0A-A57E-520D5D138140/Windows6.1-KB2999226-x64.msu
- **Opcion B (32-bit):** Microsoft borró el link x86. Usar Windows Update Catalog:
  - https://www.catalog.update.microsoft.com/Search.aspx?q=KB2999226
  - Buscar KB2999226, filtrar por x86, agregar al carrito y descargar
- **Opcion C (Recomendada para 32-bit):** Instalar el Convenience Rollup KB3125574 que incluye KB2999226 y muchas mas actualizaciones
  - https://support.microsoft.com/es-es/kb/3125574

## Instalacion

### 1. Instalar Python 3.8.10

Windows 7 NO soporta versiones modernas de Python.

**Desde otra PC con internet:**
1. Descarga: https://www.python.org/ftp/python/3.8.10/
2. Si Win7 es 32-bit: `python-3.8.10.exe`
   Si Win7 es 64-bit: `python-3.8.10-amd64.exe`
3. Copia el archivo a la PC de pesaje (pendrive, red, etc.)
4. Ejecuta python-3.8.10.exe
5. **IMPORTANTE**: Marca "Add Python 3.8 to PATH"
6. Click "Install Now"

**Si el setup falla con "setup failed":**
- Verifique que tiene SP1 instalado (ver arriba)
- Verifique que tiene KB2999226 instalado (ver arriba)
- Reinicie la PC e intente de nuevo

### 2. Instalar pywin32

Si la PC tiene internet:
```
pip install pywin32
```

Si la PC NO tiene internet:
1. Desde otra PC, descarga de https://github.com/mhammond/pywin32/releases
2. Busca `pywin32-301.win32-py3.8.exe` (para Win7 32-bit)
   o `pywin32-301.win-amd64.py3.8.exe` (para Win7 64-bit)
3. Copia y ejecuta en la PC de pesaje

### 3. Ejecutar install.bat

1. Copia todos los archivos a la PC de pesaje
2. Click derecho en `install.bat` → "Ejecutar como Administrador"
3. El instalador verificara automaticamente SP1, KB2999226, Python y pywin32
4. Selecciona la impresora Datamax cuando te lo pida

### 4. Iniciar el bridge

Ejecuta `start.bat` (o el servicio si lo configuraste)

## Uso

### Panel de Control Web

Abri http://localhost:9101 en el navegador:
- Configurar impresora
- Imprimir etiqueta de prueba
- Ver estadisticas
- Ejecutar diagnostico

### Probar la impresion

1. Abri http://localhost:9101
2. Asegurate de tener la impresora Datamax seleccionada
3. Click en "Imprimir prueba"
4. Selecciona formato: DPL (Datamax) o ZPL (Zebra)

## Configurar en TrazAlan

1. Verifica la IP de la PC de pesaje: `ipconfig`
2. En TrazAlan ir a Configuracion → Impresoras
3. Crear/editar impresora con:
   - Puerto: RED
   - IP: la IP de la PC de pesaje (ej: 192.168.1.50)
   - Puerto TCP: 9100
   - Marca: DATAMAX
   - Modelo: Mark II
   - DPI: 203

## Puertos

| Puerto | Protocolo | Funcion |
|--------|-----------|---------|
| 9100   | TCP       | Recibe datos de impresion (ZPL/DPL) desde TrazAlan |
| 9101   | HTTP      | Panel de control web |

## Formatos Soportados

- **DPL** (Datamax Programming Language) - Formato nativo Datamax Mark II
- **ZPL** (Zebra Programming Language) - Compatible con impresoras Zebra
- **RAW** - Cualquier dato enviado directamente (archivos binarios, ITF)

## Servicio Windows (auto-inicio)

Para que el bridge inicie automaticamente con Windows:

1. Ejecuta `install-service.bat` como Administrador
2. El bridge se iniciara cada vez que arranca Windows

Para desinstalar: ejecuta `uninstall-service.bat` como Administrador

## Solucion de Problemas

### "setup failed" al instalar Python
- Falta Windows 7 Service Pack 1 o KB2999226
- Ejecute `setup-prep.bat` para diagnosticar
- Ver seccion "Preparacion de Windows 7" arriba

### "pywin32 no esta instalado"
- Ejecuta: `pip install pywin32`
- Si no hay internet, descarga el .exe desde otra PC

### "Impresora no encontrada"
- Verifica que el nombre coincida EXACTAMENTE (incluye espacios)
- Abrir Panel de Control → Dispositivos e Impresoras para ver el nombre

### "Puerto ya en uso"
- Puede haber otra instancia corriendo: `taskkill /F /IM python.exe`
- O verifica que otro programa no use el puerto 9100

### "Acceso denegado"
- Ejecuta como Administrador

### La etiqueta sale en blanco o con garabatos
- Verifica que la plantilla en TrazAlan sea DPL (no ZPL) para Datamax
- La Datamax Mark II usa DPL, NO ZPL

## Archivos

| Archivo | Descripcion |
|---------|-------------|
| index.py | Servidor principal (TCP + HTTP) |
| install.bat | Instalador automatico (verifica SP1, KB2999226, Python) |
| setup-prep.bat | Diagnostico de prerequisitos (ejecutar primero) |
| start.bat | Inicio manual |
| install-service.bat | Configurar como servicio Windows |
| uninstall-service.bat | Quitar servicio Windows |
| requirements.txt | Dependencia Python |
| printer-config.json | Configuracion (se crea al instalar) |
| INSTRUCTIVO-INSTALACION.md | Instructivo detallado de instalacion |
