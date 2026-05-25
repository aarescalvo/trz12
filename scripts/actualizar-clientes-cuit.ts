import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CLIENTES_DATOS = [
  { nombre: "DOS DE FIERRO SA", cuit: "30715475533", email: "carnicerias.la.criolla@gmail.com", telefono: "2994 02-2200" },
  { nombre: "FERREYRA MARTIN RUBEN", cuit: "23335321359", email: "martin_ferreyra_797@hotmail.com", telefono: "2984 50-7605" },
  { nombre: "MUCA Sas", cuit: "30716490323", email: "tesoreria@muca.com.ar", telefono: "2996 37-6511" },
  { nombre: "FERREYRA RUBEN ALBERTO", cuit: "20136718216", telefono: "2984 50-0770" },
  { nombre: "PENROZ CINDY MARIA FERNANDA", cuit: "23345458654", email: "carneskupal@gmail.com", telefono: "2996 25-5126" },
  { nombre: "MORAGA MAXIMILIANO IVAN", cuit: "20396498627", email: "Valentinmoraga04@gmail.com", telefono: "2984 21-8759" },
  { nombre: "FRIGORIFICO DE LA PATAGONIA SRL", cuit: "30718653467", email: "ganadospatagonicos@gmail.com", telefono: "2995 56-7306" },
  { nombre: "GANADERA NORTE NEUQUINO SAS", cuit: "30716426757", email: "adminsr@srfrigorifico.com.ar", telefono: "2994 01-8943" },
  { nombre: "BOSQUE AMADO S.R.L", cuit: "30707770690", email: "Bosqueamadosrl@gmail.com", telefono: "2996 72-8854" },
  { nombre: "DISTRIBUIDORA DE LA PATAGONIA SRL", cuit: "30709507849", email: "Distribuidoradelapatagoniasrl@hotmil.com", telefono: "2942 66-4244" },
  { nombre: "JORGE ALBERTO LASAGNO", cuit: "20250067861" },
  { nombre: "MAIZALES DE LA PATAGONIA S.R.L", cuit: "30716325276", email: "Ariel_trapial@hotmail.com", telefono: "2984 57-0584" },
  { nombre: "TRIAUD SA", cuit: "30715935100", email: "Triaudsa@gmail.com", telefono: "2302 60-2382" },
  { nombre: "VIENTOS DEL VALLE SRL", cuit: "30712143483", email: "gabriel_pagani@hotmail.com", telefono: "2995 33-1473" },
  { nombre: "ROSA JOSE ANIBAL", cuit: "20246268062", telefono: "2920 66-1658" },
  { nombre: "EVASIO MARMETTO SA", cuit: "30537620893", email: "Facundo@marmetto.com.ar", telefono: "2262 58-2647" },
  { nombre: "NECORUTA", cuit: "30710798946" },
]

async function main() {
  console.log('=== ACTUALIZANDO CLIENTES ===\n')
  
  let actualizados = 0
  
  for (const datos of CLIENTES_DATOS) {
    try {
      // Buscar por nombre exacto
      const cliente = await prisma.cliente.findFirst({
        where: { nombre: datos.nombre }
      })
      
      if (cliente) {
        await prisma.cliente.update({
          where: { id: cliente.id },
          data: {
            email: datos.email || null,
            telefono: datos.telefono || null,
          }
        })
        console.log(`✓ ${cliente.nombre} -> email: ${datos.email || '-'}`)
        actualizados++
      } else {
        // Crear si no existe
        await prisma.cliente.create({
          data: {
            nombre: datos.nombre,
            cuit: datos.cuit,
            email: datos.email || null,
            telefono: datos.telefono || null,
            esUsuarioFaena: true,
          }
        })
        console.log(`+ ${datos.nombre} (creado)`)
        actualizados++
      }
    } catch (e) {
      console.log(`✗ ${datos.nombre} - error`)
    }
  }
  
  // Actualizar CUITs por separado (upsert)
  console.log('\n=== ACTUALIZANDO CUITs ===')
  for (const datos of CLIENTES_DATOS) {
    try {
      const cliente = await prisma.cliente.findFirst({
        where: { nombre: datos.nombre }
      })
      if (cliente && datos.cuit) {
        // Verificar si el CUIT ya existe
        const existeCuit = await prisma.cliente.findFirst({
          where: { cuit: datos.cuit }
        })
        if (!existeCuit) {
          await prisma.cliente.update({
            where: { id: cliente.id },
            data: { cuit: datos.cuit }
          })
          console.log(`✓ CUIT ${datos.cuit} -> ${cliente.nombre}`)
        }
      }
    } catch (e) {}
  }
  
  console.log(`\n${actualizados} clientes procesados`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
