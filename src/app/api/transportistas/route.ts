import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission, checkAnyPermission, getOperadorId } from '@/lib/auth-helpers'
import { auditCreate, auditUpdate, auditDelete, extractAuditInfo } from '@/lib/audit-middleware'

// Un operador de pesaje puede consultar y crear transportistas/productores/clientes
// para dar de alta en el momento, sin necesitar permisos de facturacion o configuracion
const PESAJE_ALT = ['puedeConfiguracion', 'puedePesajeCamiones']
const PESAJE_ALT_NO_DELETE = ['puedeConfiguracion', 'puedePesajeCamiones']
const PESAJE_ALT_READONLY = ['puedeConfiguracion', 'puedePesajeCamiones']

// GET - Fetch transportistas
export async function GET(request: NextRequest) {
  const authError = await checkAnyPermission(request, PESAJE_ALT_READONLY)
  if (authError) return authError
  try {
    const transportistas = await db.transportista.findMany({
      orderBy: { nombre: 'asc' }
    })
    
    return NextResponse.json({
      success: true,
      data: transportistas
    })
  } catch (error) {
    console.error('Error fetching transportistas:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener transportistas' },
      { status: 500 }
    )
  }
}

// POST - Create transportista
export async function POST(request: NextRequest) {
  const authError = await checkAnyPermission(request, PESAJE_ALT)
  if (authError) return authError
  try {
    const body = await request.json()
    const { nombre, cuit, direccion, telefono } = body
    
    if (!nombre) {
      return NextResponse.json(
        { success: false, error: 'El nombre es obligatorio' },
        { status: 400 }
      )
    }
    
    // Validar CUIT único si se proporciona
    if (cuit && cuit.trim() !== '') {
      const cuitExistente = await db.transportista.findFirst({
        where: { cuit: cuit.trim() }
      })
      
      if (cuitExistente) {
        return NextResponse.json(
          { success: false, error: `Ya existe un transportista con el CUIT ${cuit}` },
          { status: 400 }
        )
      }
    }
    
    const transportista = await db.transportista.create({
      data: {
        nombre,
        cuit: cuit || null,
        direccion: direccion || null,
        telefono: telefono || null
      }
    })
    
    // Auditoría
    const { ip } = extractAuditInfo(request)
    auditCreate({
      operadorId: getOperadorId(request) || undefined,
      modulo: 'CONFIGURACION',
      entidad: 'Transportista',
      entidadId: transportista.id,
      entidadNombre: transportista.nombre,
      datos: transportista,
      descripcion: `Creación de transportista: ${transportista.nombre}${transportista.cuit ? ` (CUIT: ${transportista.cuit})` : ''}`,
      ip
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      data: transportista
    })
  } catch (error) {
    console.error('Error creating transportista:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear transportista' },
      { status: 500 }
    )
  }
}

// PUT - Update transportista
export async function PUT(request: NextRequest) {
  const authError = await checkAnyPermission(request, PESAJE_ALT)
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, nombre, cuit, direccion, telefono } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }
    
    // Validar CUIT único si se está actualizando
    if (cuit && cuit.trim() !== '') {
      const cuitExistente = await db.transportista.findFirst({
        where: { 
          cuit: cuit.trim(),
          id: { not: id }
        }
      })
      
      if (cuitExistente) {
        return NextResponse.json(
          { success: false, error: `Ya existe otro transportista con el CUIT ${cuit}` },
          { status: 400 }
        )
      }
    }
    
    // Obtener datos antes de actualizar para auditoría
    const transportistaAntes = await db.transportista.findUnique({ where: { id } })

    const transportista = await db.transportista.update({
      where: { id },
      data: {
        nombre,
        cuit: cuit || null,
        direccion: direccion || null,
        telefono: telefono || null
      }
    })
    
    // Auditoría
    const { ip } = extractAuditInfo(request)
    auditUpdate({
      operadorId: getOperadorId(request) || undefined,
      modulo: 'CONFIGURACION',
      entidad: 'Transportista',
      entidadId: transportista.id,
      entidadNombre: transportista.nombre,
      datosAntes: transportistaAntes,
      datosDespues: transportista,
      descripcion: `Actualización de transportista: ${transportista.nombre}`,
      ip
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      data: transportista
    })
  } catch (error) {
    console.error('Error updating transportista:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar transportista' },
      { status: 500 }
    )
  }
}

// DELETE - Delete transportista
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
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
    
    // Obtener datos antes de eliminar para auditoría
    const transportistaElim = await db.transportista.findUnique({ where: { id } })
    await db.transportista.delete({
      where: { id }
    })

    // Auditoría
    const { ip } = extractAuditInfo(request)
    auditDelete({
      operadorId: getOperadorId(request) || undefined,
      modulo: 'CONFIGURACION',
      entidad: 'Transportista',
      entidadId: id,
      entidadNombre: transportistaElim?.nombre,
      datos: transportistaElim,
      descripcion: `Eliminación de transportista: ${transportistaElim?.nombre || id}`,
      ip
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: 'Transportista eliminado'
    })
  } catch (error) {
    console.error('Error deleting transportista:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar transportista' },
      { status: 500 }
    )
  }
}
