import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// DELETE - Desbloquear IP
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const { id: bloqueoId } = await params
    
    const bloqueo = await db.ipBloqueada.findUnique({
      where: { id: bloqueoId }
    })
    
    if (!bloqueo) {
      return NextResponse.json(
        { success: false, error: 'Bloqueo no encontrado' },
        { status: 404 }
      )
    }
    
    // Desactivar bloqueo
    await db.ipBloqueada.update({
      where: { id: bloqueoId },
      data: {
        activo: false
      }
    })
    
    // Registrar en auditoría
    await db.auditoria.create({
      data: {
        modulo: 'SEGURIDAD',
        accion: 'UNLOCK',
        entidad: 'IpBloqueada',
        entidadId: bloqueoId,
        descripcion: `IP desbloqueada: ${bloqueo.ip}`,
        datosAntes: JSON.stringify({ ip: bloqueo.ip, motivo: bloqueo.motivo })
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'IP desbloqueada correctamente'
    })
  } catch (error) {
    console.error('Error desbloqueando IP:', error)
    return NextResponse.json(
      { success: false, error: 'Error al desbloquear IP' },
      { status: 500 }
    )
  }
}
