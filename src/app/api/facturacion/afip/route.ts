import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// GET - Get AFIP configuration
export async function GET() {
  try {
    let config = await db.configuracionAFIP.findFirst({ where: { activo: true } })
    
    if (!config) {
      // Create default config with testing URLs
      config = await db.configuracionAFIP.create({
        data: {
          entorno: 'testing',
          wsaaUrl: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
          wsfeUrl: 'https://wsfehomo.afip.gov.ar/wsfev1/service.asmx',
        }
      })
    }
    
    return NextResponse.json({ success: true, data: config })
  } catch (error) {
    console.error('Error fetching AFIP config:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener configuración AFIP' }, { status: 500 })
  }
}

// PUT - Update AFIP configuration
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeFacturacion')
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, ...data } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' }, 
        { status: 400 }
      )
    }
    
    const config = await db.configuracionAFIP.update({
      where: { id },
      data
    })
    
    return NextResponse.json({ success: true, data: config })
  } catch (error) {
    console.error('Error updating AFIP config:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar configuración AFIP' }, { status: 500 })
  }
}
