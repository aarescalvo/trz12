import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TipoReporteEmail, FrecuenciaEmail, FormatoReporte } from '@prisma/client'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Listar todas las programaciones
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (id) {
      // Obtener una programación específica
      const programacion = await db.programacionReporte.findUnique({
        where: { id },
        include: {
          historialesEnvio: {
            take: 10,
            orderBy: { fechaEnvio: 'desc' }
          }
        }
      })
      
      if (!programacion) {
        return NextResponse.json(
          { error: 'Programación no encontrada' },
          { status: 404 }
        )
      }
      
      // Obtener datos de destinatarios
      const destinatarioIds = programacion.destinatarios.split(',').filter(Boolean)
      const destinatarios = await db.destinatarioReporte.findMany({
        where: { id: { in: destinatarioIds } }
      })
      
      return NextResponse.json({
        ...programacion,
        destinatariosData: destinatarios
      })
    }
    
    // Listar todas las programaciones
    const programaciones = await db.programacionReporte.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    // Obtener datos de destinatarios para cada programación
    const programacionesConDestinatarios = await Promise.all(
      programaciones.map(async (prog) => {
        const destinatarioIds = prog.destinatarios.split(',').filter(Boolean)
        const destinatarios = await db.destinatarioReporte.findMany({
          where: { id: { in: destinatarioIds } },
          select: { id: true, nombre: true, email: true }
        })
        return {
          ...prog,
          destinatariosData: destinatarios
        }
      })
    )
    
    return NextResponse.json(programacionesConDestinatarios)
  } catch (error) {
    console.error('Error al obtener programaciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener programaciones' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva programación
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const data = await request.json()
    
    // Validar datos requeridos
    if (!data.nombre || !data.tipoReporte || !data.frecuencia) {
      return NextResponse.json(
        { error: 'Nombre, tipo de reporte y frecuencia son requeridos' },
        { status: 400 }
      )
    }
    
    if (!data.destinatarios || data.destinatarios.length === 0) {
      return NextResponse.json(
        { error: 'Debe seleccionar al menos un destinatario' },
        { status: 400 }
      )
    }
    
    // Validar tipo de reporte
    if (!Object.values(TipoReporteEmail).includes(data.tipoReporte)) {
      return NextResponse.json(
        { error: 'Tipo de reporte inválido' },
        { status: 400 }
      )
    }
    
    // Validar frecuencia
    if (!Object.values(FrecuenciaEmail).includes(data.frecuencia)) {
      return NextResponse.json(
        { error: 'Frecuencia inválida' },
        { status: 400 }
      )
    }
    
    // Calcular próximo envío
    const proximoEnvio = calcularProximoEnvio(
      data.frecuencia,
      data.horaEnvio || 8,
      data.diaSemana,
      data.diaMes
    )
    
    const programacion = await db.programacionReporte.create({
      data: {
        nombre: data.nombre,
        tipoReporte: data.tipoReporte,
        frecuencia: data.frecuencia,
        horaEnvio: data.horaEnvio || 8,
        diaSemana: data.diaSemana,
        diaMes: data.diaMes,
        destinatarios: Array.isArray(data.destinatarios) 
          ? data.destinatarios.join(',') 
          : data.destinatarios,
        activo: data.activo ?? true,
        incluirGraficos: data.incluirGraficos ?? true,
        formato: data.formato || FormatoReporte.PDF,
        proximoEnvio,
        observaciones: data.observaciones
      }
    })
    
    return NextResponse.json(programacion, { status: 201 })
  } catch (error) {
    console.error('Error al crear programación:', error)
    return NextResponse.json(
      { error: 'Error al crear programación' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar programación
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const data = await request.json()
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'ID de programación requerido' },
        { status: 400 }
      )
    }
    
    // Verificar que existe
    const existente = await db.programacionReporte.findUnique({
      where: { id: data.id }
    })
    
    if (!existente) {
      return NextResponse.json(
        { error: 'Programación no encontrada' },
        { status: 404 }
      )
    }
    
    // Validar tipo de reporte si se proporciona
    if (data.tipoReporte && !Object.values(TipoReporteEmail).includes(data.tipoReporte)) {
      return NextResponse.json(
        { error: 'Tipo de reporte inválido' },
        { status: 400 }
      )
    }
    
    // Validar frecuencia si se proporciona
    if (data.frecuencia && !Object.values(FrecuenciaEmail).includes(data.frecuencia)) {
      return NextResponse.json(
        { error: 'Frecuencia inválida' },
        { status: 400 }
      )
    }
    
    // Recalcular próximo envío si cambió la configuración
    let proximoEnvio = existente.proximoEnvio
    if (data.frecuencia || data.horaEnvio || data.diaSemana !== undefined || data.diaMes !== undefined) {
      proximoEnvio = calcularProximoEnvio(
        data.frecuencia || existente.frecuencia,
        data.horaEnvio || existente.horaEnvio,
        data.diaSemana ?? existente.diaSemana,
        data.diaMes ?? existente.diaMes
      )
    }
    
    const programacion = await db.programacionReporte.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        tipoReporte: data.tipoReporte,
        frecuencia: data.frecuencia,
        horaEnvio: data.horaEnvio,
        diaSemana: data.diaSemana,
        diaMes: data.diaMes,
        destinatarios: Array.isArray(data.destinatarios) 
          ? data.destinatarios.join(',') 
          : data.destinatarios,
        activo: data.activo,
        incluirGraficos: data.incluirGraficos,
        formato: data.formato,
        proximoEnvio,
        observaciones: data.observaciones
      }
    })
    
    return NextResponse.json(programacion)
  } catch (error) {
    console.error('Error al actualizar programación:', error)
    return NextResponse.json(
      { error: 'Error al actualizar programación' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar programación
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de programación requerido' },
        { status: 400 }
      )
    }
    
    // Verificar que existe
    const existente = await db.programacionReporte.findUnique({
      where: { id }
    })
    
    if (!existente) {
      return NextResponse.json(
        { error: 'Programación no encontrada' },
        { status: 404 }
      )
    }
    
    // Eliminar historiales de envío asociados
    await db.historialEnvio.deleteMany({
      where: { programacionId: id }
    })
    
    // Eliminar programación
    await db.programacionReporte.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Programación eliminada correctamente' })
  } catch (error) {
    console.error('Error al eliminar programación:', error)
    return NextResponse.json(
      { error: 'Error al eliminar programación' },
      { status: 500 }
    )
  }
}

// Función auxiliar para calcular el próximo envío
function calcularProximoEnvio(
  frecuencia: FrecuenciaEmail,
  horaEnvio: number,
  diaSemana?: number | null,
  diaMes?: number | null
): Date {
  const ahora = new Date()
  const proximo = new Date()
  
  // Establecer la hora de envío
  proximo.setHours(horaEnvio, 0, 0, 0)
  
  switch (frecuencia) {
    case 'DIARIO':
      // Si ya pasó la hora hoy, programar para mañana
      if (proximo <= ahora) {
        proximo.setDate(proximo.getDate() + 1)
      }
      break
      
    case 'SEMANAL':
      // diaSemana: 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
      if (diaSemana !== null && diaSemana !== undefined) {
        const diaActual = proximo.getDay()
        const diferencia = (diaSemana - diaActual + 7) % 7
        proximo.setDate(proximo.getDate() + (diferencia === 0 && proximo <= ahora ? 7 : diferencia))
      }
      break
      
    case 'QUINCENAL':
      // Cada 15 días
      proximo.setDate(proximo.getDate() + 15)
      break
      
    case 'MENSUAL':
      // diaMes: 1-31
      if (diaMes !== null && diaMes !== undefined) {
        proximo.setDate(diaMes)
        if (proximo <= ahora) {
          proximo.setMonth(proximo.getMonth() + 1)
        }
      }
      break
      
    case 'MANUAL':
      // Para manual, no hay próximo envío automático
      return new Date('2099-12-31')
  }
  
  return proximo
}
