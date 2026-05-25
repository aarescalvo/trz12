/**
 * Balanza Service - Torres Scale RS232 Communication
 * 
 * This service manages RS232 serial port connections to Torres scales,
 * reads weight data, detects stability, and broadcasts via WebSocket.
 * 
 * Features:
 * - WebSocket server on port 3010
 * - Multiple scale configurations
 * - Weight stability detection
 * - Torres scale protocol parsing (STX + weight + ETX)
 * - HTTP API endpoints for configuration
 * - Auto-reconnection on serial port errors
 */

import { createServer, IncomingMessage, ServerResponse } from 'http'
import { WebSocketServer, WebSocket, RawData } from 'ws'
import { SerialPort, DelimiterParser } from 'serialport'

// ============================================================================
// Types and Interfaces
// ============================================================================

interface ScaleConfig {
  id: string
  name: string
  port: string           // COM port (Windows) or /dev/ttyUSB* (Linux)
  baudRate: number       // Default: 9600
  dataBits: 5 | 6 | 7 | 8
  stopBits: 1 | 2
  parity: 'none' | 'even' | 'odd' | 'mark' | 'space'
  enabled: boolean
  description?: string
  location?: string
}

interface WeightReading {
  scaleId: string
  weight: number
  unit: string
  stable: boolean
  raw: string
  timestamp: Date
  error?: string
}

interface WeightBuffer {
  readings: number[]
  lastWeights: number[]
  stableCount: number
  lastStableWeight: number | null
}

interface WSClient {
  ws: WebSocket
  subscriptions: Set<string>  // Scale IDs this client is subscribed to
}

// ============================================================================
// Constants
// ============================================================================

const WS_PORT = 3010
const HTTP_PORT = 3010

// Torres scale protocol constants
const STX = 0x02  // Start of text
const ETX = 0x03  // End of text
const CR = 0x0D   // Carriage return
const LF = 0x0A   // Line feed

// Stability detection settings
const STABILITY_THRESHOLD = 0.02    // 20g variation allowed
const STABILITY_COUNT = 5           // Consecutive readings within threshold
const BUFFER_SIZE = 10              // Number of readings to keep

// Default scale configurations
const DEFAULT_SCALES: ScaleConfig[] = [
  {
    id: 'balanza-1',
    name: 'Balanza Principal',
    port: 'COM1',
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    enabled: true,
    description: 'Balanza principal de recepción',
    location: 'Recepción'
  },
  {
    id: 'balanza-2',
    name: 'Balanza Camiones',
    port: '/dev/ttyUSB0',
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    enabled: true,
    description: 'Balanza para pesaje de camiones',
    location: 'Portón'
  }
]

// ============================================================================
// Global State
// ============================================================================

// Scale configurations and connections
const scaleConfigs: Map<string, ScaleConfig> = new Map()
const serialPorts: Map<string, SerialPort> = new Map()
const weightBuffers: Map<string, WeightBuffer> = new Map()

// WebSocket clients
const wsClients: Set<WSClient> = new Set()

// Latest weight readings for each scale
const latestReadings: Map<string, WeightReading> = new Map()

// ============================================================================
// Torres Scale Protocol Parser
// ============================================================================

/**
 * Parses weight data from Torres scale protocol
 * Common formats:
 * - STX + weight + ETX
 * - STX + sign + weight + unit + ETX
 * - Continuous streaming with CR/LF delimiters
 */
function parseTorresWeight(data: Buffer | string): { weight: number; unit: string; raw: string } | null {
  const raw = typeof data === 'string' ? data : data.toString('ascii')
  let cleanData = raw
  
  // Remove STX, ETX, CR, LF characters
  cleanData = cleanData.replace(/[\x02\x03\x0D\x0A]/g, '').trim()
  
  // Try multiple patterns
  const patterns = [
    // Pattern 1: Optional sign + digits + optional decimal + optional unit
    /^([+-]?)(\d+\.?\d*)\s*(kg|lb|g|KG|LB|G)?$/i,
    // Pattern 2: Weight with spaces
    /^([+-]?\d+\.?\d*)\s+(kg|lb|g)$/i,
    // Pattern 3: Just numeric weight
    /^([+-]?\d+\.?\d*)$/,
    // Pattern 4: Format with status (e.g., "ST,GS,+12.345,kg")
    /^(ST|US),(GS|NT),([+-]?\d+\.?\d*),(kg|lb|g)?$/i,
    // Pattern 5: Continuously streaming format
    /^([+-]?\d+\.?\d*)\s*(kg|lb)?$/i
  ]
  
  for (const pattern of patterns) {
    const match = cleanData.match(pattern)
    if (match) {
      let weight: number
      let unit = 'kg'
      
      // Handle different match groups
      if (pattern === patterns[3]) {
        // Status format: ST,GS,+12.345,kg
        weight = parseFloat(match[3])
        unit = match[4] || 'kg'
      } else if (match[2] && isNaN(parseFloat(match[2]))) {
        // Unit in second group
        weight = parseFloat(match[1])
        unit = match[2].toLowerCase()
      } else {
        // Just weight or weight with numeric second part
        weight = parseFloat(match[1])
        if (match[2] && !isNaN(parseFloat(match[2]))) {
          unit = match[2]
        }
      }
      
      // Validate weight
      if (!isNaN(weight) && isFinite(weight)) {
        return {
          weight: Math.abs(weight),
          unit: unit.toLowerCase() === 'lb' ? 'lb' : 'kg',
          raw: raw.trim()
        }
      }
    }
  }
  
  // Try extracting any number sequence as last resort
  const numericMatch = cleanData.match(/([+-]?\d+\.?\d*)/)
  if (numericMatch) {
    const weight = parseFloat(numericMatch[1])
    if (!isNaN(weight) && isFinite(weight)) {
      return {
        weight: Math.abs(weight),
        unit: 'kg',
        raw: raw.trim()
      }
    }
  }
  
  return null
}

// ============================================================================
// Weight Stability Detection
// ============================================================================

function initWeightBuffer(scaleId: string): WeightBuffer {
  const buffer: WeightBuffer = {
    readings: [],
    lastWeights: [],
    stableCount: 0,
    lastStableWeight: null
  }
  weightBuffers.set(scaleId, buffer)
  return buffer
}

function checkStability(scaleId: string, weight: number): boolean {
  let buffer = weightBuffers.get(scaleId)
  if (!buffer) {
    buffer = initWeightBuffer(scaleId)
  }
  
  // Add to readings buffer
  buffer.readings.push(weight)
  if (buffer.readings.length > BUFFER_SIZE) {
    buffer.readings.shift()
  }
  
  // Check against last weights
  if (buffer.lastWeights.length > 0) {
    const lastWeight = buffer.lastWeights[buffer.lastWeights.length - 1]
    const diff = Math.abs(weight - lastWeight)
    
    if (diff <= STABILITY_THRESHOLD) {
      buffer.stableCount++
    } else {
      buffer.stableCount = 0
    }
  }
  
  // Add to last weights
  buffer.lastWeights.push(weight)
  if (buffer.lastWeights.length > BUFFER_SIZE) {
    buffer.lastWeights.shift()
  }
  
  // Determine stability
  const isStable = buffer.stableCount >= STABILITY_COUNT
  
  if (isStable) {
    buffer.lastStableWeight = weight
  }
  
  return isStable
}

function getAverageWeight(scaleId: string): number | null {
  const buffer = weightBuffers.get(scaleId)
  if (!buffer || buffer.readings.length === 0) {
    return null
  }
  return buffer.readings.reduce((a, b) => a + b, 0) / buffer.readings.length
}

// ============================================================================
// Serial Port Management
// ============================================================================

async function openSerialPort(config: ScaleConfig): Promise<SerialPort | null> {
  if (!config.enabled) {
    console.log(`[Scale ${config.id}] Scale is disabled, skipping connection`)
    return null
  }
  
  try {
    const port = new SerialPort({
      path: config.port,
      baudRate: config.baudRate,
      dataBits: config.dataBits,
      stopBits: config.stopBits,
      parity: config.parity,
      autoOpen: false
    })
    
    // Open the port
    await new Promise<void>((resolve, reject) => {
      port.open((err) => {
        if (err) reject(err)
        else resolve()
      })
    })
    
    console.log(`[Scale ${config.id}] Connected to ${config.port} at ${config.baudRate} baud`)
    
    // Initialize weight buffer
    initWeightBuffer(config.id)
    
    // Set up data parser - using delimiter for Torres scale
    const parser = port.pipe(new DelimiterParser({ delimiter: [CR, LF] }))
    
    parser.on('data', (data: Buffer) => {
      handleScaleData(config.id, data)
    })
    
    // Handle port errors
    port.on('error', (err) => {
      console.error(`[Scale ${config.id}] Serial port error:`, err.message)
      broadcastError(config.id, `Serial port error: ${err.message}`)
      
      // Attempt reconnection
      scheduleReconnect(config)
    })
    
    port.on('close', () => {
      console.log(`[Scale ${config.id}] Serial port closed`)
      serialPorts.delete(config.id)
      
      // Attempt reconnection if scale is still enabled
      if (config.enabled) {
        scheduleReconnect(config)
      }
    })
    
    // Store the port
    serialPorts.set(config.id, port)
    
    return port
  } catch (error: any) {
    console.error(`[Scale ${config.id}] Failed to open serial port:`, error.message)
    broadcastError(config.id, `Failed to connect: ${error.message}`)
    
    // Schedule reconnection attempt
    scheduleReconnect(config)
    return null
  }
}

// Reconnection scheduling
const reconnectTimers: Map<string, NodeJS.Timeout> = new Map()

function scheduleReconnect(config: ScaleConfig): void {
  // Clear existing timer
  const existingTimer = reconnectTimers.get(config.id)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }
  
  // Schedule new reconnection
  const timer = setTimeout(() => {
    if (config.enabled && !serialPorts.has(config.id)) {
      console.log(`[Scale ${config.id}] Attempting reconnection...`)
      openSerialPort(config)
    }
    reconnectTimers.delete(config.id)
  }, 5000) // Reconnect after 5 seconds
  
  reconnectTimers.set(config.id, timer)
}

function closeSerialPort(scaleId: string): void {
  const port = serialPorts.get(scaleId)
  if (port && port.isOpen) {
    port.close()
  }
  serialPorts.delete(scaleId)
  
  // Clear reconnection timer
  const timer = reconnectTimers.get(scaleId)
  if (timer) {
    clearTimeout(timer)
    reconnectTimers.delete(scaleId)
  }
}

// ============================================================================
// Scale Data Handling
// ============================================================================

function handleScaleData(scaleId: string, data: Buffer): void {
  const parsed = parseTorresWeight(data)
  
  if (!parsed) {
    console.log(`[Scale ${scaleId}] Unparsed data:`, data.toString('ascii').trim())
    return
  }
  
  const { weight, unit, raw } = parsed
  const stable = checkStability(scaleId, weight)
  
  const reading: WeightReading = {
    scaleId,
    weight,
    unit,
    stable,
    raw,
    timestamp: new Date()
  }
  
  // Store latest reading
  latestReadings.set(scaleId, reading)
  
  // Broadcast to WebSocket clients
  broadcastWeight(reading)
  
  // Log stable weights
  if (stable) {
    console.log(`[Scale ${scaleId}] STABLE: ${weight.toFixed(3)} ${unit}`)
  }
}

// ============================================================================
// WebSocket Server
// ============================================================================

const httpServer = createServer(handleHTTPRequest)
const wss = new WebSocketServer({ server: httpServer })

wss.on('connection', (ws: WebSocket) => {
  const client: WSClient = {
    ws,
    subscriptions: new Set()
  }
  wsClients.add(client)
  
  console.log(`[WS] Client connected. Total clients: ${wsClients.size}`)
  
  // Send current state to new client
  sendInitialState(client)
  
  ws.on('message', (data: RawData) => {
    try {
      const message = JSON.parse(data.toString())
      handleWSMessage(client, message)
    } catch (error) {
      console.error('[WS] Failed to parse message:', error)
    }
  })
  
  ws.on('close', () => {
    wsClients.delete(client)
    console.log(`[WS] Client disconnected. Total clients: ${wsClients.size}`)
  })
  
  ws.on('error', (error) => {
    console.error('[WS] Client error:', error)
    wsClients.delete(client)
  })
})

function handleWSMessage(client: WSClient, message: any): void {
  const { type, payload } = message
  
  switch (type) {
    case 'subscribe':
      // Subscribe to specific scale updates
      if (Array.isArray(payload)) {
        payload.forEach(scaleId => client.subscriptions.add(scaleId))
      } else if (typeof payload === 'string') {
        client.subscriptions.add(payload)
      }
      console.log(`[WS] Client subscribed to:`, Array.from(client.subscriptions))
      break
      
    case 'unsubscribe':
      if (Array.isArray(payload)) {
        payload.forEach(scaleId => client.subscriptions.delete(scaleId))
      } else if (typeof payload === 'string') {
        client.subscriptions.delete(payload)
      }
      break
      
    case 'get-scales':
      // Send list of available scales
      sendToClient(client, {
        type: 'scales-list',
        payload: Array.from(scaleConfigs.values())
      })
      break
      
    case 'get-readings':
      // Send all current readings
      sendToClient(client, {
        type: 'current-readings',
        payload: Object.fromEntries(latestReadings)
      })
      break
      
    case 'ping':
      sendToClient(client, { type: 'pong', payload: Date.now() })
      break
      
    default:
      console.log('[WS] Unknown message type:', type)
  }
}

function sendToClient(client: WSClient, message: any): void {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message))
  }
}

function sendInitialState(client: WSClient): void {
  // Send available scales
  sendToClient(client, {
    type: 'scales-list',
    payload: Array.from(scaleConfigs.values())
  })
  
  // Send current readings
  sendToClient(client, {
    type: 'current-readings',
    payload: Object.fromEntries(latestReadings)
  })
  
  // Send connection status
  const status: Record<string, boolean> = {}
  scaleConfigs.forEach((config, id) => {
    status[id] = serialPorts.has(id) && (serialPorts.get(id)?.isOpen ?? false)
  })
  sendToClient(client, {
    type: 'connection-status',
    payload: status
  })
}

function broadcastWeight(reading: WeightReading): void {
  const message = {
    type: 'weight-update',
    payload: reading
  }
  
  wsClients.forEach(client => {
    // Send to all clients or only subscribed ones
    if (client.subscriptions.size === 0 || client.subscriptions.has(reading.scaleId)) {
      sendToClient(client, message)
    }
  })
}

function broadcastError(scaleId: string, error: string): void {
  const message = {
    type: 'scale-error',
    payload: { scaleId, error, timestamp: new Date() }
  }
  
  wsClients.forEach(client => {
    if (client.subscriptions.size === 0 || client.subscriptions.has(scaleId)) {
      sendToClient(client, message)
    }
  })
}

function broadcastStatus(): void {
  const status: Record<string, boolean> = {}
  scaleConfigs.forEach((config, id) => {
    status[id] = serialPorts.has(id) && (serialPorts.get(id)?.isOpen ?? false)
  })
  
  const message = {
    type: 'connection-status',
    payload: status
  }
  
  wsClients.forEach(client => {
    sendToClient(client, message)
  })
}

// ============================================================================
// HTTP API Endpoints
// ============================================================================

async function handleHTTPRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = req.url || '/'
  const method = req.method || 'GET'
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }
  
  try {
    // GET /scales - List all scales
    if (url === '/scales' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(Array.from(scaleConfigs.values())))
      return
    }
    
    // GET /scales/:id - Get specific scale
    const scaleMatch = url.match(/^\/scales\/([^\/]+)$/)
    if (scaleMatch && method === 'GET') {
      const scaleId = scaleMatch[1]
      const config = scaleConfigs.get(scaleId)
      if (config) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(config))
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Scale not found' }))
      }
      return
    }
    
    // POST /scales - Add new scale
    if (url === '/scales' && method === 'POST') {
      const body = await readBody(req)
      const config: ScaleConfig = JSON.parse(body)
      
      if (!config.id || !config.port) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Missing required fields: id, port' }))
        return
      }
      
      // Set defaults
      config.baudRate = config.baudRate || 9600
      config.dataBits = config.dataBits || 8
      config.stopBits = config.stopBits || 1
      config.parity = config.parity || 'none'
      config.enabled = config.enabled ?? true
      
      scaleConfigs.set(config.id, config)
      
      // Connect to the scale
      if (config.enabled) {
        openSerialPort(config)
      }
      
      res.writeHead(201, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(config))
      return
    }
    
    // PUT /scales/:id - Update scale config
    if (scaleMatch && method === 'PUT') {
      const scaleId = scaleMatch[1]
      const existing = scaleConfigs.get(scaleId)
      
      if (!existing) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Scale not found' }))
        return
      }
      
      const body = await readBody(req)
      const updates: Partial<ScaleConfig> = JSON.parse(body)
      
      // Close existing connection if port settings changed
      if (updates.port || updates.baudRate || updates.dataBits || updates.stopBits || updates.parity) {
        closeSerialPort(scaleId)
      }
      
      // Merge updates
      const updated: ScaleConfig = { ...existing, ...updates }
      scaleConfigs.set(scaleId, updated)
      
      // Reconnect if needed
      if (updated.enabled && !serialPorts.has(scaleId)) {
        openSerialPort(updated)
      } else if (!updated.enabled) {
        closeSerialPort(scaleId)
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(updated))
      return
    }
    
    // DELETE /scales/:id - Remove scale
    if (scaleMatch && method === 'DELETE') {
      const scaleId = scaleMatch[1]
      
      if (!scaleConfigs.has(scaleId)) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Scale not found' }))
        return
      }
      
      closeSerialPort(scaleId)
      scaleConfigs.delete(scaleId)
      latestReadings.delete(scaleId)
      weightBuffers.delete(scaleId)
      
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ message: 'Scale removed' }))
      return
    }
    
    // GET /readings - Get all current readings
    if (url === '/readings' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(Object.fromEntries(latestReadings)))
      return
    }
    
    // GET /readings/:id - Get specific scale reading
    const readingMatch = url.match(/^\/readings\/([^\/]+)$/)
    if (readingMatch && method === 'GET') {
      const scaleId = readingMatch[1]
      const reading = latestReadings.get(scaleId)
      
      if (reading) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(reading))
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'No reading available' }))
      }
      return
    }
    
    // GET /ports - List available serial ports
    if (url === '/ports' && method === 'GET') {
      try {
        const ports = await SerialPort.list()
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(ports))
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: error.message }))
      }
      return
    }
    
    // POST /scales/:id/connect - Force connection
    const connectMatch = url.match(/^\/scales\/([^\/]+)\/connect$/)
    if (connectMatch && method === 'POST') {
      const scaleId = connectMatch[1]
      const config = scaleConfigs.get(scaleId)
      
      if (!config) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Scale not found' }))
        return
      }
      
      closeSerialPort(scaleId)
      const port = await openSerialPort(config)
      
      if (port) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ message: 'Connected', scaleId }))
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Failed to connect' }))
      }
      return
    }
    
    // POST /scales/:id/disconnect - Disconnect scale
    const disconnectMatch = url.match(/^\/scales\/([^\/]+)\/disconnect$/)
    if (disconnectMatch && method === 'POST') {
      const scaleId = disconnectMatch[1]
      
      if (!scaleConfigs.has(scaleId)) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Scale not found' }))
        return
      }
      
      closeSerialPort(scaleId)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ message: 'Disconnected', scaleId }))
      return
    }
    
    // GET /status - Get connection status
    if (url === '/status' && method === 'GET') {
      const status: Record<string, any> = {}
      scaleConfigs.forEach((config, id) => {
        const port = serialPorts.get(id)
        status[id] = {
          name: config.name,
          port: config.port,
          connected: port?.isOpen ?? false,
          enabled: config.enabled,
          lastReading: latestReadings.get(id) || null
        }
      })
      
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        scales: status,
        wsClients: wsClients.size,
        uptime: process.uptime()
      }))
      return
    }
    
    // GET /health - Health check
    if (url === '/health' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date() }))
      return
    }
    
    // 404 for unknown routes
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
    
  } catch (error: any) {
    console.error('[HTTP] Error:', error)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: error.message }))
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

// ============================================================================
// Initialization
// ============================================================================

async function initialize(): Promise<void> {
  console.log('========================================')
  console.log('  Balanza Service - Torres Scale RS232')
  console.log('========================================')
  console.log('')
  
  // Load default scale configurations
  DEFAULT_SCALES.forEach(config => {
    scaleConfigs.set(config.id, config)
  })
  
  console.log(`[Config] Loaded ${scaleConfigs.size} scale configurations`)
  
  // List available serial ports
  try {
    const ports = await SerialPort.list()
    console.log('[Serial] Available ports:', ports.map(p => p.path).join(', ') || 'None found')
  } catch (error) {
    console.log('[Serial] Could not list ports (may not have permissions)')
  }
  
  // Start HTTP + WebSocket server
  httpServer.listen(HTTP_PORT, () => {
    console.log(`[HTTP] API server listening on port ${HTTP_PORT}`)
    console.log(`[WS] WebSocket server ready on port ${HTTP_PORT}`)
    console.log('')
    console.log('Available endpoints:')
    console.log('  GET  /scales          - List all scales')
    console.log('  POST /scales          - Add new scale')
    console.log('  GET  /scales/:id      - Get scale config')
    console.log('  PUT  /scales/:id      - Update scale config')
    console.log('  DELETE /scales/:id    - Remove scale')
    console.log('  POST /scales/:id/connect    - Connect to scale')
    console.log('  POST /scales/:id/disconnect - Disconnect scale')
    console.log('  GET  /readings        - Get all readings')
    console.log('  GET  /readings/:id    - Get scale reading')
    console.log('  GET  /ports           - List serial ports')
    console.log('  GET  /status          - Get system status')
    console.log('  GET  /health          - Health check')
    console.log('')
    
    // Attempt to connect to enabled scales
    scaleConfigs.forEach(config => {
      if (config.enabled) {
        console.log(`[Scale ${config.id}] Attempting connection to ${config.port}...`)
        openSerialPort(config).catch(err => {
          console.log(`[Scale ${config.id}] Connection deferred: ${err.message}`)
        })
      }
    })
  })
  
  // Periodic status broadcast
  setInterval(broadcastStatus, 30000)
}

// Graceful shutdown
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

function shutdown(): void {
  console.log('\n[Shutdown] Closing all connections...')
  
  // Close all serial ports
  serialPorts.forEach((port, id) => {
    if (port.isOpen) {
      port.close()
    }
  })
  
  // Clear all timers
  reconnectTimers.forEach(timer => clearTimeout(timer))
  
  // Close WebSocket server
  wss.clients.forEach(client => {
    client.close()
  })
  
  // Close HTTP server
  httpServer.close(() => {
    console.log('[Shutdown] Server closed')
    process.exit(0)
  })
}

// Start the service
initialize().catch(console.error)
