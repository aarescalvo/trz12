import { NextRequest, NextResponse } from 'next/server'

// Configuración de códigos de barras EAN-128 por defecto
const CONFIG_CODIGOS = [
  { 
    id: '1', 
    tipo: 'Media Res', 
    prefijo: 'MR', 
    formato: 'MR-TROPA-GARRON-LADO-FECHA',
    descripcion: 'Código para media res individual'
  },
  { 
    id: '2', 
    tipo: 'Cuarto', 
    prefijo: 'CD', 
    formato: 'CD-TROPA-GARRON-TIPO',
    descripcion: 'Código para cuarto delantero/trasero'
  },
  { 
    id: '3', 
    tipo: 'Producto', 
    prefijo: 'PR', 
    formato: 'PR-CODIGO-LOTE-FECHA',
    descripcion: 'Código para producto terminado'
  },
  { 
    id: '4', 
    tipo: 'Caja', 
    prefijo: 'CJ', 
    formato: 'CJ-CODIGO-PESO-NUM',
    descripcion: 'Código para caja de producto'
  },
  { 
    id: '5', 
    tipo: 'Subproducto', 
    prefijo: 'SB', 
    formato: 'SB-CODIGO-FECHA',
    descripcion: 'Código para subproductos'
  },
  { 
    id: '6', 
    tipo: 'Menudencia', 
    prefijo: 'MN', 
    formato: 'MN-CODIGO-BOLSA-FECHA',
    descripcion: 'Código para menudencias'
  },
]

// GET - Listar configuración de códigos
export async function GET() {
  try {
    return NextResponse.json({ 
      success: true, 
      data: CONFIG_CODIGOS 
    })
  } catch (error) {
    console.error('Error fetching códigos:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error al obtener códigos' 
    }, { status: 500 })
  }
}

// POST - Generar código de barras
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { tipo, valores } = data
    
    const config = CONFIG_CODIGOS.find(c => c.tipo === tipo)
    if (!config) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tipo de código no encontrado' 
      }, { status: 400 })
    }
    
    // Reemplazar variables en el formato
    let codigo = config.formato
    const fecha = new Date().toISOString().split('T')[0].replace(/-/g, '')
    
    if (valores) {
      Object.keys(valores).forEach(key => {
        codigo = codigo.replace(key.toUpperCase(), String(valores[key]))
      })
    }
    
    // Reemplazar fecha si no se proporcionó
    codigo = codigo.replace('FECHA', fecha)
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        codigo,
        prefijo: config.prefijo,
        formato: config.formato 
      } 
    })
  } catch (error) {
    console.error('Error generating código:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error al generar código' 
    }, { status: 500 })
  }
}
