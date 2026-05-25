import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// Umbrales por defecto
const DEFAULTS = {
  umbralPSE: 5.4,
  umbralNormMax: 5.7,
  umbralIntMax: 5.9
}

// ============================================
// GET - Obtener configuración de umbrales pH
// Si no existe, devuelve los defaults
// ============================================
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if (authError) return authError

  try {
    let config = await db.configuracionPH.findFirst()
    if (!config) {
      // Crear con valores por defecto
      config = await db.configuracionPH.create({ data: { ...DEFAULTS } })
    }

    // Calcular descripciones de rangos legibles
    const rangos = {
      ALTO: `pH < ${config.umbralPSE} (PSE)`,
      NORMAL: `pH ${config.umbralPSE} - ${config.umbralNormMax}`,
      INTERMEDIO: `pH ${Number((config.umbralNormMax + 0.1).toFixed(1))} - ${config.umbralIntMax}`,
      DFD: `pH > ${config.umbralIntMax}`
    }

    return NextResponse.json({
      success: true,
      data: {
        ...config,
        rangos
      }
    })
  } catch (error) {
    console.error('[calidad-ph/config GET] Error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener configuración de pH' }, { status: 500 })
  }
}

// ============================================
// PUT - Actualizar umbrales de clasificación pH
// ============================================
export async function PUT(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeReportes')
  if ( authError) return authError

  try {
    const { umbralPSE, umbralNormMax, umbralIntMax } = await request.json()

    // Validaciones básicas
    const pse = umbralPSE !== undefined ? parseFloat(umbralPSE) : undefined
    const norm = umbralNormMax !== undefined ? parseFloat(umbralNormMax) : undefined
    const inter = umbralIntMax !== undefined ? parseFloat(umbralIntMax) : undefined

    if (pse !== undefined && (pse <= 0 || pse > 14)) {
      return NextResponse.json({ success: false, error: 'Umbral PSE debe estar entre 0 y 14' }, { status: 400 })
    }
    if (norm !== undefined && (norm <= 0 || norm > 14)) {
      return NextResponse.json({ success: false, error: 'Umbral Normal Max debe estar entre 0 y 14' }, { status: 400 })
    }
    if (inter !== undefined && (inter <= 0 || inter > 14)) {
      return NextResponse.json({ success: false, error: 'Umbral Intermedio Max debe estar entre 0 y 14' }, { status: 400 })
    }

    // Validar orden lógico
    const currentConfig = await db.configuracionPH.findFirst()
    const currentPSE = pse !== undefined ? pse : (currentConfig?.umbralPSE ?? DEFAULTS.umbralPSE)
    const currentNorm = norm !== undefined ? norm : (currentConfig?.umbralNormMax ?? DEFAULTS.umbralNormMax)
    const currentInter = inter !== undefined ? inter : (currentConfig?.umbralIntMax ?? DEFAULTS.umbralIntMax)

    if (currentPSE > currentNorm) {
      return NextResponse.json({ success: false, error: 'El umbral PSE debe ser menor o igual al umbral Normal Max' }, { status: 400 })
    }
    if (currentNorm >= currentInter) {
      return NextResponse.json({ success: false, error: 'El umbral Normal Max debe ser menor al umbral Intermedio Max' }, { status: 400 })
    }

    // Upsert configuración
    const data: any = {}
    if (pse !== undefined) data.umbralPSE = pse
    if (norm !== undefined) data.umbralNormMax = norm
    if (inter !== undefined) data.umbralIntMax = inter

    let config: any
    if (currentConfig) {
      config = await db.configuracionPH.update({
        where: { id: currentConfig.id },
        data
      })
    } else {
      config = await db.configuracionPH.create({
        data: {
          umbralPSE: pse ?? DEFAULTS.umbralPSE,
          umbralNormMax: norm ?? DEFAULTS.umbralNormMax,
          umbralIntMax: inter ?? DEFAULTS.umbralIntMax
        }
      })
    }

    const rangos = {
      ALTO: `pH < ${config.umbralPSE} (PSE)`,
      NORMAL: `pH ${config.umbralPSE} - ${config.umbralNormMax}`,
      INTERMEDIO: `pH ${Number((config.umbralNormMax + 0.1).toFixed(1))} - ${config.umbralIntMax}`,
      DFD: `pH > ${config.umbralIntMax}`
    }

    return NextResponse.json({
      success: true,
      data: { ...config, rangos },
      message: 'Configuración de pH actualizada correctamente'
    })
  } catch (error) {
    console.error('[calidad-ph/config PUT] Error:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar configuración de pH' }, { status: 500 })
  }
}
