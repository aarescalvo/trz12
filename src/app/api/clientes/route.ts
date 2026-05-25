import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validarPermiso, validarPermisoAny, getOperadorId } from '@/lib/auth-helpers'
import { auditCreate, auditUpdate, auditDelete, extractAuditInfo } from '@/lib/audit-middleware'

// GET - Fetch clientes (con filtro opcional por tipo)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const activos = searchParams.get('activos')

    const where: Record<string, unknown> = {}

    if (tipo) {
      where.tipo = tipo
    }

    if (activos === 'true') {
      where.activo = true
    }

    const clientes = await db.cliente.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { nombre: 'asc' }
    })
    
    return NextResponse.json({
      success: true,
      data: clientes
    })
  } catch (error) {
    console.error('Error fetching clientes:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener clientes' },
      { status: 500 }
    )
  }
}

// POST - Create new cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const operadorId = body.operadorId || getOperadorId(request)
    const puedeCrear = await validarPermisoAny(operadorId, ['puedeFacturacion', 'puedePesajeCamiones'])
    if (!puedeCrear) {
      return NextResponse.json({ success: false, error: 'Sin permisos suficientes' }, { status: 403 })
    }
    const {
      nombre, tipo, dni, cuit, matricula, direccion, localidad, provincia, 
      telefono, telefonoAlternativo, email, razonSocial, condicionIva, 
      puntoVenta, observaciones 
    } = body
    
    if (!nombre) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }
    
    // Validar CUIT único si se proporciona
    if (cuit && cuit.trim() !== '') {
      const cuitExistente = await db.cliente.findFirst({
        where: { 
          cuit: cuit.trim(),
          activo: true 
        }
      })
      
      if (cuitExistente) {
        return NextResponse.json(
          { success: false, error: `Ya existe un cliente con el CUIT ${cuit}` },
          { status: 400 }
        )
      }
    }
    
    const cliente = await db.cliente.create({
      data: {
        nombre,
        esProductor: tipo === 'PRODUCTOR' ? true : false,
        esUsuarioFaena: tipo === 'USUARIO_FAENA' ? true : false,
        dni: dni || null,
        cuit: cuit || null,
        matricula: matricula || null,
        direccion: direccion || null,
        localidad: localidad || null,
        provincia: provincia || null,
        telefono: telefono || null,
        telefonoAlternativo: telefonoAlternativo || null,
        email: email || null,
        razonSocial: razonSocial || null,
        condicionIva: condicionIva || null,
        puntoVenta: puntoVenta || null,
        observaciones: observaciones || null
      }
    })

    // Auditoría
    const { ip } = extractAuditInfo(request)
    auditCreate({
      operadorId: operadorId || undefined,
      modulo: 'CLIENTES',
      entidad: 'Cliente',
      entidadId: cliente.id,
      entidadNombre: cliente.nombre,
      datos: cliente,
      descripcion: `Creación de cliente: ${cliente.nombre}${cliente.cuit ? ` (CUIT: ${cliente.cuit})` : ''}`,
      ip
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      data: cliente
    })
  } catch (error) {
    console.error('Error creating cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear cliente' },
      { status: 500 }
    )
  }
}

// PUT - Update cliente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const operadorId = body.operadorId || getOperadorId(request)
    const puedeEditar = await validarPermisoAny(operadorId, ['puedeFacturacion', 'puedePesajeCamiones'])
    if (!puedeEditar) {
      return NextResponse.json({ success: false, error: 'Sin permisos suficientes' }, { status: 403 })
    }
    const {
      id, nombre, tipo, dni, cuit, matricula, direccion, localidad, provincia, 
      telefono, telefonoAlternativo, email, razonSocial, condicionIva, 
      puntoVenta, observaciones, activo 
    } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }
    
    // Validar CUIT único si se está actualizando
    if (cuit && cuit.trim() !== '') {
      const cuitExistente = await db.cliente.findFirst({
        where: { 
          cuit: cuit.trim(),
          activo: true,
          id: { not: id }
        }
      })
      
      if (cuitExistente) {
        return NextResponse.json(
          { success: false, error: `Ya existe otro cliente con el CUIT ${cuit}` },
          { status: 400 }
        )
      }
    }
    
    // Build data object with only provided fields
    const data: Record<string, unknown> = {}
    if (nombre !== undefined) data.nombre = nombre
    if (tipo !== undefined) data.tipo = tipo
    if (dni !== undefined) data.dni = dni || null
    if (cuit !== undefined) data.cuit = cuit || null
    if (matricula !== undefined) data.matricula = matricula || null
    if (direccion !== undefined) data.direccion = direccion || null
    if (localidad !== undefined) data.localidad = localidad || null
    if (provincia !== undefined) data.provincia = provincia || null
    if (telefono !== undefined) data.telefono = telefono || null
    if (telefonoAlternativo !== undefined) data.telefonoAlternativo = telefonoAlternativo || null
    if (email !== undefined) data.email = email || null
    if (razonSocial !== undefined) data.razonSocial = razonSocial || null
    if (condicionIva !== undefined) data.condicionIva = condicionIva || null
    if (puntoVenta !== undefined) data.puntoVenta = puntoVenta || null
    if (observaciones !== undefined) data.observaciones = observaciones || null
    if (activo !== undefined) data.activo = activo

    // Obtener datos antes de actualizar para auditoría
    const clienteAntes = await db.cliente.findUnique({ where: { id } })

    const cliente = await db.cliente.update({
      where: { id },
      data
    })

    // Auditoría
    const { ip } = extractAuditInfo(request)
    auditUpdate({
      operadorId: operadorId || undefined,
      modulo: 'CLIENTES',
      entidad: 'Cliente',
      entidadId: cliente.id,
      entidadNombre: cliente.nombre,
      datosAntes: clienteAntes,
      datosDespues: cliente,
      descripcion: `Actualización de cliente: ${cliente.nombre}`,
      ip
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      data: cliente
    })
  } catch (error) {
    console.error('Error updating cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar cliente' },
      { status: 500 }
    )
  }
}

// DELETE - Delete cliente
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const operadorId = request.headers.get('x-operador-id')
    const puedeEliminar = await validarPermiso(operadorId, 'puedeConfiguracion')
    if (!puedeEliminar) {
      return NextResponse.json({ success: false, error: 'Solo un administrador puede eliminar clientes' }, { status: 403 })
    }
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }
    
    // Obtener datos antes de eliminar para auditoría
    const clienteElim = await db.cliente.findUnique({ where: { id } })
    await db.cliente.delete({
      where: { id }
    })

    // Auditoría
    const { ip } = extractAuditInfo(request)
    auditDelete({
      operadorId: operadorId || undefined,
      modulo: 'CLIENTES',
      entidad: 'Cliente',
      entidadId: id,
      entidadNombre: clienteElim?.nombre,
      datos: clienteElim,
      descripcion: `Eliminación de cliente: ${clienteElim?.nombre || id}`,
      ip
    }).catch(() => {})

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error deleting cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar cliente' },
      { status: 500 }
    )
  }
}
