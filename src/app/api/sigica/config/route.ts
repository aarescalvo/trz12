import { NextRequest, NextResponse } from 'next/server'
import { 
  obtenerConfiguracionSIGICA, 
  guardarConfiguracionSIGICA,
  probarConexionSIGICA,
  SIGICAConfig 
} from '@/lib/sigica'
import { registrarAuditoria } from '@/lib/audit'
import { checkPermission } from '@/lib/auth-helpers'
import { encrypt } from '@/lib/crypto'

// GET /api/sigica/config - Obtener configuración de SIGICA
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const config = await obtenerConfiguracionSIGICA()
    
    // No devolver la contraseña en la respuesta
    const configSegura = config ? {
      ...config,
      password: config.password ? '******' : null
    } : null

    return NextResponse.json({
      success: true,
      data: configSegura
    })
  } catch (error) {
    console.error('Error al obtener configuración SIGICA:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener configuración' },
      { status: 500 }
    )
  }
}

// PUT /api/sigica/config - Guardar configuración de SIGICA
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError
  try {
    const body = await request.json()
    
    // Preparar datos a guardar
    const datosAGuardar: Partial<SIGICAConfig> = {
      habilitado: body.habilitado ?? false,
      urlServicio: body.urlServicio || null,
      usuario: body.usuario || null,
      certificado: body.certificado || null,
      establecimiento: body.establecimiento || null
    }

    // Solo actualizar la contraseña si se proporcionó una nueva
    if (body.password && body.password !== '******') {
      // Encriptar la contraseña antes de almacenar en la base de datos
      datosAGuardar.password = encrypt(body.password)
    }

    // Guardar configuración
    const config = await guardarConfiguracionSIGICA(datosAGuardar)

    // Registrar auditoría
    await registrarAuditoria({
      modulo: 'SIGICA',
      accion: 'UPDATE',
      entidad: 'ConfiguracionSIGICA',
      entidadId: config.habilitado ? 'sigica-config' : undefined,
      descripcion: 'Configuración SIGICA actualizada',
      datosDespues: JSON.stringify({
        habilitado: config.habilitado,
        urlServicio: config.urlServicio,
        usuario: config.usuario,
        establecimiento: config.establecimiento
      })
    })

    // Si se solicitó probar la conexión
    let resultadoPrueba: any = null
    if (body.probarConexion && config.habilitado) {
      resultadoPrueba = await probarConexionSIGICA()
    }

    // Devolver configuración sin contraseña
    const configSegura = {
      ...config,
      password: config.password ? '******' : null
    }

    return NextResponse.json({
      success: true,
      data: configSegura,
      pruebaConexion: resultadoPrueba
    })
  } catch (error) {
    console.error('Error al guardar configuración SIGICA:', error)
    return NextResponse.json(
      { success: false, error: 'Error al guardar configuración' },
      { status: 500 }
    )
  }
}
