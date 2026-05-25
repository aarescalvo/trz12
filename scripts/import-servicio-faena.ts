import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('=== IMPORTANDO SERVICIO FAENA BOVINO 2026 ===\n');
  
  const filePath = path.join(process.cwd(), 'upload/SERVICIO FAENA BOVINO 2026.xlsx');
  const workbook = XLSX.readFile(filePath);
  
  // Leer hoja SERVICIO FAENA
  const sheet = workbook.Sheets['SERVICIO FAENA'];
  const data = XLSX.utils.sheet_to_json(sheet) as any[];
  
  console.log(`Total filas en Excel: ${data.length}`);
  
  // Estadísticas
  let actualizadas = 0;
  let creadas = 0;
  let errores = 0;
  let clientesCreados = 0;
  
  // Mapeo de nombres de usuario a IDs de cliente
  const clienteMap = new Map<string, string>();
  
  // Obtener clientes existentes
  const clientes = await prisma.cliente.findMany();
  for (const c of clientes) {
    clienteMap.set(c.nombre.toUpperCase(), c.id);
    // También guardar sin puntos ni espacios
    const nombreLimpio = c.nombre.toUpperCase().replace(/[.\s]/g, '');
    clienteMap.set(nombreLimpio, c.id);
  }
  
  console.log(`Clientes en BD: ${clientes.length}`);
  
  for (const row of data) {
    const tropaNum = parseInt(row['Nº TROPA']);
    if (!tropaNum || tropaNum === 0) continue;
    
    const usuario = row['USUARIO'];
    if (!usuario) continue;
    
    try {
      // Buscar o crear cliente
      let clienteId = clienteMap.get(usuario.toUpperCase());
      if (!clienteId) {
        const nombreLimpio = usuario.toUpperCase().replace(/[.\s]/g, '');
        clienteId = clienteMap.get(nombreLimpio);
      }
      
      if (!clienteId) {
        // Crear cliente nuevo
        const nuevoCliente = await prisma.cliente.create({
          data: {
            nombre: usuario.toUpperCase(),
            esUsuarioFaena: true,
          }
        });
        clienteId = nuevoCliente.id;
        clienteMap.set(usuario.toUpperCase(), clienteId);
        clientesCreados++;
        console.log(`  + Cliente creado: ${usuario}`);
      }
      
      // Datos a actualizar
      const updateData: any = {
        kgGancho: parseFloat(row['KG GANCHO']) || null,
        rinde: parseFloat(row['RINDE %']) || null,
        precioServicioKg: parseFloat(row['$/kg\nSERVICIO S/RECUPERO']) || null,
        montoServicioFaena: parseFloat(row['TOTAL $\nX SERV.\n+ 21% IVA']) || null,
        montoFactura: parseFloat(row['TOTAL $\nFACTURA C/IMP.']) || null,
        numeroFactura: row['Nº FACTURA']?.toString() || null,
        estadoPago: row['ESTADO\n PAG.']?.toString() || null,
        montoDepositado: parseFloat(row['MONTO\nDEPOSITADO']) || null,
        usuarioFaenaId: clienteId,
      };
      
      // Fechas
      if (row['FECHA FAENA']) {
        const fechaFaena = parseExcelDate(row['FECHA FAENA']);
        if (fechaFaena) updateData.fechaFaena = fechaFaena;
      }
      if (row['FECHA \nFACTURA']) {
        const fechaFactura = parseExcelDate(row['FECHA \nFACTURA']);
        if (fechaFactura) updateData.fechaFactura = fechaFactura;
      }
      if (row['FECHA \nPAGO']) {
        const fechaPago = parseExcelDate(row['FECHA \nPAGO']);
        if (fechaPago) updateData.fechaPago = fechaPago;
      }
      
      // Verificar si existe la tropa
      const tropaExistente = await prisma.tropa.findUnique({
        where: { numero: tropaNum }
      });
      
      if (tropaExistente) {
        // Actualizar
        await prisma.tropa.update({
          where: { numero: tropaNum },
          data: updateData
        });
        actualizadas++;
      } else {
        // Crear nueva tropa
        await prisma.tropa.create({
          data: {
            numero: tropaNum,
            codigo: `B 2026 ${String(tropaNum).padStart(4, '0')}`,
            usuarioFaenaId: clienteId!,
            dte: '',
            guia: '',
            cantidadCabezas: parseInt(row['CANTIDAD DE  ANIMALES']) || 0,
            pesoTotalIndividual: parseFloat(row['KG PIE']) || null,
            estado: 'FAENADO',
            ...updateData
          }
        });
        creadas++;
      }
      
    } catch (error: any) {
      errores++;
      console.error(`  Error Tropa ${tropaNum}: ${error.message}`);
    }
  }
  
  console.log('\n=== RESUMEN ===');
  console.log(`Tropas actualizadas: ${actualizadas}`);
  console.log(`Tropas creadas: ${creadas}`);
  console.log(`Clientes creados: ${clientesCreados}`);
  console.log(`Errores: ${errores}`);
}

function parseExcelDate(value: any): Date | null {
  if (!value) return null;
  
  // Si ya es fecha
  if (value instanceof Date) return value;
  
  // Si es número (serial de Excel)
  if (typeof value === 'number') {
    // Excel serial date
    const date = new Date((value - 25569) * 86400 * 1000);
    return date;
  }
  
  return null;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
