import * as XLSX from 'xlsx'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const file = '/home/z/my-project/upload/RINDE FAENA BOVINO - copia.xlsx'

function parseExcelDate(excelDate: number): Date {
  return new Date(new Date(1899, 11, 30).getTime() + excelDate * 86400000)
}

const TIPO_MAP: Record<string, string> = {
  'NT': 'NT', 'VQ': 'VQ', 'MEJ': 'MEJ', 'NO': 'NO', 'VA': 'VA', 'TO': 'TO',
  'Vq': 'VQ', 'Va': 'VA', 'No': 'NO', 'To': 'TO',
}

async function main() {
  console.log('=== CARGANDO DATOS ===')
  
  const wb = XLSX.readFile(file)
  const hojas = wb.SheetNames.filter(n => /^T \d+/.test(n))
  
  console.log(`Total hojas: ${hojas.length}`)
  
  // Limpiar
  console.log('Limpiando...')
  await prisma.$executeRaw`DELETE FROM MediaRes`
  await prisma.$executeRaw`DELETE FROM Romaneo`
  await prisma.$executeRaw`DELETE FROM AsignacionGarron`
  await prisma.$executeRaw`DELETE FROM PesajeIndividual`
  await prisma.$executeRaw`DELETE FROM Animal`
  await prisma.$executeRaw`DELETE FROM ListaFaenaTropa`
  await prisma.$executeRaw`DELETE FROM ListaFaena`
  await prisma.$executeRaw`DELETE FROM Tropa`
  await prisma.$executeRaw`DELETE FROM Cliente`
  
  const clientes: Map<string, string> = new Map()
  let tropas = 0, animales = 0, romaneos = 0
  
  for (const hoja of hojas) {
    try {
      const data: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[hoja], { header: 1 })
      
      // Detectar estructura
      const esEstructuraNueva = data[7]?.[1]?.toString().includes('Usuario')
      
      let tropaNum: number, cant: number, matarife: string, fechaExcel: number
      let pesoVivoTotal: number, dte: string, guia: string
      
      if (esEstructuraNueva) {
        // Estructura nueva (T 18+)
        tropaNum = data[12]?.[3]
        cant = data[13]?.[3] || 0
        matarife = String(data[7]?.[3] || 'Desconocido')
        fechaExcel = data[11]?.[3]
        pesoVivoTotal = data[14]?.[3] || 0
        dte = String(data[8]?.[8] || '')
        guia = String(data[8]?.[10] || '')
      } else {
        // Estructura original (T 01-17)
        tropaNum = data[5]?.[5]
        cant = data[6]?.[5] || 0
        matarife = String(data[6]?.[8] || 'Desconocido')
        fechaExcel = data[4]?.[5]
        pesoVivoTotal = data[2]?.[5] || 0
        dte = String(data[7]?.[8] || '')
        guia = `GUIA-${tropaNum}`
      }
      
      if (!tropaNum) continue
      
      const fecha = fechaExcel ? parseExcelDate(fechaExcel) : new Date()
      const codigo = `B 2026 ${String(tropaNum).padStart(4, '0')}`
      
      // Cliente
      let clienteId = clientes.get(matarife)
      if (!clienteId) {
        const c = await prisma.cliente.create({ data: { nombre: matarife, esUsuarioFaena: true } })
        clienteId = c.id
        clientes.set(matarife, clienteId)
      }
      
      // Tropa
      const tropa = await prisma.tropa.create({
        data: {
          numero: tropaNum, codigo, codigoSimplificado: `B${String(tropaNum).padStart(4, '0')}`,
          usuarioFaenaId: clienteId, especie: 'BOVINO',
          dte: dte || `DTE-${tropaNum}`, guia: guia || `GUIA-${tropaNum}`,
          cantidadCabezas: cant, estado: 'FAENADO',
          pesoTotalIndividual: pesoVivoTotal, fechaRecepcion: fecha,
        }
      })
      tropas++
      
      // Animales - buscar fila de encabezados
      let filaEncabezado = -1
      for (let i = 0; i < 20; i++) {
        if (data[i]?.[1]?.toString().includes('GARRON')) {
          filaEncabezado = i
          break
        }
      }
      
      if (filaEncabezado >= 0) {
        // Procesar animales
        for (let i = filaEncabezado + 1; i < filaEncabezado + 1 + cant && i < data.length; i++) {
          const r = data[i]
          if (!r?.[1]) continue
          
          const garron = r[1], num = r[2], raza = String(r[3] || ''), tipo = String(r[4] || '')
          const caravana = String(r[5] || ''), pv = r[6] || 0
          const pA = r[7] || 0, pB = r[8] || 0, pt = r[9] || 0, ri = r[10] || 0
          
          const t = TIPO_MAP[tipo.match(/\w+/)?.[0] || 'NO'] || 'NO'
          
          await prisma.animal.create({
            data: {
              tropaId: tropa.id, numero: num || (i - filaEncabezado),
              codigo: `${codigo}-${String(num || (i - filaEncabezado)).padStart(3, '0')}`,
              caravana, tipoAnimal: t as any, raza, pesoVivo: pv, estado: 'FAENADO'
            }
          })
          animales++
          
          if (pt > 0) {
            await prisma.romaneo.create({
              data: {
                garron, tropaCodigo: codigo, numeroAnimal: num || (i - filaEncabezado),
                tipoAnimal: t as any, raza, pesoVivo: pv,
                pesoMediaIzq: pA, pesoMediaDer: pB, pesoTotal: pt,
                rinde: ri * 100, estado: 'CONFIRMADO', fecha
              }
            })
            romaneos++
          }
        }
      }
      
      if (tropas % 20 === 0) console.log(`Procesadas ${tropas} tropas...`)
      
    } catch (err) {
      console.error(`Error en hoja ${hoja}:`, err)
    }
  }
  
  console.log(`\n=== CARGADOS ===`)
  console.log(`Tropas: ${tropas}`)
  console.log(`Animales: ${animales}`)
  console.log(`Romaneos: ${romaneos}`)
  console.log(`Clientes: ${clientes.size}`)
}

main().catch(e => {
  console.error('ERROR:', e)
}).finally(() => prisma.$disconnect())
