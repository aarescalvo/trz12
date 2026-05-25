import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { cacheOrFetch, cacheInvalidate, CACHE_KEYS, CACHE_TTL } from '@/lib/cache'
import { createLogger } from '@/lib/logger'
import { checkPermission } from '@/lib/auth-helpers'

const logger = createLogger('API:Dashboard')

// GET - Fetch dashboard stats completo con cache
export async function GET(request: NextRequest) {
  try {
    const authError = await checkPermission(request, 'puedeReportes')
    if (authError) return authError
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || 'semana'
    
    const endTimer = logger.time('Dashboard stats')
    
    // Usar cache para estadísticas (30 segundos TTL)
    const stats = await cacheOrFetch(
      `${CACHE_KEYS.DASHBOARD_STATS}:${periodo}`,
      async () => {
        logger.debug('Cache miss - obteniendo stats de BD')
        
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)
        
        const hace7Dias = new Date(hoy)
        hace7Dias.setDate(hace7Dias.getDate() - 7)
        
        const hace30Dias = new Date(hoy)
        hace30Dias.setDate(hace30Dias.getDate() - 30)
        
        // Consultas en paralelo para mejor rendimiento
        const [
          // Totales
          totalTropas,
          tropasActivas,
          totalAnimales,
          
          // Faena
          pesajesHoy,
          romaneosHoy,
          animalesFaenadosHoy,
          
          // Stock
          stockCamaras,
          stockCorrales,
          
          // Última semana
          faenaSemana,
          
          // Por especie
          tropasBovinos,
          tropasEquinos
        ] = await Promise.all([
          // Totales
          db.tropa.count(),
          db.tropa.count({ where: { estado: 'RECIBIDO' } }),
          db.animal.count({ where: { estado: 'RECIBIDO' } }),
          
          // Faena hoy
          db.pesajeCamion.count({
            where: { createdAt: { gte: hoy } }
          }),
          db.romaneo.count({
            where: { createdAt: { gte: hoy } }
          }),
          db.animal.count({
            where: { 
              estado: 'FAENADO',
              updatedAt: { gte: hoy }
            }
          }),
          
          // Stock
          db.stockMediaRes.findMany({
            select: { cantidad: true, pesoTotal: true }
          }),
          db.corral.findMany({
            select: { 
              nombre: true, 
              stockBovinos: true, 
              stockEquinos: true,
              capacidad: true 
            }
          }),
          
          // Faena última semana
          db.romaneo.groupBy({
            by: ['createdAt'],
            where: {
              createdAt: { gte: hace7Dias }
            },
            _count: true,
            _sum: { pesoTotal: true }
          }),
          
          // Por especie
          db.tropa.count({ where: { especie: 'BOVINO' } }),
          db.tropa.count({ where: { especie: 'EQUINO' } })
        ])
        
        // Calcular totales
        const totalStockCamaras = stockCamaras.reduce((acc, s) => acc + (s.cantidad || 0), 0)
        const totalPesoCamaras = stockCamaras.reduce((acc, s) => acc + (s.pesoTotal || 0), 0)
        const totalStockCorrales = stockCorrales.reduce((acc, c) => acc + c.stockBovinos + c.stockEquinos, 0)
        const capacidadTotal = stockCorrales.reduce((acc, c) => acc + c.capacidad, 0)
        
        // Procesar datos de faena semanal
        const faenaPorDia: Record<string, { cabezas: number; peso: number }> = {}
        for (let i = 6; i >= 0; i--) {
          const fecha = new Date(hoy)
          fecha.setDate(fecha.getDate() - i)
          const key = fecha.toISOString().split('T')[0]
          faenaPorDia[key] = { cabezas: 0, peso: 0 }
        }
        
        // Rinde promedio (simulado si no hay datos reales)
        const rindePromedio = totalPesoCamaras > 0 && totalAnimales > 0 
          ? Math.round((totalPesoCamaras / (totalAnimales * 450)) * 100) // Aproximación
          : 52
        
        return {
          // KPIs principales
          animalesFaenados: animalesFaenadosHoy,
          pesoTotalProcesado: totalPesoCamaras,
          rindePromedio,
          tropasActivas,
          stockCamaras: totalStockCamaras,
          
          // Detalles
          totalTropas,
          totalAnimales,
          pesajesHoy,
          romaneosHoy,
          
          // Stock
          stockCorrales: totalStockCorrales,
          ocupacionCorrales: capacidadTotal > 0 
            ? Math.round((totalStockCorrales / capacidadTotal) * 100) 
            : 0,
          
          // Por especie
          distribucionEspecie: {
            bovinos: tropasBovinos,
            equinos: tropasEquinos
          },
          
          // Faena por día (últimos 7 días)
          faenaSemanal: Object.entries(faenaPorDia).map(([fecha, datos]) => ({
            fecha,
            dia: new Date(fecha).toLocaleDateString('es-AR', { weekday: 'short' }),
            ...datos
          })),
          
          // Stock por cámara
          stockPorCamara: stockCorrales.slice(0, 6).map(c => ({
            nombre: c.nombre,
            stock: c.stockBovinos + c.stockEquinos,
            capacidad: c.capacidad,
            ocupacion: c.capacidad > 0 
              ? Math.round(((c.stockBovinos + c.stockEquinos) / c.capacidad) * 100)
              : 0
          })),
          
          // Metas
          metas: {
            faenaDiaria: { actual: animalesFaenadosHoy, meta: 200 },
            rinde: { actual: rindePromedio, meta: 52 },
            ocupacion: { actual: capacidadTotal > 0 ? Math.round((totalStockCorrales / capacidadTotal) * 100) : 0, meta: 80 }
          }
        }
      },
      CACHE_TTL.SHORT // 30 segundos
    )
    
    endTimer()
    logger.debug('Stats obtenidas', stats)
    
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    logger.error('Error al obtener estadísticas', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}

// Invalidar cache cuando hay cambios (usado internamente)
function invalidateDashboardCache() {
  cacheInvalidate('dashboard:')
}
