import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { 
  validateCertificatePair, 
  storeCertificate, 
  getCertificateConfig,
  parseCertificate,
  needsRenewal,
  deleteCertificates,
  CertificateInfo
} from '@/lib/afip-certificates'
import { verificarConfiguracionAFIP, probarConexionAFIP } from '@/lib/afip-wsaa'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Obtener configuración AFIP
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const config = await db.configuracionFrigorifico.findFirst()
    const certConfig = await getCertificateConfig()
    
    // Obtener info del certificado si existe
    let certInfo: CertificateInfo | null = null
    if (certConfig?.certificate) {
      certInfo = parseCertificate(certConfig.certificate)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        cuit: config?.cuit || '',
        razonSocial: config?.nombre || '',
        domicilio: config?.direccion || certConfig?.domicilio || '',
        puntoVenta: certConfig?.puntoVenta || 1,
        inicioActividades: certConfig?.inicioActividades || '',
        ambiente: certConfig?.ambiente || 'testing',
        certificadoConfigurado: !!certConfig?.certificate,
        clavePrivadaConfigurada: !!certConfig?.privateKey,
        certificadoValido: certConfig?.isValid || false,
        fechaVencimiento: certConfig?.expirationDate?.toISOString() || null,
        necesitaRenovacion: certConfig?.expirationDate ? needsRenewal(certConfig.expirationDate) : false,
        certificadoInfo: certInfo ? {
          subject: certInfo.subject,
          issuer: certInfo.issuer,
          notBefore: certInfo.notBefore.toISOString(),
          notAfter: certInfo.notAfter.toISOString(),
          daysUntilExpiry: certInfo.daysUntilExpiry,
          cuit: certInfo.cuit
        } : null
      }
    })
  } catch (error) {
    console.error('Error al obtener configuración AFIP:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener configuración' },
      { status: 500 }
    )
  }
}

// POST - Actualizar configuración AFIP
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const body = await request.json()
    const { 
      cuit, 
      razonSocial, 
      domicilio, 
      puntoVenta,
      inicioActividades,
      ambiente,
      // Certificados (opcional)
      certificado,
      clavePrivada
    } = body

    // Validar CUIT
    if (cuit && !validarCUIT(cuit)) {
      return NextResponse.json(
        { success: false, error: 'CUIT inválido' },
        { status: 400 }
      )
    }

    // Si se envían certificados, validarlos
    if (certificado || clavePrivada) {
      if (!certificado || !clavePrivada) {
        return NextResponse.json(
          { success: false, error: 'Debe enviar ambos: certificado y clave privada' },
          { status: 400 }
        )
      }

      const validation = validateCertificatePair(certificado, clavePrivada)
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, errors: validation.errors },
          { status: 400 }
        )
      }

      // Guardar certificados
      const storeResult = await storeCertificate(
        certificado,
        clavePrivada,
        puntoVenta || 1,
        ambiente || 'testing'
      )

      if (!storeResult.success) {
        return NextResponse.json(
          { success: false, errors: storeResult.errors },
          { status: 400 }
        )
      }
    } else {
      // Solo actualizar punto de venta y ambiente
      const existing = await db.aFIPConfig.findFirst()
      if (existing) {
        await db.aFIPConfig.update({
          where: { id: existing.id },
          data: {
            puntoVenta: puntoVenta || existing.puntoVenta,
            ambiente: ambiente || existing.ambiente,
            inicioActividades: inicioActividades || existing.inicioActividades
          }
        })
      } else {
        await db.aFIPConfig.create({
          data: {
            puntoVenta: puntoVenta || 1,
            ambiente: ambiente || 'testing',
            inicioActividades: inicioActividades || null
          }
        })
      }
    }

    // Actualizar configuración del frigorífico
    let config = await db.configuracionFrigorifico.findFirst()
    
    if (config) {
      config = await db.configuracionFrigorifico.update({
        where: { id: config.id },
        data: {
          cuit: cuit || null,
          nombre: razonSocial || config.nombre,
          direccion: domicilio || null
        }
      })
    } else {
      config = await db.configuracionFrigorifico.create({
        data: {
          cuit: cuit || null,
          nombre: razonSocial || 'Frigorífico',
          direccion: domicilio || null
        }
      })
    }

    // Registrar en auditoría
    await db.auditoria.create({
      data: {
        modulo: 'AFIP',
        accion: 'UPDATE',
        entidad: 'ConfiguracionAFIP',
        descripcion: 'Configuración AFIP actualizada',
      }
    })

    return NextResponse.json({
      success: true,
      data: config
    })
  } catch (error) {
    console.error('Error al actualizar configuración AFIP:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar configuración' },
      { status: 500 }
    )
  }
}

// PUT - Probar conexión con AFIP
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    // Verificar configuración primero
    const verificacion = await verificarConfiguracionAFIP()
    
    if (!verificacion.configurado) {
      return NextResponse.json({
        success: false,
        error: 'Configuración incompleta',
        errores: verificacion.errores
      })
    }

    // Probar conexión
    const resultado = await probarConexionAFIP()
    
    return NextResponse.json({
      success: resultado.exito,
      message: resultado.mensaje,
      vencimiento: resultado.vencimiento?.toISOString()
    })
  } catch (error) {
    console.error('Error al probar conexión AFIP:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con AFIP'
    })
  }
}

// DELETE - Eliminar certificados
export async function DELETE(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const result = await deleteCertificates()
    
    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'Error al eliminar certificados'
      })
    }

    // Registrar en auditoría
    await db.auditoria.create({
      data: {
        modulo: 'AFIP',
        accion: 'DELETE',
        entidad: 'CertificadosAFIP',
        descripcion: 'Certificados AFIP eliminados',
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Certificados eliminados correctamente'
    })
  } catch (error) {
    console.error('Error al eliminar certificados:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error al eliminar certificados'
    })
  }
}

// Función auxiliar para validar CUIT
function validarCUIT(cuit: string): boolean {
  // Remover guiones y espacios
  const cuitLimpio = cuit.replace(/[-\s]/g, '')
  
  // Debe tener 11 dígitos
  if (!/^\d{11}$/.test(cuitLimpio)) {
    return false
  }

  // Validar dígito verificador
  const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  let suma = 0
  
  for (let i = 0; i < 10; i++) {
    suma += parseInt(cuitLimpio[i]) * multiplicadores[i]
  }
  
  const resto = suma % 11
  const digitoVerificador = resto === 0 ? 0 : resto === 1 ? 9 : 11 - resto
  
  return parseInt(cuitLimpio[10]) === digitoVerificador
}
