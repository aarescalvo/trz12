import { NextRequest, NextResponse } from 'next/server'
import { TipoRotulo } from '@prisma/client'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// POST - Subir archivo ZPL y crear rótulo
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const nombre = formData.get('nombre') as string
    const codigo = formData.get('codigo') as string
    const tipo = formData.get('tipo') as TipoRotulo
    const ancho = parseInt(formData.get('ancho') as string) || 80
    const alto = parseInt(formData.get('alto') as string) || 50
    const diasConsumo = parseInt(formData.get('diasConsumo') as string) || 30

    if (!file || !nombre || !codigo || !tipo) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: file, nombre, codigo, tipo' },
        { status: 400 }
      )
    }

    // Leer contenido del archivo ZPL
    const contenidoZPL = await file.text()

    // Detectar variables en el ZPL (formato {{VARIABLE}} o &VARIABLE&)
    const variablesDetectadas = detectarVariablesZPL(contenidoZPL)

    // Verificar si ya existe un rótulo con el mismo código
    const existente = await db.rotulo.findUnique({
      where: { codigo }
    })

    if (existente) {
      return NextResponse.json(
        { error: 'Ya existe un rótulo con ese código' },
        { status: 400 }
      )
    }

    // Crear el rótulo con plantilla ZPL
    const rotulo = await db.rotulo.create({
      data: {
        nombre,
        codigo,
        tipo,
        ancho,
        alto,
        contenido: contenidoZPL,
        variables: JSON.stringify(variablesDetectadas),
        nombreArchivo: file.name,
        elementos: JSON.stringify([]) as any, // Vacío para plantillas ZPL
        diasConsumo,
        activo: true,
        esDefault: false
      }
    })

    return NextResponse.json({
      ...rotulo,
      variablesDetectadas
    }, { status: 201 })
  } catch (error) {
    console.error('Error al subir ZPL:', error)
    return NextResponse.json(
      { error: 'Error al procesar archivo ZPL' },
      { status: 500 }
    )
  }
}

// Función para detectar variables en el contenido ZPL
function detectarVariablesZPL(contenido: string): Array<{ variable: string; campo: string; descripcion: string }> {
  const variables: Array<{ variable: string; campo: string; descripcion: string }> = []
  
  // Buscar variables en formato {{VARIABLE}} o &VARIABLE&
  const regexDobleLlave = /\{\{([A-Z_0-9]+)\}\}/g
  const regexAmpersand = /&([A-Z_0-9]+)&/g
  
  const encontradas = new Set<string>()
  
  let match
  while ((match = regexDobleLlave.exec(contenido)) !== null) {
    encontradas.add(match[1])
  }
  while ((match = regexAmpersand.exec(contenido)) !== null) {
    encontradas.add(match[1])
  }

  // Mapeo de variables ZPL a campos del sistema
  const mapeoCampos: Record<string, { campo: string; descripcion: string }> = {
    'FECHA': { campo: 'fechaFaena', descripcion: 'Fecha de faena' },
    'FECHA_FAENA': { campo: 'fechaFaena', descripcion: 'Fecha de faena' },
    'FECHA_VENC': { campo: 'fechaVencimiento', descripcion: 'Fecha de vencimiento' },
    'FECHA_VENCIMIENTO': { campo: 'fechaVencimiento', descripcion: 'Fecha de vencimiento' },
    'TROPA': { campo: 'tropa', descripcion: 'Código de tropa' },
    'TROPA_CODIGO': { campo: 'tropa', descripcion: 'Código de tropa' },
    'GARRON': { campo: 'garron', descripcion: 'Número de garrón' },
    'NUMERO_GARRON': { campo: 'garron', descripcion: 'Número de garrón' },
    'PESO': { campo: 'peso', descripcion: 'Peso' },
    'PESO_KG': { campo: 'peso', descripcion: 'Peso en KG' },
    'PRODUCTO': { campo: 'nombreProducto', descripcion: 'Nombre del producto' },
    'NOMBRE_PRODUCTO': { campo: 'nombreProducto', descripcion: 'Nombre del producto' },
    'ESTABLECIMIENTO': { campo: 'establecimiento', descripcion: 'Nombre del establecimiento' },
    'NOMBRE_ESTABLECIMIENTO': { campo: 'establecimiento', descripcion: 'Nombre del establecimiento' },
    'NRO_ESTABLECIMIENTO': { campo: 'nroEstablecimiento', descripcion: 'N° de establecimiento' },
    'NUMERO_ESTABLECIMIENTO': { campo: 'nroEstablecimiento', descripcion: 'N° de establecimiento' },
    'SENASA': { campo: 'nroSenasa', descripcion: 'Número SENASA' },
    'NRO_SENASA': { campo: 'nroSenasa', descripcion: 'Número SENASA' },
    'PRODUTOR': { campo: 'nombreProductor', descripcion: 'Nombre del productor' },
    'NOMBRE_PRODUCTOR': { campo: 'nombreProductor', descripcion: 'Nombre del productor' },
    'USUARIO_FAENA': { campo: 'nombreUsuarioFaena', descripcion: 'Usuario de faena' },
    'NOMBRE_USUARIO_FAENA': { campo: 'nombreUsuarioFaena', descripcion: 'Usuario de faena' },
    'CUIT_PRODUCTOR': { campo: 'cuitProductor', descripcion: 'CUIT del productor' },
    'CUIT_USUARIO': { campo: 'cuitUsuarioFaena', descripcion: 'CUIT del usuario' },
    'MATRICULA': { campo: 'matriculaUsuarioFaena', descripcion: 'Matrícula' },
    'ESPECIE': { campo: 'especie', descripcion: 'Especie animal' },
    'TIPO_ANIMAL': { campo: 'tipoAnimal', descripcion: 'Tipo de animal' },
    'CODIGO_BARRAS': { campo: 'codigoBarras', descripcion: 'Código de barras' },
    'BARRAS': { campo: 'codigoBarras', descripcion: 'Código de barras' },
    'LOTE': { campo: 'lote', descripcion: 'Número de lote' },
    'CORRELATIVO': { campo: 'correlativo', descripcion: 'Número correlativo' },
    'DIA_CONSUMO': { campo: 'diasConsumo', descripcion: 'Días de consumo' },
    'DIAS_CONSUMO': { campo: 'diasConsumo', descripcion: 'Días de consumo' },
    'TEMPERATURA': { campo: 'temperaturaMax', descripcion: 'Temperatura máxima' },
    'TEMP_MAX': { campo: 'temperaturaMax', descripcion: 'Temperatura máxima' },
    'LADO': { campo: 'ladoMedia', descripcion: 'Lado de la media' },
    'SIGLA': { campo: 'siglaMedia', descripcion: 'Sigla de la media' },
  }

  encontradas.forEach(variable => {
    const mapeo = mapeoCampos[variable] || { campo: variable.toLowerCase(), descripcion: variable }
    variables.push({
      variable: `{{${variable}}}`,
      campo: mapeo.campo,
      descripcion: mapeo.descripcion
    })
  })

  return variables
}
