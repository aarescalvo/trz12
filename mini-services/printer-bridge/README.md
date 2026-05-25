# Printer Bridge - Solemar Alimentaria

## ¿Qué es?

Puente entre el sistema frigorífico y una impresora conectada por USB a una PC con Windows.

```
Sistema (Next.js) ──TCP/IP:9100──▶ Esta PC ──USB──▶ Impresora Zebra ZT230
```

## Requisitos

- **Windows 7/10/11** (la PC donde está conectada la impresora por USB)
- **Node.js** v18 o superior: https://nodejs.org/ (elegir LTS)
- **Impresora Zebra ZT230** instalada en Windows con su driver

## Instalación rápida

1. Copiar todos los archivos a la PC con la impresora USB
2. Ejecutar **`install.bat`** (clic derecho → Ejecutar como administrador si da problemas)
3. Seguir las instrucciones: escribir el nombre de la impresora cuando lo pida
4. Ejecutar **`start.bat`** para iniciar el bridge

## Instalación como servicio (arranque automático)

Para que el bridge se inicie automáticamente con Windows:

1. Ejecutar **`install-service.bat`** como administrador
2. Listo, se iniciará solo cada vez que enciendas la PC

Para desinstalar: **`uninstall-service.bat`** como administrador

## Panel de control web

Abrí en tu navegador: **http://localhost:9101**

Desde ahí podés:
- Ver impresoras detectadas
- Seleccionar/cambiar la impresora
- Hacer prueba de impresión
- Ver estadísticas (cantidad de impresiones, última impresión)

## Configurar en el sistema

Una vez que el bridge está corriendo:

1. Averiguá la IP de esta PC (abrir CMD y escribir `ipconfig`)
2. Ir al sistema → **Configuración → Impresoras**
3. Crear o editar impresora con estos datos:
   - **Nombre**: Zebra ZT230 - Rótulos
   - **Puerto**: RED
   - **Dirección IP**: (la IP de esta PC, ej: 192.168.1.50)
   - **Marca**: ZEBRA
   - **Modelo**: ZT230
   - **Tipo**: MEDIA_RES (o el que corresponda)
   - **Ancho**: 100mm
   - **Alto**: 50mm
   - **DPI**: 203
   - **Activa**: ✅
   - **Predeterminada**: ✅

## Troubleshooting

### "No imprime"
- Verificar que el bridge esté corriendo (la ventana negra debe estar abierta)
- Verificar que la impresora esté encendida y con papel
- Hacer una prueba desde el panel web (http://localhost:9101)
- Verificar que el firewall de Windows no esté bloqueando el puerto 9100

### "Puerto 9100 en uso"
- Otra aplicación lo está usando. Cerrala o cambiá el puerto en `printer-config.json`

### "Módulo printer no disponible"
- Ejecutá `npm install --production` dentro de la carpeta `C:\SolemarAlimentaria\printer-bridge`

### "No detecta la impresora"
- Verificar que la impresora esté instalada en Windows (Panel de Control → Dispositivos e Impresoras)
- Instalar el driver de Zebra: https://www.zebra.com/us/en/software/printer-software/drivers.html
