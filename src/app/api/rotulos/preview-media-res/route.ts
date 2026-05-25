/**
 * API para previsualizar el rótulo MEDIA RES
 * Devuelve el ZPL con datos de ejemplo para probar en impresora
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    // Obtener el rótulo
    const rotulo = await db.rotulo.findFirst({
      where: { tipo: 'MEDIA_RES', activo: true }
    })

    if (!rotulo) {
      return NextResponse.json({ error: 'No hay rótulo MEDIA_RES configurado' }, { status: 404 })
    }

    // Datos de ejemplo para previsualización
    const ejemplo = {
      NOMBRE_CLIENTE: 'JUAN PEREZ',
      CUIT_CLIENTE: '20-12345678-9',
      MATRICULA_CLIENTE: '1234',
      FECHA_FAENA: '08/04/2025',
      TROPA: 'B 2026 0100',
      GARRON: '0015',
      LADO: 'DER',
      CLASIFICACION: 'A',
      KG: '125.5',
      VENCIMIENTO: '21/04/2025',
      CODIGO_BARRAS: 'B20260100-0015-DER-A'
    }

    // Reemplazar variables
    let zpl = rotulo.contenido
    for (const [key, value] of Object.entries(ejemplo)) {
      zpl = zpl.replace(new RegExp(`{${key}}`, 'g'), value)
    }

    return NextResponse.json({
      nombre: rotulo.nombre,
      ancho: rotulo.ancho,
      alto: rotulo.alto,
      dpi: rotulo.dpi,
      zpl: zpl,
      ejemplo: ejemplo
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const body = await request.json()
    
    // Obtener el rótulo
    const rotulo = await db.rotulo.findFirst({
      where: { tipo: 'MEDIA_RES', activo: true }
    })

    if (!rotulo) {
      return NextResponse.json({ error: 'No hay rótulo MEDIA_RES configurado' }, { status: 404 })
    }

    // Datos proporcionados o usar defaults
    const datos = {
      NOMBRE_CLIENTE: body.nombreCliente || 'CLIENTE EJEMPLO',
      CUIT_CLIENTE: body.cuitCliente || '00-00000000-0',
      MATRICULA_CLIENTE: body.matriculaCliente || '0000',
      FECHA_FAENA: body.fechaFaena || '01/01/2025',
      TROPA: body.tropa || 'X 0000 0000',
      GARRON: body.garron || '0000',
      LADO: body.lado || 'DER',
      CLASIFICACION: body.clasificacion || 'A',
      KG: body.kg || '0.0',
      VENCIMIENTO: body.vencimiento || '14/01/2025',
      CODIGO_BARRAS: body.codigoBarras || 'X00000000-0000-DER-A'
    }

    // Reemplazar variables
    let zpl = rotulo.contenido
    for (const [key, value] of Object.entries(datos)) {
      zpl = zpl.replace(new RegExp(`{${key}}`, 'g'), value)
    }

    return NextResponse.json({
      success: true,
      zpl: zpl,
      datos: datos
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
