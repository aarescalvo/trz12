import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/auth-helpers'

// POST - Procesar ZPL con datos dinámicos para impresión
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const data = await request.json()
    const { rotuloId, datos } = data

    if (!rotuloId) {
      return NextResponse.json(
        { error: 'ID de rótulo requerido' },
        { status: 400 }
      )
    }

    // Obtener el rótulo
    const rotulo = await db.rotulo.findUnique({
      where: { id: rotuloId }
    })

    if (!rotulo) {
      return NextResponse.json(
        { error: 'Rótulo no encontrado' },
        { status: 404 }
      )
    }

    if (rotulo.tipoImpresora !== 'ZEBRA' || !rotulo.contenido) {
      return NextResponse.json(
        { error: 'El rótulo no es de tipo ZPL o no tiene contenido' },
        { status: 400 }
      )
    }

    // Procesar el ZPL reemplazando las variables
    const zplProcesado = procesarZPL(rotulo.contenido, datos, rotulo.variables)

    return NextResponse.json({
      zpl: zplProcesado,
      rotulo: {
        id: rotulo.id,
        nombre: rotulo.nombre,
        codigo: rotulo.codigo
      }
    })
  } catch (error) {
    console.error('Error al procesar ZPL:', error)
    return NextResponse.json(
      { error: 'Error al procesar ZPL' },
      { status: 500 }
    )
  }
}

// GET - Procesar ZPL con datos de prueba (preview)
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const rotuloId = searchParams.get('rotuloId')

    if (!rotuloId) {
      return NextResponse.json(
        { error: 'ID de rótulo requerido' },
        { status: 400 }
      )
    }

    // Obtener el rótulo
    const rotulo = await db.rotulo.findUnique({
      where: { id: rotuloId }
    })

    if (!rotulo) {
      return NextResponse.json(
        { error: 'Rótulo no encontrado' },
        { status: 404 }
      )
    }

    if (rotulo.tipoImpresora !== 'ZEBRA' || !rotulo.contenido) {
      return NextResponse.json(
        { error: 'El rótulo no es de tipo ZPL o no tiene contenido' },
        { status: 400 }
      )
    }

    // Datos de prueba para preview
    const datosPrueba = generarDatosPrueba()
    
    // Procesar el ZPL con datos de prueba
    const zplProcesado = procesarZPL(rotulo.contenido, datosPrueba, rotulo.variables)

    // Obtener variables detectadas
    const variablesDetectadas = rotulo.variables ? JSON.parse(rotulo.variables) : []

    return NextResponse.json({
      zpl: zplProcesado,
      zplOriginal: rotulo.contenido,
      variables: variablesDetectadas,
      rotulo: {
        id: rotulo.id,
        nombre: rotulo.nombre,
        codigo: rotulo.codigo,
        ancho: rotulo.ancho,
        alto: rotulo.alto
      }
    })
  } catch (error) {
    console.error('Error al obtener preview ZPL:', error)
    return NextResponse.json(
      { error: 'Error al obtener preview ZPL' },
      { status: 500 }
    )
  }
}

// Función para procesar ZPL y reemplazar variables
function procesarZPL(zpl: string, datos: Record<string, any>, camposZPL: string | null): string {
  let resultado = zpl

  // Parsear los campos mapeados si existen
  const mapeoVariables: Record<string, string> = {}
  if (camposZPL) {
    try {
      const campos = JSON.parse(camposZPL)
      campos.forEach((c: { variable: string; campo: string }) => {
        mapeoVariables[c.variable] = c.campo
      })
    } catch (e) {
      console.error('Error al parsear camposZPL:', e)
    }
  }

  // Reemplazar variables en formato {{VARIABLE}} o &VARIABLE&
  const regexDobleLlave = /\{\{([A-Z_0-9]+)\}\}/g
  const regexAmpersand = /&([A-Z_0-9]+)&/g

  // Reemplazar con formato {{VARIABLE}}
  resultado = resultado.replace(regexDobleLlave, (match, variable) => {
    const campo = mapeoVariables[match] || variable.toLowerCase()
    const valor = datos[campo] ?? datos[variable.toLowerCase()] ?? `[${variable}]`
    return String(valor)
  })

  // Reemplazar con formato &VARIABLE&
  resultado = resultado.replace(regexAmpersand, (match, variable) => {
    const campo = mapeoVariables[`{{${variable}}}`] || variable.toLowerCase()
    const valor = datos[campo] ?? datos[variable.toLowerCase()] ?? `[${variable}]`
    return String(valor)
  })

  return resultado
}

// Generar datos de prueba para preview
function generarDatosPrueba(): Record<string, any> {
  const hoy = new Date()
  const fechaVenc = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)
  
  return {
    fechaFaena: formatearFecha(hoy),
    fechaVencimiento: formatearFecha(fechaVenc),
    tropa: 'B0001',
    garron: '001',
    peso: '125.50',
    nombreProducto: 'MEDIA RES',
    establecimiento: 'FRIGORÍFICO EJEMPLO S.A.',
    nroEstablecimiento: '3986',
    nroSenasa: '3986',
    nombreProductor: 'PRODUCTOR EJEMPLO',
    nombreUsuarioFaena: 'USUARIO FAENA EJEMPLO',
    cuitProductor: '20-12345678-9',
    cuitUsuarioFaena: '30-87654321-0',
    matriculaUsuarioFaena: 'MAT-001',
    especie: 'BOVINO',
    tipoAnimal: 'VA',
    codigoBarras: '123456789012',
    lote: 'L2026001',
    correlativo: '0001',
    diasConsumo: '30',
    temperaturaMax: '5°C',
    ladoMedia: 'I',
    siglaMedia: 'A'
  }
}

function formatearFecha(fecha: Date): string {
  const dia = String(fecha.getDate()).padStart(2, '0')
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const anio = fecha.getFullYear()
  return `${dia}/${mes}/${anio}`
}
