import { describe, it, expect, beforeAll } from 'bun:test'

const API_BASE = process.env.TEST_API_URL || 'http://localhost:3000'

interface ApiResponse {
  success: boolean
  data?: any
  error?: string
}

async function fetchApi(url: string): Promise<ApiResponse> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    return await res.json()
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Timeout - servidor no responde' }
    }
    return { success: false, error: 'Servidor no disponible. Ejecuta: bun run dev' }
  }
}

// Verificar que el servidor esté disponible antes de ejecutar tests
let serverAvailable = false

beforeAll(async () => {
  const res = await fetchApi(API_BASE)
  serverAvailable = res.success || res.error?.includes('Timeout') === false
  if (!serverAvailable) {
    console.log('\n⚠️  ADVERTENCIA: Servidor no detectado en ' + API_BASE)
    console.log('   Ejecuta "bun run dev" en otra terminal para activar los tests\n')
  }
})

describe('API Reportes - Filtros Avanzados', () => {
  
  it('GET /api/reportes debe retornar datos con filtros básicos', async () => {
    const res = await fetchApi(`${API_BASE}/api/reportes?tipo=bovino`)
    expect(res.success).toBe(true)
    expect(res.data?.faenaDiaria).toBeDefined()
    expect(res.data?.rendimientos).toBeDefined()
    expect(res.data?.stockCamaras).toBeDefined()
  })

  it('GET /api/reportes debe soportar filtro por tropaCodigo', async () => {
    const res = await fetchApi(`${API_BASE}/api/reportes?tropaCodigo=B2026`)
    expect(res.success).toBe(true)
    expect(res.data?.filtrosAplicados?.tropaCodigo).toBe('B2026')
  })

  it('GET /api/reportes debe soportar filtro por fechaFaena', async () => {
    const fecha = new Date().toISOString().split('T')[0]
    const res = await fetchApi(`${API_BASE}/api/reportes?fechaFaena=${fecha}`)
    expect(res.success).toBe(true)
  })

  it('GET /api/reportes debe devolver resumen con KPIs', async () => {
    const res = await fetchApi(`${API_BASE}/api/reportes`)
    expect(res.success).toBe(true)
    expect(res.data?.resumen).toBeDefined()
    expect(res.data?.resumen?.totalAnimalesFaenados).toBeDefined()
    expect(res.data?.resumen?.totalPesoVivo).toBeDefined()
    expect(res.data?.resumen?.rindePromedio).toBeDefined()
  })

  it('GET /api/reportes debe devolver rendimientoPorTropa', async () => {
    const res = await fetchApi(`${API_BASE}/api/reportes`)
    expect(res.success).toBe(true)
    expect(Array.isArray(res.data?.rendimientoPorTropa)).toBe(true)
  })

  it('GET /api/reportes debe devolver detalleFaena', async () => {
    const res = await fetchApi(`${API_BASE}/api/reportes`)
    expect(res.success).toBe(true)
    expect(Array.isArray(res.data?.detalleFaena)).toBe(true)
  })

  it('GET /api/reportes debe devolver stockCamaras con ocupación', async () => {
    const res = await fetchApi(`${API_BASE}/api/reportes`)
    expect(res.success).toBe(true)
    expect(Array.isArray(res.data?.stockCamaras)).toBe(true)
    if (res.data?.stockCamaras?.length > 0) {
      expect(res.data.stockCamaras[0]?.ocupacionPorc).toBeDefined()
    }
  })

  it('GET /api/reportes debe soportar rango de fechas', async () => {
    const res = await fetchApi(`${API_BASE}/api/reportes?fechaDesde=2024-01-01&fechaHasta=2024-12-31`)
    expect(res.success).toBe(true)
    expect(res.data?.filtrosAplicados?.fechaDesde).toBe('2024-01-01')
    expect(res.data?.filtrosAplicados?.fechaHasta).toBe('2024-12-31')
  })

})

describe('API Romaneos', () => {
  
  it('GET /api/romaneos debe funcionar', async () => {
    const res = await fetchApi(`${API_BASE}/api/romaneos`)
    expect(res.success).toBe(true)
    expect(Array.isArray(res.data)).toBe(true)
  })

  it('GET /api/romaneos debe soportar filtro por tropaCodigo', async () => {
    const res = await fetchApi(`${API_BASE}/api/romaneos?tropaCodigo=B2026`)
    expect(res.success).toBe(true)
  })

})

describe('API Tropas', () => {
  
  it('GET /api/tropas debe funcionar', async () => {
    const res = await fetchApi(`${API_BASE}/api/tropas`)
    expect(res.success).toBe(true)
    expect(Array.isArray(res.data)).toBe(true)
  })

})

describe('API Clientes', () => {
  
  it('GET /api/clientes debe funcionar', async () => {
    const res = await fetchApi(`${API_BASE}/api/clientes`)
    expect(res.success).toBe(true)
    expect(Array.isArray(res.data)).toBe(true)
  })

})

describe('API Tipificadores', () => {
  
  it('GET /api/tipificadores debe funcionar', async () => {
    const res = await fetchApi(`${API_BASE}/api/tipificadores`)
    expect(res.success).toBe(true)
    expect(Array.isArray(res.data)).toBe(true)
  })

})

describe('API Corrales', () => {
  
  it('GET /api/corrales debe funcionar', async () => {
    const res = await fetchApi(`${API_BASE}/api/corrales`)
    expect(res.success).toBe(true)
    expect(Array.isArray(res.data)).toBe(true)
  })

})

describe('Scripts BAT', () => {
  
  it('Los scripts batt deben existir', async () => {
    const fs = require('fs')
    const path = require('path')
    
    const battDir = path.join(process.cwd(), 'batt')
    const expectedScripts = [
      'iniciar-servidor.bat',
      'detener-servidor.bat', 
      'backup-todo.bat',
      'restaurar-backup.bat',
      'menu.bat'
    ]
    
    for (const script of expectedScripts) {
      const exists = fs.existsSync(path.join(battDir, script))
      expect(existing).toBe(true, `Script ${script} debe existir en batt/`)
    }
  })

})