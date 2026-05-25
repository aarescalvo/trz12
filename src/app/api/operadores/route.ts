import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { validarPermiso, validarRolAdmin, getOperadorId } from '@/lib/auth-helpers'
import { auditCreate, auditUpdate, auditDelete, auditPermissionChange, extractAuditInfo } from '@/lib/audit-middleware'

// GET - Listar operadores
export async function GET(request: NextRequest) {
  try {
    const operadorId = getOperadorId(request)
    const puedeVer = await validarPermiso(operadorId, 'puedeConfiguracion')
    if (!puedeVer) {
      return NextResponse.json({ success: false, error: 'Sin permisos de configuración' }, { status: 403 })
    }

    const operadores = await db.operador.findMany({
      select: {
        id: true,
        nombre: true,
        usuario: true,
        email: true,
        rol: true,
        activo: true,
        puedePesajeCamiones: true,
        puedePesajeIndividual: true,
        puedeMovimientoHacienda: true,
        puedeListaFaena: true,
        puedeIngresoCajon: true,
        puedeRomaneo: true,
        puedeCuarteo: true,
        puedeDesposte: true,
        puedeEmpaque: true,
        puedeExpedicionC2: true,
        puedeMenudencias: true,
        puedeStock: true,
        puedeCCIR: true,
        puedeFacturacion: true,
        puedeReportes: true,
        puedeConfiguracion: true,
        puedeCalidad: true,
        puedeAutorizarReportes: true,
        createdAt: true
      },
      orderBy: { nombre: 'asc' }
    })
    
    return NextResponse.json({
      success: true,
      data: operadores
    })
  } catch (error) {
    console.error('Error fetching operadores:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener operadores' },
      { status: 500 }
    )
  }
}

// POST - Crear operador (solo ADMINISTRADOR)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const operadorIdAuth = getOperadorId(request)
    
    // Verificar permiso de configuración
    const puedeCrear = await validarPermiso(operadorIdAuth, 'puedeConfiguracion')
    if (!puedeCrear) {
      return NextResponse.json({ success: false, error: 'Sin permisos de configuración' }, { status: 403 })
    }
    
    // Verificar que sea ADMINISTRADOR para crear operadores
    const isAdmin = await validarRolAdmin(operadorIdAuth)
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Solo administradores pueden crear operadores' }, { status: 403 })
    }

    const {
      nombre,
      usuario,
      password,
      pin,
      email,
      rol,
      puedePesajeCamiones,
      puedePesajeIndividual,
      puedeMovimientoHacienda,
      puedeListaFaena,
      puedeIngresoCajon,
      puedeRomaneo,
      puedeCuarteo,
      puedeDesposte,
      puedeEmpaque,
      puedeExpedicionC2,
      puedeMenudencias,
      puedeStock,
      puedeCCIR,
      puedeFacturacion,
      puedeReportes,
      puedeConfiguracion,
      puedeCalidad,
      puedeAutorizarReportes
    } = body
    
    if (!nombre || !usuario || !password) {
      return NextResponse.json(
        { success: false, error: 'Nombre, usuario y contraseña son requeridos' },
        { status: 400 }
      )
    }
    
    // Verificar si ya existe un operador con el mismo usuario
    const existingUsuario = await db.operador.findFirst({
      where: { usuario }
    })
    
    if (existingUsuario) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un operador con ese usuario' },
        { status: 400 }
      )
    }
    
    // Verificar PIN si se proporciona
    if (pin) {
      const existingPin = await db.operador.findFirst({
        where: { pin }
      })
      
      if (existingPin) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un operador con ese PIN' },
          { status: 400 }
        )
      }
    }
    
    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const operador = await db.operador.create({
      data: {
        nombre,
        usuario,
        password: hashedPassword,
        pin: pin || null,
        email: email || null,
        rol: rol || 'OPERADOR',
        puedePesajeCamiones: puedePesajeCamiones ?? true,
        puedePesajeIndividual: puedePesajeIndividual ?? true,
        puedeMovimientoHacienda: puedeMovimientoHacienda ?? true,
        puedeListaFaena: puedeListaFaena ?? false,
        puedeRomaneo: puedeRomaneo ?? false,
        puedeIngresoCajon: puedeIngresoCajon ?? false,
        puedeCuarteo: puedeCuarteo ?? false,
        puedeDesposte: puedeDesposte ?? false,
        puedeEmpaque: puedeEmpaque ?? false,
        puedeExpedicionC2: puedeExpedicionC2 ?? false,
        puedeMenudencias: puedeMenudencias ?? false,
        puedeStock: puedeStock ?? false,
        puedeCCIR: puedeCCIR ?? false,
        puedeFacturacion: puedeFacturacion ?? false,
        puedeReportes: puedeReportes ?? false,
        puedeConfiguracion: puedeConfiguracion ?? false,
        puedeCalidad: puedeCalidad ?? false,
        puedeAutorizarReportes: puedeAutorizarReportes ?? false
      }
    })
    
    // Auditoría
    const { ip } = extractAuditInfo(request)
    auditCreate({
      operadorId: operadorIdAuth || undefined,
      modulo: 'OPERADORES',
      entidad: 'Operador',
      entidadId: operador.id,
      entidadNombre: `${operador.nombre} (${operador.usuario})`,
      datos: { nombre: operador.nombre, usuario: operador.usuario, rol: operador.rol, permisos: body },
      descripcion: `Creación de operador: ${operador.nombre} - Rol: ${operador.rol}`,
      ip
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      data: {
        id: operador.id,
        nombre: operador.nombre,
        usuario: operador.usuario,
        rol: operador.rol
      }
    })
  } catch (error) {
    console.error('Error creating operador:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear operador' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar operador
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const operadorIdAuth = getOperadorId(request)
    const puedeEditar = await validarPermiso(operadorIdAuth, 'puedeConfiguracion')
    if (!puedeEditar) {
      return NextResponse.json({ success: false, error: 'Sin permisos de configuración' }, { status: 403 })
    }

    // Verificar que sea ADMINISTRADOR para editar operadores
    const isAdminEdit = await validarRolAdmin(operadorIdAuth)
    if (!isAdminEdit) {
      return NextResponse.json({ success: false, error: 'Solo administradores pueden editar operadores' }, { status: 403 })
    }

    const {
      id,
      nombre,
      usuario,
      password,
      pin,
      email,
      rol,
      activo,
      puedePesajeCamiones,
      puedePesajeIndividual,
      puedeMovimientoHacienda,
      puedeListaFaena,
      puedeIngresoCajon,
      puedeRomaneo,
      puedeCuarteo,
      puedeDesposte,
      puedeEmpaque,
      puedeExpedicionC2,
      puedeMenudencias,
      puedeStock,
      puedeCCIR,
      puedeFacturacion,
      puedeReportes,
      puedeConfiguracion,
      puedeCalidad,
      puedeAutorizarReportes
    } = body
    
    const updateData: Record<string, unknown> = {}
    
    if (nombre !== undefined) updateData.nombre = nombre
    if (usuario !== undefined) updateData.usuario = usuario
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }
    if (pin !== undefined) updateData.pin = pin || null
    if (email !== undefined) updateData.email = email || null
    if (rol !== undefined) updateData.rol = rol
    if (activo !== undefined) updateData.activo = activo
    if (puedePesajeCamiones !== undefined) updateData.puedePesajeCamiones = puedePesajeCamiones
    if (puedePesajeIndividual !== undefined) updateData.puedePesajeIndividual = puedePesajeIndividual
    if (puedeMovimientoHacienda !== undefined) updateData.puedeMovimientoHacienda = puedeMovimientoHacienda
    if (puedeListaFaena !== undefined) updateData.puedeListaFaena = puedeListaFaena
    if (puedeRomaneo !== undefined) updateData.puedeRomaneo = puedeRomaneo
    if (puedeIngresoCajon !== undefined) updateData.puedeIngresoCajon = puedeIngresoCajon
    if (puedeCuarteo !== undefined) updateData.puedeCuarteo = puedeCuarteo
    if (puedeDesposte !== undefined) updateData.puedeDesposte = puedeDesposte
    if (puedeEmpaque !== undefined) updateData.puedeEmpaque = puedeEmpaque
    if (puedeExpedicionC2 !== undefined) updateData.puedeExpedicionC2 = puedeExpedicionC2
    if (puedeMenudencias !== undefined) updateData.puedeMenudencias = puedeMenudencias
    if (puedeStock !== undefined) updateData.puedeStock = puedeStock
    if (puedeCCIR !== undefined) updateData.puedeCCIR = puedeCCIR
    if (puedeFacturacion !== undefined) updateData.puedeFacturacion = puedeFacturacion
    if (puedeReportes !== undefined) updateData.puedeReportes = puedeReportes
    if (puedeConfiguracion !== undefined) updateData.puedeConfiguracion = puedeConfiguracion
    if (puedeCalidad !== undefined) updateData.puedeCalidad = puedeCalidad
    if (puedeAutorizarReportes !== undefined) updateData.puedeAutorizarReportes = puedeAutorizarReportes
    
    const operadorAntes = await db.operador.findUnique({
      where: { id },
      select: { nombre: true, usuario: true, rol: true, activo: true, puedePesajeCamiones: true, puedeFacturacion: true, puedeConfiguracion: true, puedeReportes: true, puedeCalidad: true }
    })

    const operador = await db.operador.update({
      where: { id },
      data: updateData
    })

    // Auditoría: si cambiaron permisos, registrar cambio de permisos
    const { ip } = extractAuditInfo(request)
    const permFields = ['puedePesajeCamiones','puedePesajeIndividual','puedeMovimientoHacienda','puedeListaFaena','puedeRomaneo','puedeIngresoCajon','puedeCuarteo','puedeDesposte','puedeEmpaque','puedeExpedicionC2','puedeMenudencias','puedeStock','puedeCCIR','puedeFacturacion','puedeReportes','puedeConfiguracion','puedeCalidad','puedeAutorizarReportes']
    const permChanged = permFields.some(f => body[f] !== undefined && body[f] !== operadorAntes?.[f as keyof typeof operadorAntes])
    const rolChanged = body.rol !== undefined && body.rol !== operadorAntes?.rol

    if (permChanged || rolChanged) {
      auditPermissionChange({
        operadorId: operadorIdAuth || undefined,
        operadorAfectadoId: id,
        permisosAntes: operadorAntes,
        permisosDespues: updateData,
        ip
      }).catch(() => {})
    }

    auditUpdate({
      operadorId: operadorIdAuth || undefined,
      modulo: 'OPERADORES',
      entidad: 'Operador',
      entidadId: operador.id,
      entidadNombre: `${operador.nombre} (${operador.usuario})`,
      datosAntes: operadorAntes,
      datosDespues: updateData,
      descripcion: `Actualización de operador: ${operador.nombre} (${operador.usuario}) - Cambios: ${Object.keys(updateData).join(', ')}`,
      ip
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      data: {
        id: operador.id,
        nombre: operador.nombre,
        usuario: operador.usuario,
        rol: operador.rol
      }
    })
  } catch (error) {
    console.error('Error updating operador:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar operador' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar operador (solo ADMINISTRADOR)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const operadorIdAuth = request.headers.get('x-operador-id')
    
    // Verificar permiso de configuración
    const puedeEliminar = await validarPermiso(operadorIdAuth, 'puedeConfiguracion')
    if (!puedeEliminar) {
      return NextResponse.json({ success: false, error: 'Sin permisos de configuración' }, { status: 403 })
    }
    
    // Verificar que sea ADMINISTRADOR para eliminar operadores
    const isAdmin = await validarRolAdmin(operadorIdAuth)
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Solo administradores pueden eliminar operadores' }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }
    
    // Obtener datos antes de eliminar para auditoría
    const operadorElim = await db.operador.findUnique({ where: { id }, select: { id: true, nombre: true, usuario: true, rol: true } })
    await db.operador.delete({
      where: { id }
    })

    // Auditoría
    const { ip } = extractAuditInfo(request)
    auditDelete({
      operadorId: operadorIdAuth || undefined,
      modulo: 'OPERADORES',
      entidad: 'Operador',
      entidadId: id,
      entidadNombre: `${operadorElim?.nombre || ''} (${operadorElim?.usuario || ''})`,
      datos: operadorElim,
      descripcion: `Eliminación de operador: ${operadorElim?.nombre || id}`,
      ip
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting operador:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar operador' },
      { status: 500 }
    )
  }
}
