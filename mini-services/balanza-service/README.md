# Balanza Service - Torres Scale RS232 Communication

A standalone Bun service for real-time weight reading from Torres brand scales via RS232 serial port communication.

## Features

- **WebSocket Server** on port 3010 for real-time weight updates
- **RS232 Serial Port** communication using serialport library
- **Multi-scale support** - Configure multiple scales with different ports
- **Weight stability detection** - Identifies when weight readings are stable
- **Torres scale protocol parsing** - Parses STX + weight + ETX format
- **HTTP API endpoints** for configuration management
- **Auto-reconnection** on serial port errors
- **CORS support** for cross-origin requests

## Installation

```bash
bun install
```

## Running

```bash
# Production
bun run start

# Development (with auto-reload)
bun run dev
```

## Configuration

Default scales are configured in `index.ts`. You can also manage scales via HTTP API.

### Default Scales

| ID | Name | Port | Baud Rate |
|----|------|------|-----------|
| balanza-1 | Balanza Principal | COM1 | 9600 |
| balanza-2 | Balanza Camiones | /dev/ttyUSB0 | 9600 |

## HTTP API Endpoints

### Scales Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/scales` | List all configured scales |
| POST | `/scales` | Add a new scale |
| GET | `/scales/:id` | Get specific scale config |
| PUT | `/scales/:id` | Update scale configuration |
| DELETE | `/scales/:id` | Remove a scale |
| POST | `/scales/:id/connect` | Force reconnection |
| POST | `/scales/:id/disconnect` | Disconnect scale |

### Readings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/readings` | Get all current readings |
| GET | `/readings/:id` | Get reading for specific scale |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ports` | List available serial ports |
| GET | `/status` | Get system status |
| GET | `/health` | Health check |

## WebSocket Protocol

Connect to `ws://localhost:3010` for real-time updates.

### Client → Server Messages

```json
// Subscribe to specific scale updates
{ "type": "subscribe", "payload": "balanza-1" }
{ "type": "subscribe", "payload": ["balanza-1", "balanza-2"] }

// Unsubscribe
{ "type": "unsubscribe", "payload": "balanza-1" }

// Get list of scales
{ "type": "get-scales" }

// Get current readings
{ "type": "get-readings" }

// Ping
{ "type": "ping" }
```

### Server → Client Messages

```json
// Weight update
{
  "type": "weight-update",
  "payload": {
    "scaleId": "balanza-1",
    "weight": 125.456,
    "unit": "kg",
    "stable": true,
    "raw": "125.456 kg",
    "timestamp": "2026-03-15T10:30:00.000Z"
  }
}

// Connection status
{
  "type": "connection-status",
  "payload": {
    "balanza-1": true,
    "balanza-2": false
  }
}

// Scale error
{
  "type": "scale-error",
  "payload": {
    "scaleId": "balanza-1",
    "error": "Serial port error",
    "timestamp": "2026-03-15T10:30:00.000Z"
  }
}

// Initial state on connection
{
  "type": "scales-list",
  "payload": [...]
}
{
  "type": "current-readings",
  "payload": {...}
}
```

## Scale Configuration

```typescript
interface ScaleConfig {
  id: string           // Unique identifier
  name: string         // Display name
  port: string         // COM port (Windows) or /dev/ttyUSB* (Linux)
  baudRate: number     // Default: 9600
  dataBits: 5 | 6 | 7 | 8  // Default: 8
  stopBits: 1 | 2      // Default: 1
  parity: 'none' | 'even' | 'odd' | 'mark' | 'space'  // Default: 'none'
  enabled: boolean     // Enable/disable the scale
  description?: string // Optional description
  location?: string    // Physical location
}
```

## Torres Scale Protocol

The parser handles multiple formats:

1. **STX + weight + ETX** (standard format)
2. **Continuous streaming** with CR/LF delimiters
3. **Status format**: `ST,GS,+12.345,kg` (Stable, Gross, weight, unit)
4. **Simple numeric**: Just weight numbers

### Weight Stability Detection

- Readings are buffered (last 10 readings)
- Stability is detected when 5 consecutive readings are within 20g variation
- Stable readings are flagged in the `stable` property

## Integration with Main App

From your Next.js application:

```typescript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3010')

ws.onopen = () => {
  // Subscribe to all scales
  ws.send(JSON.stringify({ type: 'subscribe', payload: ['balanza-1', 'balanza-2'] }))
}

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  
  if (message.type === 'weight-update') {
    const { scaleId, weight, stable } = message.payload
    console.log(`Scale ${scaleId}: ${weight} kg (stable: ${stable})`)
  }
}
```

## Error Handling

- Auto-reconnection on serial port errors (5 second delay)
- Graceful shutdown on SIGTERM/SIGINT
- Error messages broadcast to WebSocket clients
- HTTP API returns appropriate error codes

## Platform Notes

### Windows
- Ports: `COM1`, `COM2`, `COM3`, etc.
- May need admin privileges for some COM ports

### Linux
- Ports: `/dev/ttyUSB0`, `/dev/ttyUSB1`, `/dev/ttyS0`, etc.
- User must be in `dialout` group: `sudo usermod -a -G dialout $USER`

## License

MIT
