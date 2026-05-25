import { NextRequest, NextResponse } from 'next/server'
import { TipoRotulo } from '@prisma/client'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// Generar ID único
const generarId = () => Math.random().toString(36).substr(2, 9)

// Elementos por defecto para Media Res
const crearElementosMediaRes = () => [
  { id: generarId(), tipo: 'texto', valor: 'ROTULO DEFINITIVO ENVASE PRIMARIO', x: 50, y: 2, ancho: 96, tamano: 8, negrita: true, alineacion: 'centro', visible: true },
  { id: generarId(), tipo: 'logo', x: 50, y: 8, ancho: 30, alto: 10, visible: true },
  { id: generarId(), tipo: 'texto', valor: 'ESTABLECIMIENTO FAENADOR', x: 50, y: 20, ancho: 96, tamano: 7, negrita: true, alineacion: 'centro', visible: true },
  { id: generarId(), tipo: 'campo_dinamico', campo: 'establecimiento', x: 50, y: 25, ancho: 96, tamano: 7, alineacion: 'centro', visible: true },
  { id: generarId(), tipo: 'texto', valor: 'EST. OFICIAL N°', x: 50, y: 30, ancho: 96, tamano: 6, alineacion: 'centro', visible: true },
  { id: generarId(), tipo: 'campo_dinamico', campo: 'nroEstablecimiento', x: 50, y: 34, ancho: 96, tamano: 6, alineacion: 'centro', visible: true },
  { id: generarId(), tipo: 'texto', valor: 'CUIT:', x: 50, y: 38, ancho: 96, tamano: 6, alineacion: 'centro', visible: true },
  { id: generarId(), tipo: 'campo_dinamico', campo: 'cuit', x: 50, y: 42, ancho: 96, tamano: 6, alineacion: 'centro', visible: true },
  { id: generarId(), tipo: 'separador', x: 50, y: 46, ancho: 90, visible: true },
  { id: generarId(), tipo: 'texto', valor: 'TITULAR DE FAENA:', x: 50, y: 50, ancho: 96, tamano: 6, alineacion: 'centro', visible: true },
  { id: generarId(), tipo: 'campo_dinamico', campo: 'establecimiento', x: 50, y: 54, ancho: 96, tamano: 6, alineacion: 'centro', visible: true },
  { id: generarId(), tipo: 'separador', x: 50, y: 58, ancho: 90, visible: true },
  { id: generarId(), tipo: 'texto', valor: 'CARNE VACUNA CON HUESO ENFRIADA', x: 50, y: 62, ancho: 96, tamano: 7, negrita: true, alineacion: 'centro', visible: true },
  { id: generarId(), tipo: 'texto', valor: 'SENASA N°', x: 50, y: 67, ancho: 96, tamano: 6, alineacion: 'centro', visible: true },
  { id: generarId(), tipo: 'texto', valor: 'INDUSTRIA ARGENTINA', x: 50, y: 71, ancho: 96, tamano: 6, alineacion: 'centro', visible: true },
  { id: generarId(), tipo: 'campo_dinamico', campo: 'nombreProducto', x: 50, y: 77, ancho: 96, tamano: 10, negrita: true, alineacion: 'centro', visible: true },
  { id: generarId(), tipo: 'separador', x: 50, y: 84, ancho: 90, visible: true },
  { id: generarId(), tipo: 'campo_dinamico', campo: 'fechaFaena', etiqueta: 'FECHA DE FAENA:', x: 10, y: 88, ancho: 45, tamano: 6, alineacion: 'izquierda', visible: true },
  { id: generarId(), tipo: 'campo_dinamico', campo: 'tropa', etiqueta: 'TROPA N°:', x: 55, y: 88, ancho: 45, tamano: 6, alineacion: 'izquierda', visible: true },
  { id: generarId(), tipo: 'campo_dinamico', campo: 'garron', etiqueta: 'GARRON N°:', x: 10, y: 92, ancho: 45, tamano: 6, alineacion: 'izquierda', visible: true },
  { id: generarId(), tipo: 'campo_dinamico', campo: 'tipificador', etiqueta: 'TIPIFICADOR:', x: 55, y: 92, ancho: 45, tamano: 6, alineacion: 'izquierda', visible: true },
  { id: generarId(), tipo: 'campo_dinamico', campo: 'peso', etiqueta: 'PESO:', x: 10, y: 96, ancho: 80, tamano: 8, negrita: true, alineacion: 'izquierda', visible: true },
  { id: generarId(), tipo: 'separador', x: 50, y: 100, ancho: 90, visible: true },
  { id: generarId(), tipo: 'texto', valor: 'MANTENER REFRIGERADO A MENOS DE 5°C', x: 50, y: 102, ancho: 96, tamano: 5, alineacion: 'centro', visible: true },
  { id: generarId(), tipo: 'campo_dinamico', campo: 'fechaVencimiento', etiqueta: 'CONSUMIR ANTES DEL:', x: 50, y: 106, ancho: 96, tamano: 5, alineacion: 'centro', visible: true },
]

// POST - Inicializar rótulos por defecto
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    // Verificar si ya existen rótulos
    const existentes = await db.rotulo.count()
    if (existentes > 0) {
      return NextResponse.json({ 
        message: 'Ya existen rótulos en la base de datos',
        total: existentes 
      })
    }

    // Crear rótulos por defecto
    const rotulosDefault = [
      {
        nombre: 'Media Res - Estándar',
        codigo: 'MEDIA_RES',
        tipo: 'MEDIA_RES' as TipoRotulo,
        categoria: 'ENVASE_PRIMARIO',
        ancho: 80,
        alto: 120,
        orientacion: 'vertical',
        elementos: JSON.stringify(crearElementosMediaRes()),
        fuentePrincipal: 'Arial',
        tamanoFuenteBase: 7,
        colorTexto: '#000000',
        incluyeSenasa: true,
        temperaturaMax: 5,
        mensajeConservacion: 'MANTENER REFRIGERADO A MENOS DE 5°C',
        diasConsumo: 30,
        activo: true,
        esDefault: true
      },
      {
        nombre: 'Cuarto - Estándar',
        codigo: 'CUARTO',
        tipo: 'CUARTO' as TipoRotulo,
        categoria: 'ENVASE_PRIMARIO',
        ancho: 70,
        alto: 100,
        orientacion: 'vertical',
        elementos: JSON.stringify([
          { id: generarId(), tipo: 'texto', valor: 'ROTULO DEFINITIVO ENVASE PRIMARIO', x: 50, y: 2, ancho: 96, tamano: 8, negrita: true, alineacion: 'centro', visible: true },
          { id: generarId(), tipo: 'logo', x: 50, y: 8, ancho: 25, alto: 8, visible: true },
          { id: generarId(), tipo: 'texto', valor: 'ESTABLECIMIENTO FAENADOR', x: 50, y: 18, ancho: 96, tamano: 6, negrita: true, alineacion: 'centro', visible: true },
          { id: generarId(), tipo: 'campo_dinamico', campo: 'establecimiento', x: 50, y: 23, ancho: 96, tamano: 6, alineacion: 'centro', visible: true },
          { id: generarId(), tipo: 'separador', x: 50, y: 30, ancho: 90, visible: true },
          { id: generarId(), tipo: 'texto', valor: 'CARNE VACUNA ENFRIADA', x: 50, y: 34, ancho: 96, tamano: 7, negrita: true, alineacion: 'centro', visible: true },
          { id: generarId(), tipo: 'campo_dinamico', campo: 'nombreProducto', x: 50, y: 42, ancho: 96, tamano: 9, negrita: true, alineacion: 'centro', visible: true },
          { id: generarId(), tipo: 'separador', x: 50, y: 50, ancho: 90, visible: true },
          { id: generarId(), tipo: 'campo_dinamico', campo: 'fechaFaena', etiqueta: 'FECHA:', x: 10, y: 55, ancho: 45, tamano: 6, alineacion: 'izquierda', visible: true },
          { id: generarId(), tipo: 'campo_dinamico', campo: 'tropa', etiqueta: 'TROPA:', x: 55, y: 55, ancho: 45, tamano: 6, alineacion: 'izquierda', visible: true },
          { id: generarId(), tipo: 'campo_dinamico', campo: 'garron', etiqueta: 'GARRON:', x: 10, y: 60, ancho: 45, tamano: 6, alineacion: 'izquierda', visible: true },
          { id: generarId(), tipo: 'campo_dinamico', campo: 'peso', etiqueta: 'PESO:', x: 55, y: 60, ancho: 45, tamano: 6, alineacion: 'izquierda', visible: true },
          { id: generarId(), tipo: 'separador', x: 50, y: 68, ancho: 90, visible: true },
          { id: generarId(), tipo: 'texto', valor: 'MANTENER REFRIGERADO A MENOS DE 5°C', x: 50, y: 72, ancho: 96, tamano: 5, alineacion: 'centro', visible: true },
          { id: generarId(), tipo: 'campo_dinamico', campo: 'fechaVencimiento', etiqueta: 'CONSUMIR ANTES DEL:', x: 50, y: 78, ancho: 96, tamano: 5, alineacion: 'centro', visible: true },
        ]),
        fuentePrincipal: 'Arial',
        tamanoFuenteBase: 6,
        colorTexto: '#000000',
        incluyeSenasa: true,
        temperaturaMax: 5,
        mensajeConservacion: 'MANTENER REFRIGERADO A MENOS DE 5°C',
        diasConsumo: 30,
        activo: true,
        esDefault: true
      },
      {
        nombre: 'Menudencia - Estándar',
        codigo: 'MENUDENCIA',
        tipo: 'MENUDENCIA' as TipoRotulo,
        categoria: 'ENVASE_PRIMARIO',
        ancho: 60,
        alto: 80,
        orientacion: 'vertical',
        elementos: JSON.stringify([
          { id: generarId(), tipo: 'logo', x: 50, y: 5, ancho: 20, alto: 10, visible: true },
          { id: generarId(), tipo: 'texto', valor: 'CARNE VACUNA ENFRIADA', x: 50, y: 18, ancho: 96, tamano: 6, negrita: true, alineacion: 'centro', visible: true },
          { id: generarId(), tipo: 'campo_dinamico', campo: 'nombreProducto', x: 50, y: 26, ancho: 96, tamano: 8, negrita: true, alineacion: 'centro', visible: true },
          { id: generarId(), tipo: 'separador', x: 50, y: 35, ancho: 90, visible: true },
          { id: generarId(), tipo: 'campo_dinamico', campo: 'fechaFaena', etiqueta: 'FECHA:', x: 10, y: 40, ancho: 45, tamano: 5, alineacion: 'izquierda', visible: true },
          { id: generarId(), tipo: 'campo_dinamico', campo: 'tropa', etiqueta: 'TROPA:', x: 55, y: 40, ancho: 45, tamano: 5, alineacion: 'izquierda', visible: true },
          { id: generarId(), tipo: 'campo_dinamico', campo: 'peso', etiqueta: 'PESO:', x: 10, y: 48, ancho: 80, tamano: 6, negrita: true, alineacion: 'izquierda', visible: true },
          { id: generarId(), tipo: 'separador', x: 50, y: 58, ancho: 90, visible: true },
          { id: generarId(), tipo: 'texto', valor: 'MANTENER REFRIGERADO', x: 50, y: 62, ancho: 96, tamano: 5, alineacion: 'centro', visible: true },
          { id: generarId(), tipo: 'campo_dinamico', campo: 'fechaVencimiento', etiqueta: 'VTO:', x: 50, y: 68, ancho: 96, tamano: 5, alineacion: 'centro', visible: true },
        ]),
        fuentePrincipal: 'Arial',
        tamanoFuenteBase: 6,
        colorTexto: '#000000',
        incluyeSenasa: true,
        temperaturaMax: 5,
        mensajeConservacion: 'MANTENER REFRIGERADO A MENOS DE 5°C',
        diasConsumo: 30,
        activo: true,
        esDefault: true
      },
    ]

    for (const rotulo of rotulosDefault) {
       
      await db.rotulo.create({ data: { ...rotulo, elementos: undefined, contenido: '' } as any })
    }

    return NextResponse.json({ 
      message: 'Rótulos inicializados correctamente',
      total: rotulosDefault.length 
    })
  } catch (error) {
    console.error('Error al inicializar rótulos:', error)
    return NextResponse.json(
      { error: 'Error al inicializar rótulos' },
      { status: 500 }
    )
  }
}
