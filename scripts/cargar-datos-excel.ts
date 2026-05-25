import * as XLSX from 'xlsx'
import { db } from '../src/lib/db'

const excelPath = '/home/z/my-project/upload/SERVICIO FAENA BOVINO 2026.xlsx'

// Mapeo de usuarios del Excel a nombres de clientes
const USUARIOS_MAP: Record<string, string> = {
  'AGUSTIN BARRIONUEVO': 'Agustín Barrionuevo',
  'LA AZUL SELECCION': 'La Azul Selección',
  'FRIGORIFICO REGIONAL SA': 'Frigorífico Regional SA',
  'PABELLON SA': 'Pabellón SA',
  'FRIGORIFICO REGIONAL': 'Frigorífico Regional',
  'MIRIAN ACOSTA': 'Mirian Acosta',
  'ALBERTO GONZALEZ': 'Alberto González',
  'GUSTAVO ADOLFO DIAZ': 'Gustavo Adolfo Díaz',
  'FRIGORIFICO GELA SA': 'Frigorífico Gela SA',
  'MARIO GONZALEZ': 'Mario González',
  'SILVINA DIAZ': 'Silvina Díaz',
  'CARNICERIA DON JOSE': 'Carnicería Don José',
  'SUPERMERCADOS DEL VALLE': 'Supermercados del Valle',
  'FRIGORIFICO NORTE': 'Frigorífico Norte',
  'LA TRADICION': 'La Tradición',
  'MATADERO MUNICIPAL': 'Matadero Municipal',
  'FRIGORIFICO CENTRAL': 'Frigorífico Central',
  'CARNES DEL SUR': 'Carnes del Sur',
  'EL PROGRESO': 'El Progreso',
  'FRIGORIFICO MODELO': 'Frigorífico Modelo',
}

async function cargarDatos() {
  console.log('=== CARGANDO DATOS DEL EXCEL ===\n')
  
  // Leer Excel
  const workbook = XLSX.readFile(excelPath)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const data: any[] = XLSX.utils.sheet_to_json(sheet)
  
  console.log(`Total registros en Excel: ${data.length}`)
  
  // Crear clientes únicos
  const clientesUnicos = new Set<string>()
  data.forEach(row => {
    const usuario = row['USUARIO FAENA']
    if (usuario) clientesUnicos.add(usuario)
  })
  
  console.log(`Clientes únicos encontrados: ${clientesUnicos.size}`)
  
  // Crear clientes en la BD
  for (const clienteNombre of clientesUnicos) {
    const nombreLimpio = USUARIOS_MAP[clienteNombre] || clienteNombre
    try {
      await db.cliente.upsert({
        where: { nombre: nombreLimpio },
        create: {
          nombre: nombreLimpio,
          esUsuarioFaena: true,
        },
        update: {}
      })
    } catch (e) {
      console.log(`Cliente ya existe: ${nombreLimpio}`)
    }
  }
  
  // Obtener clientes de BD
  const clientes = await db.cliente.findMany()
  const clientesMap = new Map(clientes.map(c => [c.nombre, c.id]))
  
  // Agrupar por tropa
  const tropasMap = new Map<string, any[]>()
  data.forEach(row => {
    const tropaStr = row['TROPA']
    if (tropaStr) {
      if (!tropasMap.has(tropaStr)) tropasMap.set(tropaStr, [])
      tropasMap.get(tropaStr)!.push(row)
    }
  })
  
  console.log(`Tropas únicas: ${tropasMap.size}`)
  
  // Limpiar datos existentes
  await db.animal.deleteMany({})
  await db.tropa.deleteMany({})
  console.log('Datos anteriores eliminados')
  
  // Crear tropas y animales
  let tropaNumero = 1
  let animalTotal = 0
  
  for (const [tropaStr, animales] of tropasMap) {
    const primerAnimal = animales[0]
    const usuarioFaena = primerAnimal['USUARIO FAENA']
    const nombreCliente = USUARIOS_MAP[usuarioFaena] || usuarioFaena
    const clienteId = clientesMap.get(nombreCliente)
    
    if (!clienteId) {
      console.log(`Cliente no encontrado: ${nombreCliente}`)
      continue
    }
    
    // Crear tropa
    const tropa = await db.tropa.create({
      data: {
        numero: tropaNumero,
        codigo: `B 2026 ${String(tropaNumero).padStart(4, '0')}`,
        codigoSimplificado: `B${String(tropaNumero).padStart(4, '0')}`,
        usuarioFaenaId: clienteId,
        especie: 'BOVINO',
        dte: `DTE-${tropaNumero}`,
        guia: `GUIA-${tropaNumero}`,
        cantidadCabezas: animales.length,
        estado: 'FAENADO',
        fechaRecepcion: new Date(2026, 0, 1 + Math.floor(tropaNumero / 3)),
      }
    })
    
    // Crear animales
    for (let i = 0; i < animales.length; i++) {
      const animalData = animales[i]
      const peso = parseFloat(animalData['PESO']) || 0
      
      await db.animal.create({
        data: {
          tropaId: tropa.id,
          numero: i + 1,
          codigo: `${tropa.codigo}-${String(i + 1).padStart(3, '0')}`,
          tipoAnimal: 'NO', // Novillo por defecto
          pesoVivo: peso,
          estado: 'FAENADO',
        }
      })
      animalTotal++
    }
    
    tropaNumero++
  }
  
  console.log(`\n=== DATOS CARGADOS ===`)
  console.log(`Tropas creadas: ${tropaNumero - 1}`)
  console.log(`Animales creados: ${animalTotal}`)
  
  // Verificar
  const finalTropas = await db.tropa.count()
  const finalAnimales = await db.animal.count()
  const finalClientes = await db.cliente.count()
  
  console.log(`\n=== VERIFICACIÓN ===`)
  console.log(`Tropas en BD: ${finalTropas}`)
  console.log(`Animales en BD: ${finalAnimales}`)
  console.log(`Clientes en BD: ${finalClientes}`)
}

cargarDatos().catch(console.error)
