import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'
import { createLogger } from '@/lib/logger'

const logger = createLogger('API:ReportesSIGICA')

// GET - Generar reportes de datos SIGICA (solo reportes, no integración real)
export async function GET(request: NextRequest) {
  try {
    // Verificar permisos
    const authError = await checkPermission(request, 'puedeReportes')
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'romaneos' // romaneos | stock | historial
    const formato = searchParams.get('formato') || 'json' // json | pdf | excel
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    const operadorId = request.headers.get('x-operador-id')

    // Obtener configuración del frigorífico
    const config = await db.configuracionFrigorifico.findFirst()
    const establecimiento = config?.nombre || 'Solemar Alimentaria'
    const cuit = config?.cuit || ''

    let data: any = {}

    switch (tipo) {
      case 'romaneos': {
        // Reporte de romaneos para SIGICA
        const where: any = {}
        if (fechaDesde || fechaHasta) {
          where.fecha = {}
          if (fechaDesde) where.fecha.gte = new Date(fechaDesde)
          if (fechaHasta) where.fecha.lte = new Date(fechaHasta)
        }

        const romaneos = await db.romaneo.findMany({
          where,
          include: {
            tipificador: { select: { matricula: true, nombre: true } }
          },
          orderBy: { fecha: 'desc' },
          take: 500
        })

        data = {
          titulo: 'Reporte de Romaneos SIGICA',
          establecimiento,
          cuit,
          fechaGeneracion: new Date().toISOString(),
          totalRegistros: romaneos.length,
          registros: romaneos.map(r => ({
            garron: r.garron,
            tropa: r.tropaCodigo || '-',
            especie: 'BOVINO',
            fecha: r.fecha,
            pesoVivo: r.pesoVivo,
            pesoTotal: r.pesoTotal,
            pesoMediaIzq: r.pesoMediaIzq,
            pesoMediaDer: r.pesoMediaDer,
            denticion: r.denticion,
            tipoAnimal: r.tipoAnimal,
            raza: r.raza,
            tipificador: r.tipificador?.matricula || '',
            tipificadorNombre: r.tipificador?.nombre || ''
          }))
        }
        break
      }

      case 'stock': {
        // Reporte de stock de cámaras para SIGICA
        const camaras = await db.camara.findMany({
          where: { activo: true },
          include: {
            _count: { select: { mediasRes: true } }
          },
          orderBy: { nombre: 'asc' }
        })

        // Calcular stock por cámara
        const stockData: any[] = []
        for (const camara of camaras) {
          const medias = await db.mediaRes.findMany({
            where: { camaraId: camara.id, estado: 'EN_CAMARA' },
            include: { romaneo: true }
          })

          // Get especie from romaneo's tropa
          const bovinos = medias.filter(m => !m.romaneo?.tropaCodigo || !m.romaneo?.tropaCodigo.startsWith('E'))
          const equinos = medias.filter(m => m.romaneo?.tropaCodigo?.startsWith('E'))

          const stockItem = {
            camaraId: camara.id,
            camaraNombre: camara.nombre,
            tipo: camara.tipo,
            totalMedias: medias.length,
            totalKg: medias.reduce((sum, m) => sum + (m.peso || 0), 0),
            bovinosMedias: bovinos.length,
            bovinosKg: bovinos.reduce((sum, m) => sum + (m.peso || 0), 0),
            equinosMedias: equinos.length,
            equinosKg: equinos.reduce((sum, m) => sum + (m.peso || 0), 0)
          }
          stockData.push(stockItem)
        }

        data = {
          titulo: 'Reporte de Stock de Cámaras SIGICA',
          establecimiento,
          cuit,
          fechaGeneracion: new Date().toISOString(),
          totalCamaras: stockData.length,
          camaras: stockData
        }
        break
      }

      case 'historial': {
        // Historial de envíos SIGICA
        const envios = await db.envioSIGICA.findMany({
          include: {
            operador: { select: { nombre: true, usuario: true } }
          },
          orderBy: { fechaEnvio: 'desc' },
          take: 100
        })

        data = {
          titulo: 'Historial de Envíos SIGICA',
          establecimiento,
          cuit,
          fechaGeneracion: new Date().toISOString(),
          totalEnvios: envios.length,
          envios: envios.map(e => ({
            id: e.id,
            tipo: e.tipo,
            estado: e.estado,
            cantidadRegistros: e.cantidadRegistros,
            codigoTransaccion: e.codigoTransaccion,
            mensajeError: e.mensajeError,
            intentos: e.intentos,
            fechaEnvio: e.fechaEnvio,
            ultimoIntento: e.ultimoIntento,
            operador: e.operador?.nombre || 'Sistema'
          }))
        }
        break
      }

      case 'configuracion': {
        // Reporte de configuración SIGICA
        const configSIGICA = await db.configuracionSIGICA.findFirst()

        data = {
          titulo: 'Configuración SIGICA',
          establecimiento,
          cuit,
          fechaGeneracion: new Date().toISOString(),
          configuracion: configSIGICA ? {
            habilitado: configSIGICA.habilitado,
            establecimiento: configSIGICA.establecimiento,
            urlServicio: configSIGICA.urlServicio ? '***configurada***' : 'No configurada',
            ultimaSincronizacion: configSIGICA.ultimaSincronizacion,
            updatedAt: configSIGICA.updatedAt
          } : null
        }
        break
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Tipo de reporte no válido. Usar: romaneos, stock, historial, configuracion' },
          { status: 400 }
        )
    }

    // Registrar en auditoría
    if (operadorId) {
      await db.auditoria.create({
        data: {
          operadorId,
          modulo: 'REPORTES_SIGICA',
          accion: 'VIEW',
          entidad: 'Reporte',
          descripcion: `Reporte SIGICA tipo: ${tipo}`,
        }
      })
    }

    // Si formato es excel o pdf, marcar que se debe usar el endpoint de exportación
    if (formato === 'pdf' || formato === 'excel') {
      data._meta = {
        formato,
        disponibleExportacion: true,
        endpointExportacion: '/api/reportes/exportar'
      }
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    logger.error('Error generando reporte SIGICA', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar reporte' },
      { status: 500 }
    )
  }
}
