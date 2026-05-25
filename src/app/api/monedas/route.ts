import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { seedMonedasDefault } from '@/lib/moneda'

// GET - Obtener todas las monedas
import { checkPermission } from '@/lib/auth-helpers'
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError
  try {
    // Asegurar que existan las monedas por defecto
    await seedMonedasDefault()
    
    const monedas = await db.moneda.findMany({
      orderBy: { codigo: 'asc' },
      include: {
        _count: {
          select: { cotizaciones: true }
        }
      }
    })

    return NextResponse.json(monedas)
  } catch (error) {
    console.error('Error al obtener monedas:', error)
    return NextResponse.json(
      { error: 'Error al obtener monedas' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva moneda
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const data = await request.json()
    
    // Validar datos requeridos
    if (!data.codigo || !data.nombre || !data.simbolo) {
      return NextResponse.json(
        { error: 'Código, nombre y símbolo son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el código no exista
    const existente = await db.moneda.findUnique({
      where: { codigo: data.codigo.toUpperCase() }
    })

    if (existente) {
      return NextResponse.json(
        { error: 'Ya existe una moneda con ese código' },
        { status: 400 }
      )
    }

    // Si es default, quitar default de las demás
    if (data.esDefault) {
      await db.moneda.updateMany({
        where: { esDefault: true },
        data: { esDefault: false }
      })
    }

    const moneda = await db.moneda.create({
      data: {
        codigo: data.codigo.toUpperCase(),
        nombre: data.nombre,
        simbolo: data.simbolo,
        esDefault: data.esDefault || false,
        activa: data.activa !== false
      }
    })

    return NextResponse.json(moneda, { status: 201 })
  } catch (error) {
    console.error('Error al crear moneda:', error)
    return NextResponse.json(
      { error: 'Error al crear moneda' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar moneda
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const data = await request.json()
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'ID de moneda es requerido' },
        { status: 400 }
      )
    }

    // Si es default, quitar default de las demás
    if (data.esDefault) {
      await db.moneda.updateMany({
        where: { 
          esDefault: true,
          id: { not: data.id }
        },
        data: { esDefault: false }
      })
    }

    const moneda = await db.moneda.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        simbolo: data.simbolo,
        esDefault: data.esDefault,
        activa: data.activa
      }
    })

    return NextResponse.json(moneda)
  } catch (error) {
    console.error('Error al actualizar moneda:', error)
    return NextResponse.json(
      { error: 'Error al actualizar moneda' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar moneda
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID de moneda es requerido' },
        { status: 400 }
      )
    }

    // Verificar que no sea la moneda por defecto
    const moneda = await db.moneda.findUnique({
      where: { id }
    })

    if (!moneda) {
      return NextResponse.json(
        { error: 'Moneda no encontrada' },
        { status: 404 }
      )
    }

    if (moneda.esDefault) {
      return NextResponse.json(
        { error: 'No se puede eliminar la moneda por defecto' },
        { status: 400 }
      )
    }

    // Verificar que no tenga cotizaciones asociadas
    const cotizaciones = await db.cotizacion.count({
      where: { monedaId: id }
    })

    if (cotizaciones > 0) {
      // En lugar de eliminar, desactivar
      await db.moneda.update({
        where: { id },
        data: { activa: false }
      })
      return NextResponse.json({ 
        message: 'Moneda desactivada (tiene cotizaciones asociadas)' 
      })
    }

    await db.moneda.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Moneda eliminada correctamente' })
  } catch (error) {
    console.error('Error al eliminar moneda:', error)
    return NextResponse.json(
      { error: 'Error al eliminar moneda' },
      { status: 500 }
    )
  }
}
