/**
 * Seed para crear el rótulo de MEDIA RES para Zebra ZT230
 * TrazaSole v3.7.24
 *
 * Formato: ZPL II (Zebra Programming Language)
 * Tamaño: 100mm ancho × 150mm alto (10cm × 15cm)
 * DPI: 203
 */

import { db } from '../src/lib/db'
import fs from 'fs'
import path from 'path'

async function main() {
  console.log('🔄 Creando rótulo MEDIA RES para Zebra ZT230...')

  // Leer logos GRF
  const logosDir = path.join(process.cwd(), 'public', 'logos')
  
  let logoSolemarGrf = ''
  let logoSenasaGrf = ''
  
  try {
    logoSolemarGrf = fs.readFileSync(path.join(logosDir, 'logo-solemar.grf'), 'utf-8').trim()
    console.log('   Logo Solemar cargado')
  } catch (e) {
    console.log('   ⚠️ Logo Solemar no encontrado, usando placeholder')
    logoSolemarGrf = '100,100,10,' + '0'.repeat(200)
  }
  
  try {
    logoSenasaGrf = fs.readFileSync(path.join(logosDir, 'logo-senasa.grf'), 'utf-8').trim()
    console.log('   Logo SENASA cargado')
  } catch (e) {
    console.log('   ⚠️ Logo SENASA no encontrado, usando placeholder')
    logoSenasaGrf = '100,100,10,' + '0'.repeat(200)
  }

  // Verificar si ya existe
  const existente = await db.rotulo.findFirst({
    where: { tipo: 'MEDIA_RES' }
  })

  // ZPL Template con logos embebidos
  const templateZPL = crearTemplateZPL(logoSolemarGrf, logoSenasaGrf)

  // Variables disponibles en el template
  const variables = JSON.stringify([
    { nombre: 'NOMBRE_CLIENTE', descripcion: 'Nombre del titular de faena' },
    { nombre: 'CUIT_CLIENTE', descripcion: 'CUIT del cliente' },
    { nombre: 'MATRICULA_CLIENTE', descripcion: 'Matrícula del cliente' },
    { nombre: 'FECHA_FAENA', descripcion: 'Fecha de faena (DD/MM/YYYY)' },
    { nombre: 'TROPA', descripcion: 'Número de tropa' },
    { nombre: 'GARRON', descripcion: 'Número de garrón' },
    { nombre: 'LADO', descripcion: 'Lado de la media (DER/IZQ)' },
    { nombre: 'CLASIFICACION', descripcion: 'Clasificación del cuarto (A/T/D)' },
    { nombre: 'KG', descripcion: 'Peso en kilogramos' },
    { nombre: 'VENCIMIENTO', descripcion: 'Fecha de vencimiento (fecha faena + 13 días)' },
    { nombre: 'CODIGO_BARRAS', descripcion: 'Código de barras: TROPA-GARRON-LADO-CLASIF' }
  ])

  if (existente) {
    console.log('⚠️  Ya existe un rótulo MEDIA_RES, actualizando...')
    await db.rotulo.update({
      where: { id: existente.id },
      data: {
        nombre: 'Rótulo Media Res - Zebra ZT230',
        codigo: 'MEDIA_RES_ZT230',
        tipo: 'MEDIA_RES',
        tipoImpresora: 'ZEBRA',
        modeloImpresora: 'ZT230',
        ancho: 100,  // mm
        alto: 150,   // mm
        dpi: 203,
        contenido: templateZPL,
        variables: variables,
        diasConsumo: 13,
        temperaturaMax: 5.0,
        esDefault: true,
        activo: true
      }
    })
    console.log('✅ Rótulo actualizado con logos')
  } else {
    await db.rotulo.create({
      data: {
        nombre: 'Rótulo Media Res - Zebra ZT230',
        codigo: 'MEDIA_RES_ZT230',
        tipo: 'MEDIA_RES',
        tipoImpresora: 'ZEBRA',
        modeloImpresora: 'ZT230',
        ancho: 100,  // mm
        alto: 150,   // mm
        dpi: 203,
        contenido: templateZPL,
        variables: variables,
        diasConsumo: 13,
        temperaturaMax: 5.0,
        esDefault: true,
        activo: true
      }
    })
    console.log('✅ Rótulo creado con logos')
  }
}

function crearTemplateZPL(logoSolemar: string, logoSenasa: string): string {
  // ZPL para Zebra ZT230 - 203 DPI
  // Tamaño: 100mm (4 pulgadas) ancho, alto variable

  return `^XA
^FX Configuracion de etiqueta - TrazaSole v3.7.24
^CI28
^PW800
^LL1150

^FX ============ ENCABEZADO - LOGO SOLEMAR ============
^FO260,15^GFA,${logoSolemar}
^FO40,100^A0N,28,28^FDESTABLECIMIENTO FAENADOR SOLEMAR ALIMENTARIA S.A^FS
^FO200,135^A0N,26,26^FDEST. OFICIAL N 3986^FS
^FO230,170^A0N,24,24^FDCUIT: 30-70919450-6^FS
^FO210,205^A0N,24,24^FDMATRICULA N: 300^FS
^FO50,240^A0N,22,22^FDRUTA NAC. N 22, KM 1043 - CHIMPAY - RIO NEGRO^FS

^FX ============ LINEA SEPARADORA ============
^FO30,280^GB740,3,3^FS

^FX ============ DATOS DEL CLIENTE ============
^FO50,300^A0N,26,26^FDTITULAR DE FAENA: {NOMBRE_CLIENTE}^FS
^FO50,335^A0N,26,26^FDCUIT N: {CUIT_CLIENTE}^FS
^FO50,370^A0N,26,26^FDMATRICULA N: {MATRICULA_CLIENTE}^FS

^FX ============ LINEA SEPARADORA ============
^FO30,410^GB740,3,3^FS

^FX ============ TIPO DE PRODUCTO ============
^FO150,435^A0N,30,30^FDCARNE VACUNA CON HUESO ENFRIADA^FS

^FX ============ LOGO SENASA CON LEYENDA ============
^FO60,480^GFA,${logoSenasa}
^FO160,495^A0N,24,24^FDSENASA N 3986/141334/1^FS
^FO160,525^A0N,24,24^FDINDUSTRIA ARGENTINA^FS

^FX ============ MEDIA RES DESTACADO ============
^FO150,580^GB500,70,50^FS
^FO230,598^A0N,50,50^FDMEDIA RES^FS

^FX ============ LINEA SEPARADORA ============
^FO30,680^GB740,3,3^FS

^FX ============ DATOS VARIABLES ============
^FO50,710^A0N,28,28^FDFECHA FAENA: {FECHA_FAENA}^FS
^FO420,710^A0N,28,28^FDTROPA N: {TROPA}^FS
^FO50,750^A0N,28,28^FDGARRON N: {GARRON} {LADO}^FS
^FO420,750^A0N,28,28^FDCLASIF: {CLASIFICACION}^FS
^FO50,790^A0N,30,30^FDVENTA AL PESO: {KG} KG^FS

^FX ============ MENSAJES INFORMATIVOS ============
^FO100,850^A0N,26,26^FDMANTENER REFRIGERADO A MENOS DE 5C^FS
^FO50,890^A0N,26,26^FDCONSUMIR PREFERENTEMENTE ANTES DEL DIA: {VENCIMIENTO}^FS

^FX ============ LINEA SEPARADORA ============
^FO30,930^GB740,3,3^FS

^FX ============ CODIGO DE BARRAS ============
^FO150,955^BY3,3,80^BCN,80,N,N,N^FD{CODIGO_BARRAS}^FS
^FO180,1045^A0N,26,26^FD{CODIGO_BARRAS}^FS

^FX Fin de etiqueta
^XZ`
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
