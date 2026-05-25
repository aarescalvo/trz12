/**
 * Printer Bridge Service - Solemar Alimentaria
 *
 * Escucha en TCP puerto 9100 y redirige los datos (ZPL/DPL)
 * a una impresora conectada por USB en Windows.
 *
 * Arquitectura:
 *   Sistema (Next.js) → TCP/IP :9100 → Este bridge → Impresora USB Windows
 *
 * Uso:
 *   bun run index.ts              (inicio normal)
 *   bun run dev                   (con auto-reload)
 *
 * Config: editar printer-config.json
 */

import net from 'net'
import fs from 'fs'
import path from 'path'
import http from 'http'

// ============================================================
// Configuración
// ============================================================
const CONFIG_PATH = path.join(__dirname, 'printer-config.json')

interface PrinterConfig {
  printerName: string          // Nombre exacto de la impresora en Windows
  tcpPort: number              // Puerto TCP a escuchar (default: 9100)
  httpPort: number             // Puerto HTTP para panel de control (default: 9101)
  logLevel: 'info' | 'debug' | 'error'
  autoStart: boolean           // Auto-arrancar en Windows
}

const DEFAULT_CONFIG: PrinterConfig = {
  printerName: '',             // Se debe configurar
  tcpPort: 9100,
  httpPort: 9101,
  logLevel: 'info',
  autoStart: true
}

function loadConfig(): PrinterConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
    }
  } catch (e) {
    console.error('Error leyendo config:', e)
  }
  return DEFAULT_CONFIG
}

function saveConfig(config: PrinterConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
}

let config = loadConfig()

// ============================================================
// Logger
// ============================================================
function log(level: 'info' | 'debug' | 'error', msg: string, data?: any) {
  const levels = { error: 0, info: 1, debug: 2 }
  if (levels[level] <= levels[config.logLevel]) {
    const ts = new Date().toLocaleTimeString('es-AR')
    const prefix = level === 'error' ? '❌' : level === 'info' ? '✅' : '🔍'
    console.log(`[${ts}] ${prefix} ${msg}`, data !== undefined ? JSON.stringify(data) : '')
  }
}

// ============================================================
// Detección de impresoras Windows
// ============================================================
function getPrinterModule() {
  try {
    // El paquete 'printer' es nativo de Windows
    // @ts-ignore - módulo nativo
    return require('printer')
  } catch {
    return null
  }
}

function listPrinters(): string[] {
  const printer = getPrinterModule()
  if (printer) {
    try {
      const printers = printer.getPrinters()
      return printers.map((p: any) => p.name)
    } catch {
      return []
    }
  }
  // Fallback: usar lista del sistema (si printer no está instalado)
  try {
    const { execSync } = require('child_process')
    const result = execSync('powershell -Command "Get-Printer | Select-Object -ExpandProperty Name"', {
      encoding: 'utf-8',
      timeout: 5000
    })
    return result.trim().split('\n').map((s: string) => s.trim()).filter(Boolean)
  } catch {
    return []
  }
}

function printRaw(printerName: string, data: Buffer | string): Promise<boolean> {
  return new Promise((resolve) => {
    const printer = getPrinterModule()
    if (printer) {
      try {
        printer.printDirect({
          printer: printerName,
          type: 'RAW',
          data: typeof data === 'string' ? Buffer.from(data, 'utf8') : data,
          success: (jobId: number) => {
            log('info', `Impresión enviada - Job #${jobId}`)
            resolve(true)
          },
          error: (err: any) => {
            log('error', `Error al imprimir: ${err}`)
            resolve(false)
          }
        })
      } catch (err) {
        log('error', `Error printDirect: ${err}`)
        resolve(false)
      }
    } else {
      log('error', 'Módulo "printer" no disponible. ¿Está en Windows?')
      resolve(false)
    }
  })
}

// ============================================================
// Servidor TCP (puerto 9100) - Recibe ZPL/DPL del sistema
// ============================================================
let printCount = 0
let lastPrintTime = ''

const tcpServer = net.createServer((socket) => {
  const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`
  log('info', `Conexión entrante desde ${remoteAddress}`)

  // Recopilar todos los datos que llegan
  const chunks: Buffer[] = []
  let totalBytes = 0

  socket.on('data', (chunk: Buffer) => {
    chunks.push(chunk)
    totalBytes += chunk.length
    log('debug', `Recibidos ${chunk.length} bytes (${totalBytes} total)`)
  })

  socket.on('end', async () => {
    const data = Buffer.concat(chunks)

    if (totalBytes === 0) {
      log('info', 'Conexión cerrada sin datos')
      return
    }

    if (!config.printerName) {
      log('error', 'No hay impresora configurada. Usá el panel web en http://localhost:' + config.httpPort)
      socket.end()
      return
    }

    log('info', `Enviando ${totalBytes} bytes a "${config.printerName}"`)

    const success = await printRaw(config.printerName, data)
    printCount++
    lastPrintTime = new Date().toLocaleString('es-AR')

    if (success) {
      log('info', `✅ Impresión #${printCount} exitosa`)
    } else {
      log('error', `❌ Impresión #${printCount} falló`)
    }

    socket.end()
  })

  socket.on('error', (err) => {
    log('error', `Error en socket: ${err.message}`)
  })

  socket.on('timeout', () => {
    log('error', 'Timeout en conexión TCP')
    socket.destroy()
  })

  socket.setTimeout(30000) // 30 segundos
})

// ============================================================
// Servidor HTTP (puerto 9101) - Panel de control web
// ============================================================
const httpServer = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')

  // API endpoints
  if (req.method === 'GET' && req.url === '/api/printers') {
    const printers = listPrinters()
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ printers, configured: config.printerName }))
    return
  }

  if (req.method === 'GET' && req.url === '/api/config') {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      ...config,
      printCount,
      lastPrintTime,
      status: 'running',
      uptime: process.uptime()
    }))
    return
  }

  if (req.method === 'POST' && req.url === '/api/config') {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        const newConfig = JSON.parse(body)
        if (newConfig.printerName !== undefined) config.printerName = newConfig.printerName
        if (newConfig.tcpPort !== undefined) config.tcpPort = parseInt(newConfig.tcpPort)
        if (newConfig.httpPort !== undefined) config.httpPort = parseInt(newConfig.httpPort)
        if (newConfig.logLevel !== undefined) config.logLevel = newConfig.logLevel
        saveConfig(config)
        res.end(JSON.stringify({ success: true, config }))
      } catch {
        res.statusCode = 400
        res.end(JSON.stringify({ error: 'JSON inválido' }))
      }
    })
    return
  }

  if (req.method === 'POST' && req.url === '/api/test') {
    if (!config.printerName) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'No hay impresora configurada' }))
      return
    }

    // Enviar ZPL de prueba: etiqueta simple con texto
    const testZPL = `^XA
^FO50,50^A0N,40,40^FD** PRUEBA **^FS
^FO50,100^A0N,25,25^FDZebra ZT230 - Bridge OK^FS
^FO50,140^A0N,20,20^FD${new Date().toLocaleString('es-AR')}^FS
^FO50,180^A0N,20,20^FDSolemar Alimentaria^FS
^XZ`

    printRaw(config.printerName, testZPL).then((success) => {
      res.end(JSON.stringify({ success, message: success ? 'Prueba enviada' : 'Error en prueba' }))
    })
    return
  }

  // Dashboard HTML
  res.end(generateDashboard())
})

function generateDashboard(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Printer Bridge - Solemar Alimentaria</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f5f5f4; color: #292524; padding: 20px; }
    .container { max-width: 700px; margin: 0 auto; }
    h1 { font-size: 24px; margin-bottom: 4px; color: #1c1917; }
    .subtitle { color: #78716c; margin-bottom: 24px; font-size: 14px; }
    .card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card h2 { font-size: 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .status { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .status.online { background: #dcfce7; color: #166534; }
    .status.offline { background: #fef2f2; color: #991b1b; }
    .status .dot { width: 8px; height: 8px; border-radius: 50%; }
    .status.online .dot { background: #22c55e; }
    select { width: 100%; padding: 10px 12px; border: 1px solid #d6d3d1; border-radius: 8px; font-size: 14px; background: white; cursor: pointer; margin-bottom: 12px; }
    select:focus { outline: none; border-color: #f59e0b; }
    .btn { padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-primary { background: #f59e0b; color: white; }
    .btn-primary:hover { background: #d97706; }
    .btn-secondary { background: #e7e5e4; color: #292524; }
    .btn-secondary:hover { background: #d6d3d1; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-danger:hover { background: #dc2626; }
    .btn-group { display: flex; gap: 8px; margin-top: 12px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-item { padding: 12px; background: #fafaf9; border-radius: 8px; }
    .info-item .label { font-size: 12px; color: #78716c; margin-bottom: 4px; }
    .info-item .value { font-size: 18px; font-weight: 700; color: #1c1917; }
    .log { background: #1c1917; color: #a8a29e; padding: 12px; border-radius: 8px; font-family: 'Consolas', monospace; font-size: 12px; max-height: 200px; overflow-y: auto; }
    .log div { padding: 2px 0; }
    .toast { position: fixed; bottom: 20px; right: 20px; padding: 12px 20px; border-radius: 8px; color: white; font-weight: 600; opacity: 0; transition: opacity 0.3s; }
    .toast.success { background: #22c55e; }
    .toast.error { background: #ef4444; }
    .instructions { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; font-size: 13px; line-height: 1.6; }
    .instructions h3 { color: #92400e; margin-bottom: 8px; }
    .instructions code { background: #fef3c7; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🖨️ Printer Bridge</h1>
    <p class="subtitle">Solemar Alimentaria — Puente TCP → Impresora USB</p>

    <!-- Estado -->
    <div class="card">
      <h2>
        <span class="status online"><span class="dot"></span> Conectado</span>
      </h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="label">Puerto TCP</div>
          <div class="value" id="tcpPort">${config.tcpPort}</div>
        </div>
        <div class="info-item">
          <div class="label">Impresiones</div>
          <div class="value" id="printCount">0</div>
        </div>
        <div class="info-item">
          <div class="label">Última impresión</div>
          <div class="value" id="lastPrint" style="font-size:14px">—</div>
        </div>
        <div class="info-item">
          <div class="label">Impresora</div>
          <div class="value" id="currentPrinter" style="font-size:14px">${config.printerName || 'Sin configurar'}</div>
        </div>
      </div>
    </div>

    <!-- Configurar impresora -->
    <div class="card">
      <h2>⚙️ Configurar Impresora</h2>
      <select id="printerSelect">
        <option value="">— Seleccionar impresora —</option>
      </select>
      <div class="btn-group">
        <button class="btn btn-primary" onclick="savePrinter()">💾 Guardar</button>
        <button class="btn btn-secondary" onclick="loadPrinters()">🔄 Actualizar lista</button>
      </div>
    </div>

    <!-- Probar impresión -->
    <div class="card">
      <h2>🧪 Probar Impresión</h2>
      <p style="font-size:13px; color:#78716c; margin-bottom:12px">
        Imprime una etiqueta de prueba con texto para verificar que el bridge funciona correctamente.
      </p>
      <button class="btn btn-primary" onclick="testPrint()">🖨️ Imprimir prueba</button>
    </div>

    <!-- Instrucciones para el sistema -->
    <div class="card">
      <h2>📋 Configurar en el Sistema</h2>
      <div class="instructions">
        <h3>Para que el sistema imprima a esta PC:</h3>
        <p><strong>1.</strong> Anotá la IP de esta PC. Podés verla ejecutando <code>ipconfig</code> en CMD.</p>
        <p><strong>2.</strong> En el sistema ir a <strong>Configuración → Impresoras</strong>.</p>
        <p><strong>3.</strong> Crear/editar impresora con estos datos:</p>
        <p>&nbsp;&nbsp;• Puerto: <strong>RED</strong></p>
        <p>&nbsp;&nbsp;• Dirección IP: <strong>la IP de esta PC</strong> (ej: 192.168.1.50)</p>
        <p>&nbsp;&nbsp;• Marca: ZEBRA</p>
        <p>&nbsp;&nbsp;• Modelo: ZT230</p>
        <p>&nbsp;&nbsp;• DPI: 203</p>
        <p><strong>4.</strong> Asignar la plantilla (ej: Media Res) a esta impresora.</p>
        <p><strong>5.</strong> El puerto TCP es <strong>${config.tcpPort}</strong> (el estándar para impresoras de etiquetas).</p>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    let config = ${JSON.stringify(config)};

    function showToast(msg, type) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.className = 'toast ' + type;
      t.style.opacity = '1';
      setTimeout(() => { t.style.opacity = '0'; }, 3000);
    }

    async function loadPrinters() {
      try {
        const res = await fetch('/api/printers');
        const data = await res.json();
        const sel = document.getElementById('printerSelect');
        sel.innerHTML = '<option value="">— Seleccionar impresora —</option>';
        data.printers.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p;
          opt.textContent = p;
          if (p === data.configured) opt.selected = true;
          sel.appendChild(opt);
        });
      } catch (e) {
        showToast('Error al cargar impresoras', 'error');
      }
    }

    async function savePrinter() {
      const printerName = document.getElementById('printerSelect').value;
      if (!printerName) {
        showToast('Seleccioná una impresora', 'error');
        return;
      }
      try {
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ printerName })
        });
        const data = await res.json();
        if (data.success) {
          config.printerName = printerName;
          document.getElementById('currentPrinter').textContent = printerName;
          showToast('Impresora configurada: ' + printerName, 'success');
        }
      } catch (e) {
        showToast('Error al guardar', 'error');
      }
    }

    async function testPrint() {
      if (!config.printerName) {
        showToast('Configurá una impresora primero', 'error');
        return;
      }
      try {
        const res = await fetch('/api/test', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          showToast('Prueba enviada ✓', 'success');
        } else {
          showToast('Error: ' + data.message, 'error');
        }
      } catch (e) {
        showToast('Error de conexión', 'error');
      }
    }

    async function refreshStats() {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        document.getElementById('printCount').textContent = data.printCount;
        document.getElementById('lastPrint').textContent = data.lastPrintTime || '—';
      } catch {}
    }

    loadPrinters();
    setInterval(refreshStats, 5000);
  </script>
</body>
</html>`
}

// ============================================================
// Inicio
// ============================================================
function start() {
  // Detectar IP de la máquina
  const nets = require('os').networkInterfaces()
  let localIP = 'localhost'
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        localIP = net.address
        break
      }
    }
    if (localIP !== 'localhost') break
  }

  // Iniciar servidor TCP (puerto 9100)
  tcpServer.listen(config.tcpPort, '0.0.0.0', () => {
    console.log('╔══════════════════════════════════════════════════════╗')
    console.log('║         PRINTER BRIDGE - Solemar Alimentaria         ║')
    console.log('╠══════════════════════════════════════════════════════╣')
    console.log(`║  TCP:  ${localIP}:${config.tcpPort} (recibe datos ZPL/DPL)`)
    console.log(`║  HTTP: http://${localIP}:${config.httpPort} (panel de control)`)
    console.log(`║  Impresora: ${config.printerName || '(sin configurar)'}`)
    console.log('╚══════════════════════════════════════════════════════╝')
    console.log('')
    console.log('Abrí http://localhost:' + config.httpPort + ' en tu navegador para configurar')
    console.log('')
  })

  tcpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Puerto ${config.tcpPort} ya está en uso. ¿Está corriendo otra instancia?`)
    } else {
      console.error('❌ Error TCP:', err.message)
    }
    process.exit(1)
  })

  // Iniciar servidor HTTP (panel de control)
  httpServer.listen(config.httpPort, '0.0.0.0', () => {
    log('debug', `Panel web disponible en http://localhost:${config.httpPort}`)
  })

  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      log('error', `Puerto HTTP ${config.httpPort} ya en uso`)
    }
  })
}

// Recargar config con señal
process.on('SIGUSR1', () => {
  config = loadConfig()
  log('info', 'Configuración recargada')
})

start()
