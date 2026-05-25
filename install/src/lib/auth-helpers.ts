import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Extrae el operadorId únicamente del header x-operador-id.
 * El header es establecido por el middleware después de la validación JWT.
 */
export function getOperadorId(request: NextRequest): string | null {
  return request.headers.get('x-operador-id')
}

/**
 * Valida que un operador tenga un permiso específico.
 * ADMINISTRADOR tiene todos los permisos automáticamente.
 */
export async function validarPermiso(operadorId: string | null | undefined, permiso: string): Promise<boolean> {
  if (!operadorId) return false

  type OperadorPermCheck = {
    rol: string
    activo: boolean
    [key: string]: unknown
  }

  const operador = await db.operador.findUnique({
    where: { id: operadorId },
    select: { rol: true, activo: true, [permiso]: true }
  }) as OperadorPermCheck | null

  if (!operador) return false
  if (!operador.activo) return false

  // ADMINISTRADOR tiene todos los permisos
  if (operador.rol === 'ADMINISTRADOR') return true

  return operador[permiso] === true
}

/**
 * Extrae el operadorId del request y valida que tenga el permiso requerido.
 * Devuelve null si autorizado, o una NextResponse de error si no.
 */
export async function checkPermission(
  request: NextRequest,
  permiso: string
): Promise<NextResponse | null> {
  const operadorId = request.headers.get('x-operador-id')

  if (!operadorId) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    )
  }

  const hasPermission = await validarPermiso(operadorId, permiso)
  if (!hasPermission) {
    return NextResponse.json(
      { success: false, error: 'Sin permisos suficientes' },
      { status: 403 }
    )
  }

  return null
}
