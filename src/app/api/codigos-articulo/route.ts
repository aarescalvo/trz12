import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener todos los códigos de artículo
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') // especie, transporte, destino, tipoTrabajo, tipificacion

    let data: unknown = {}

    // Obtener todos los códigos de una vez
    const [especies, transportes, destinos, tiposTrabajo, tipificaciones] = await Promise.all([
      db.codigoEspecie.findMany({ where: { activo: true }, orderBy: { codigo: 'asc' } }),
      db.codigoTransporte.findMany({ where: { activo: true }, orderBy: { codigo: 'asc' } }),
      db.codigoDestino.findMany({ where: { activo: true }, orderBy: { codigo: 'asc' } }),
      db.codigoTipoTrabajo.findMany({ where: { activo: true }, orderBy: { codigo: 'asc' } }),
      db.codigoTipificacion.findMany({ where: { activo: true }, orderBy: { codigo: 'asc' } })
    ])

    if (tipo === 'especie') {
      data = { especies }
    } else if (tipo === 'transporte') {
      data = { transportes }
    } else if (tipo === 'destino') {
      data = { destinos }
    } else if (tipo === 'tipoTrabajo') {
      data = { tiposTrabajo }
    } else if (tipo === 'tipificacion') {
      data = { tipificaciones }
    } else {
      // Devolver todos
      data = {
        especies: especies.map(e => ({ id: e.id, codigo: e.codigo, nombre: e.nombre })),
        transportes: transportes.map(t => ({ id: t.id, codigo: t.codigo, nombre: t.nombre })),
        destinos: destinos.map(d => ({ id: d.id, codigo: d.codigo, nombre: d.nombre })),
        tiposTrabajo: tiposTrabajo.map(t => ({ id: t.id, codigo: t.codigo, nombre: t.nombre })),
        tipificaciones: tipificaciones.map(t => ({ id: t.id, codigo: t.codigo, nombre: t.nombre, especie: t.especie }))
      }
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error fetching códigos artículo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener códigos' },
      { status: 500 }
    )
  }
}

// POST - Crear código según tipo
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const body = await request.json()
    const { tipo, codigo, nombre, especie } = body

    if (!tipo || !codigo || !nombre) {
      return NextResponse.json(
        { success: false, error: 'tipo, codigo y nombre son requeridos' },
        { status: 400 }
      )
    }

    let result

    switch (tipo) {
      case 'especie':
        result = await db.codigoEspecie.create({
          data: { codigo, nombre }
        })
        break
      case 'transporte':
        result = await db.codigoTransporte.create({
          data: { codigo, nombre }
        })
        break
      case 'destino':
        result = await db.codigoDestino.create({
          data: { codigo, nombre }
        })
        break
      case 'tipoTrabajo':
        result = await db.codigoTipoTrabajo.create({
          data: { codigo, nombre }
        })
        break
      case 'tipificacion':
        if (!especie) {
          return NextResponse.json(
            { success: false, error: 'especie es requerida para tipificación' },
            { status: 400 }
          )
        }
        result = await db.codigoTipificacion.create({
          data: { codigo, nombre, especie: especie.toUpperCase() as 'BOVINO' | 'EQUINO' }
        })
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Tipo de código no válido' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error creating código:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear código' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar código
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const body = await request.json()
    const { tipo, id, codigo, nombre, activo } = body

    if (!tipo || !id) {
      return NextResponse.json(
        { success: false, error: 'tipo e id son requeridos' },
        { status: 400 }
      )
    }

    const data: Record<string, unknown> = {}
    if (codigo !== undefined) data.codigo = codigo
    if (nombre !== undefined) data.nombre = nombre
    if (activo !== undefined) data.activo = activo

    let result

    switch (tipo) {
      case 'especie':
        result = await db.codigoEspecie.update({ where: { id }, data })
        break
      case 'transporte':
        result = await db.codigoTransporte.update({ where: { id }, data })
        break
      case 'destino':
        result = await db.codigoDestino.update({ where: { id }, data })
        break
      case 'tipoTrabajo':
        result = await db.codigoTipoTrabajo.update({ where: { id }, data })
        break
      case 'tipificacion':
        result = await db.codigoTipificacion.update({ where: { id }, data })
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Tipo de código no válido' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error updating código:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar código' },
      { status: 500 }
    )
  }
}
