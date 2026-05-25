import { PrismaClient, Especie, EstadoTropa, EstadoPago } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// Mapeo de nombres del Excel de servicio a nombres del archivo CUIT
const MAPEO_USUARIOS: Record<string, string> = {
  'MORAGA': 'MORAGA MAXIMILIANO IVAN',
  'GANADERA NORTE NEUQUINO': 'GANADERA NORTE NEUQUINO SAS',
  'DOS DE FIERRO SA': 'DOS DE FIERRO SA',
  'DISTRIBUIDORA DE LA PATAGONIA': 'DISTRIBUIDORA DE LA PATAGONIA SRL',
  'MUCA SAS': 'MUCA SAS',
  'FERREYRA MARTIN': 'FERREYRA MARTIN RUBEN',
  'FRIGORIFICO DE LA PATAGONIA SRL': 'FRIGORIFICO DE LA PATAGONIA SRL',
  'LASAGNO JORGE ALBERTO': 'JORGE ALBERTO LASAGNO',
  'FERREYRA ALBERTO': 'FERREYRA RUBEN ALBERTO',
  'BOSQUES AMADOS SRL': 'BOSQUE AMADO S.R.L',
  'MAIZALES DE LA PATAGONIA SRL': 'MAIZALES DE LA PATAGONIA S.R.L',
};

// Función auxiliar para validar fechas
function parseDate(value: any): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

interface ClienteCUIT {
  titular: string;
  cuit: string;
  mail: string;
  nombre: string;
  celular: string;
}

interface TropaServicio {
  numero: number;
  usuario: string;
  cantidadAnimales: number;
  kgPie: number;
  fechaFaena: Date;
  kgGancho: number;
  rinde: number;
  precioServicioSinRecupero: number;
  precioServicioConRecupero: number | null;
  totalServicioIva: number;
  tasaInspVet: number;
  arancelIpcva: number;
  totalFactura: number;
  numeroFactura: string | null;
  fechaFactura: Date | null;
  fechaPago: Date | null;
  montoDepositado: number | null;
  estadoPago: string | null;
  observaciones: string | null;
}

async function main() {
  console.log('Iniciando carga de datos completos...');

  // ===== 1. LEER ARCHIVO CUIT =====
  console.log('\n📖 Leyendo archivo CUIT DE USUARIOS + DATOS.xlsx...');
  const cuitPath = path.join(process.cwd(), 'upload/CUIT DE USUARIOS + DATOS.xlsx');
  const cuitWorkbook = XLSX.readFile(cuitPath);
  const cuitSheet = cuitWorkbook.Sheets[cuitWorkbook.SheetNames[0]];
  const cuitData: ClienteCUIT[] = XLSX.utils.sheet_to_json(cuitSheet, {
    header: ['titular', 'cuit', 'mail', 'nombre', 'celular'],
    range: 1, // Saltar header
  });

  console.log(`   Encontrados ${cuitData.length} clientes en archivo CUIT`);

  // ===== 2. LEER ARCHIVO SERVICIO FAENA =====
  console.log('\n📖 Leyendo archivo SERVICIO FAENA BOVINO 2026.xlsx...');
  const faenaPath = path.join(process.cwd(), 'upload/SERVICIO FAENA BOVINO 2026.xlsx');
  const faenaWorkbook = XLSX.readFile(faenaPath);
  const faenaSheet = faenaWorkbook.Sheets['SERVICIO FAENA'];
  const faenaRaw = XLSX.utils.sheet_to_json(faenaSheet);

  // Filtrar y mapear tropas válidas
  const tropas: TropaServicio[] = faenaRaw
    .filter((row: any) => row['Nº TROPA'] !== undefined && row['Nº TROPA'] !== null)
    .map((row: any) => ({
      numero: parseInt(row['Nº TROPA']),
      usuario: row['USUARIO']?.toString().trim(),
      cantidadAnimales: parseInt(row['CANTIDAD DE  ANIMALES']) || 0,
      kgPie: parseFloat(row['KG PIE']) || 0,
      fechaFaena: parseDate(row['FECHA FAENA']) || new Date('2026-01-01'),
      kgGancho: parseFloat(row['KG GANCHO']) || 0,
      rinde: parseFloat(row['RINDE %']) || 0,
      precioServicioSinRecupero: parseFloat(row['$/kg\nSERVICIO S/RECUPERO']) || 0,
      precioServicioConRecupero: row['$/KG\nSERV. C/RECUPERO'] ? parseFloat(row['$/KG\nSERV. C/RECUPERO']) : null,
      totalServicioIva: parseFloat(row['TOTAL $\nX SERV.\n+ 21% IVA']) || 0,
      tasaInspVet: parseFloat(row['TASA \nINSP. VET.\n(X CAB.)']) || 0,
      arancelIpcva: parseFloat(row['ARANCEL\nIPCVA \n(X CAB.)']) || 0,
      totalFactura: parseFloat(row['TOTAL $\nFACTURA C/IMP.']) || 0,
      numeroFactura: row['Nº FACTURA']?.toString() || null,
      fechaFactura: parseDate(row['FECHA \nFACTURA']),
      fechaPago: parseDate(row['FECHA \nPAGO']),
      montoDepositado: row['MONTO\nDEPOSITADO'] ? parseFloat(row['MONTO\nDEPOSITADO']) : null,
      estadoPago: row['ESTADO\n PAG.']?.toString() || null,
      observaciones: row['OBSERVACIONES']?.toString() || null,
    }));

  console.log(`   Encontradas ${tropas.length} tropas válidas`);

  // ===== 3. CREAR/ACTUALIZAR CLIENTES =====
  console.log('\n👥 Actualizando clientes con emails y teléfonos...');
  
  // Crear mapa de clientes CUIT por nombre normalizado
  const clientesCuitMap = new Map<string, ClienteCUIT>();
  for (const c of cuitData) {
    const nombreNormalizado = c.titular.trim().toUpperCase();
    clientesCuitMap.set(nombreNormalizado, c);
  }

  // Obtener usuarios únicos de las tropas
  const usuariosUnicos = [...new Set(tropas.map(t => t.usuario))];
  console.log(`   Usuarios únicos en tropas: ${usuariosUnicos.length}`);

  for (const usuario of usuariosUnicos) {
    if (!usuario) continue;
    
    // Buscar nombre mapeado
    const nombreMapeado = MAPEO_USUARIOS[usuario] || usuario;
    const clienteCuit = clientesCuitMap.get(nombreMapeado.toUpperCase());
    
    // Preparar datos del cliente
    const datosCliente: any = {
      nombre: nombreMapeado,
      esUsuarioFaena: true,
    };

    if (clienteCuit) {
      datosCliente.cuit = String(clienteCuit.cuit);
      datosCliente.email = clienteCuit.mail?.split(/[;\n]/)[0]?.trim() || null;
      datosCliente.telefono = clienteCuit.celular?.trim() || null;
    }

    // Crear o actualizar cliente
    const clienteExistente = await prisma.cliente.findFirst({
      where: { nombre: nombreMapeado }
    });

    if (clienteExistente) {
      await prisma.cliente.update({
        where: { id: clienteExistente.id },
        data: datosCliente,
      });
      console.log(`   ✓ Actualizado: ${nombreMapeado}`);
    } else {
      await prisma.cliente.create({
        data: datosCliente,
      });
      console.log(`   ✓ Creado: ${nombreMapeado}`);
    }
  }

  // ===== 4. CARGAR TROPAS =====
  console.log('\n📋 Cargando tropas históricas...');

  let tropasCreadas = 0;
  let tropasActualizadas = 0;
  let animalesCreados = 0;

  for (const tropa of tropas) {
    // Buscar cliente/usuario faena
    const nombreMapeado = MAPEO_USUARIOS[tropa.usuario] || tropa.usuario;
    const cliente = await prisma.cliente.findFirst({
      where: { nombre: nombreMapeado }
    });

    if (!cliente) {
      console.log(`   ⚠ Cliente no encontrado: ${nombreMapeado}`);
      continue;
    }

    // Verificar si la tropa ya existe
    const tropaExistente = await prisma.tropa.findUnique({
      where: { numero: tropa.numero }
    });

    const codigo = `B 2026 ${String(tropa.numero).padStart(4, '0')}`;
    
    // Mapear estado de pago
    let estadoPagoMapeado: string = 'PENDIENTE';
    if (tropa.estadoPago) {
      if (tropa.estadoPago.includes('PAG') || tropa.montoDepositado > 0) {
        estadoPagoMapeado = 'PAGADO';
      } else if (tropa.estadoPago.includes('PARC')) {
        estadoPagoMapeado = 'PARCIAL';
      }
    }

    const datosTropa = {
      codigo,
      usuarioFaenaId: cliente.id,
      especie: Especie.BOVINO,
      cantidadCabezas: tropa.cantidadAnimales,
      kgPie: tropa.kgPie,
      kgGancho: tropa.kgGancho,
      rindePorcentaje: tropa.rinde * 100,
      fechaFaena: tropa.fechaFaena,
      precioServicioPorKg: tropa.precioServicioSinRecupero,
      precioServicioConRecupero: tropa.precioServicioConRecupero,
      totalServicio: tropa.totalServicioIva,
      tasaInspVet: tropa.tasaInspVet,
      arancelIpcva: tropa.arancelIpcva,
      totalFactura: tropa.totalFactura,
      numeroFactura: tropa.numeroFactura,
      fechaFactura: tropa.fechaFactura,
      fechaPago: tropa.fechaPago,
      montoDepositado: tropa.montoDepositado,
      estadoPago: estadoPagoMapeado,
      observaciones: tropa.observaciones,
      estado: EstadoTropa.FAENADO,
    };

    if (tropaExistente) {
      // Actualizar tropa existente
      await prisma.tropa.update({
        where: { id: tropaExistente.id },
        data: datosTropa,
      });
      tropasActualizadas++;
    } else {
      // Crear nueva tropa
      const nuevaTropa = await prisma.tropa.create({
        data: {
          numero: tropa.numero,
          ...datosTropa,
        },
      });

      // Crear animales para esta tropa
      for (let i = 1; i <= tropa.cantidadAnimales; i++) {
        const pesoPromedio = tropa.kgPie / tropa.cantidadAnimales;
        
        await prisma.animal.create({
          data: {
            tropaId: nuevaTropa.id,
            numero: i,
            codigo: `${codigo.replace(/ /g, '')}-${String(i).padStart(3, '0')}`,
            tipoAnimal: 'NO', // Default a Novillo
            pesoVivo: pesoPromedio,
            estado: 'FAENADO',
          },
        });
        animalesCreados++;
      }
      
      tropasCreadas++;
    }

    if ((tropasCreadas + tropasActualizadas) % 20 === 0) {
      console.log(`   Procesadas ${tropasCreadas + tropasActualizadas} tropas...`);
    }
  }

  // ===== 5. RESUMEN FINAL =====
  console.log('\n✅ Carga completada!');
  console.log('========================================');
  console.log(`Tropas creadas: ${tropasCreadas}`);
  console.log(`Tropas actualizadas: ${tropasActualizadas}`);
  console.log(`Animales creados: ${animalesCreados}`);
  
  // Contar totales en BD
  const totalTropas = await prisma.tropa.count();
  const totalAnimales = await prisma.animal.count();
  const totalClientes = await prisma.cliente.count();
  
  console.log('\n📊 Totales en base de datos:');
  console.log(`   Tropas: ${totalTropas}`);
  console.log(`   Animales: ${totalAnimales}`);
  console.log(`   Clientes: ${totalClientes}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
