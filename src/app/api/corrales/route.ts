import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar corrales con stock basado en animales individuales
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeMovimientoHacienda')
  if (authError) return authError

  try {
    // Obtener todos los corrales
    const corrales = await db.corral.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    })

    // Obtener animales con su ubicación real (animal.corralId)
    const animales = await db.animal.findMany({
      where: {
        estado: { in: ['RECIBIDO', 'PESADO'] }
      },
      include: {
        tropa: {
          include: {
            usuarioFaena: { select: { nombre: true } }
          }
        }
      }
    })

    // Agrupar animales por corral
    const stockPorCorral: Record<string, {
      bovinos: number
      equinos: number
      tropas: Map<string, {
        tropaId: string
        tropaCodigo: string
        cantidad: number
        especie: string
        usuarioFaena: string
      }>
    }> = {}

    for (const animal of animales) {
      const corralId = animal.corralId || 'sin-corral'
      
      if (!stockPorCorral[corralId]) {
        stockPorCorral[corralId] = { 
          bovinos: 0, 
          equinos: 0, 
          tropas: new Map() 
        }
      }

      // Contar por especie
      if (animal.tropa.especie === 'BOVINO') {
        stockPorCorral[corralId].bovinos++
      } else if (animal.tropa.especie === 'EQUINO') {
        stockPorCorral[corralId].equinos++
      }

      // Agrupar por tropa
      const tropaId = animal.tropaId
      if (!stockPorCorral[corralId].tropas.has(tropaId)) {
        stockPorCorral[corralId].tropas.set(tropaId, {
          tropaId: animal.tropa.id,
          tropaCodigo: animal.tropa.codigo,
          cantidad: 1,
          especie: animal.tropa.especie,
          usuarioFaena: animal.tropa.usuarioFaena?.nombre || 'Sin usuario'
        })
      } else {
        const tropaData = stockPorCorral[corralId].tropas.get(tropaId)!
        tropaData.cantidad++
      }
    }

    // Construir respuesta
    const corralesConStock = corrales.map(corral => {
      const stock = stockPorCorral[corral.id] || { bovinos: 0, equinos: 0, tropas: new Map() }
      const stockTotal = stock.bovinos + stock.equinos
      
      return {
        id: corral.id,
        nombre: corral.nombre,
        capacidad: corral.capacidad,
        observaciones: corral.observaciones,
        activo: corral.activo,
        stockBovinos: stock.bovinos,
        stockEquinos: stock.equinos,
        stockTotal,
        disponible: corral.capacidad - stockTotal,
        tropasActivas: stock.tropas.size,
        tropas: Array.from(stock.tropas.values())
      }
    })

    // Agregar animales sin corral asignado
    if (stockPorCorral['sin-corral']) {
      const sinCorral = stockPorCorral['sin-corral']
      const stockTotal = sinCorral.bovinos + sinCorral.equinos
      
      corralesConStock.push({
        id: 'sin-corral',
        nombre: 'Sin Asignar',
        capacidad: 0,
        observaciones: 'Animales sin corral asignado',
        activo: true,
        stockBovinos: sinCorral.bovinos,
        stockEquinos: sinCorral.equinos,
        stockTotal,
        disponible: 0,
        tropasActivas: sinCorral.tropas.size,
        tropas: Array.from(sinCorral.tropas.values())
      })
    }
    
    return NextResponse.json({
      success: true,
      data: corralesConStock
    })
  } catch (error) {
    console.error('Error fetching corrales:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener corrales' },
      { status: 500 }
    )
  }
}

// POST - Crear corral
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeMovimientoHacienda')
  if (authError) return authError

  try {
    const body = await request.json()
    const { nombre, capacidad, observaciones } = body
    
    if (!nombre) {
      return NextResponse.json(
        { success: false, error: 'Nombre es requerido' },
        { status: 400 }
      )
    }
    
    // Verificar si ya existe un corral con el mismo nombre
    const existing = await db.corral.findFirst({
      where: { nombre }
    })
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un corral con ese nombre' },
        { status: 400 }
      )
    }
    
    const corral = await db.corral.create({
      data: {
        nombre,
        capacidad: parseInt(capacidad) || 0,
        observaciones: observaciones || null
      }
    })
    
    return NextResponse.json({
      success: true,
      data: corral
    })
  } catch (error) {
    console.error('Error creating corral:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear corral' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar corral
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeMovimientoHacienda')
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, nombre, capacidad, observaciones, activo } = body
    
    const updateData: Record<string, unknown> = {}
    
    if (nombre !== undefined) updateData.nombre = nombre
    if (capacidad !== undefined) updateData.capacidad = parseInt(capacidad) || 0
    if (observaciones !== undefined) updateData.observaciones = observaciones || null
    if (activo !== undefined) updateData.activo = activo
    
    const corral = await db.corral.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json({
      success: true,
      data: corral
    })
  } catch (error) {
    console.error('Error updating corral:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar corral' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar corral
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeMovimientoHacienda')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }
    
    // Verificar que no tenga tropas activas
    const tropasActivas = await db.tropa.count({
      where: {
        corralId: id,
        estado: { in: ['RECIBIDO', 'EN_CORRAL', 'EN_PESAJE', 'PESADO', 'LISTO_FAENA'] }
      }
    })
    
    if (tropasActivas > 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar un corral con tropas activas' },
        { status: 400 }
      )
    }
    
    await db.corral.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting corral:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar corral' },
      { status: 500 }
    )
  }
}
