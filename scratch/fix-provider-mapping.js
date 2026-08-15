const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const prefixToProvName = {
  'DP4C': 'SUMERCÉ',
  'DP9C': 'ESTEFANÍA',
  'DP10C': 'SEMILLA COLECTIVO',
  'DP11C': 'CLAVELITO',
  'DP14C': 'DUE',
  'DP16C': 'MARAHÉ',
  'DP17C': 'MANDALA',
  'DP19C': 'MAMBÍ',
  'DP20C': 'ANIMALEJA', // EN LLAMAS is registered as ANIMALEJA or EN LLAMAS in DB? Let's check
  'DP21C': 'CRECIENTE',
  'DP23C': 'PALOMA',
  'DP24C': 'TSURU',
  'DP29C': 'ERRE TRES',
};

async function fixMapping() {
  const proveedores = await p.proveedor.findMany();
  console.log("Existing providers in DB:", proveedores.map(pr => ({ id: pr.id, nombre: pr.nombre })));

  // Find exact provider for ERRE TRES and ANIMALEJA/EN LLAMAS
  const erreTres = proveedores.find(pr => pr.nombre.toUpperCase().includes('ERRE TRES'));
  const animaleja = proveedores.find(pr => pr.nombre.toUpperCase().includes('LLAMAS') || pr.nombre.toUpperCase().includes('ANIMALEJA'));
  
  console.log("ERRE TRES provider:", erreTres?.nombre, erreTres?.id);
  console.log("EN LLAMAS/ANIMALEJA provider:", animaleja?.nombre, animaleja?.id);

  let updatedCount = 0;

  // Re-map prendas by code prefix
  for (const [prefix, provNameSearch] of Object.entries(prefixToProvName)) {
    const targetProv = proveedores.find(pr => pr.nombre.toUpperCase().includes(provNameSearch.toUpperCase()));
    if (!targetProv) {
      console.warn(`Could not find provider for search term ${provNameSearch}`);
      continue;
    }

    const res = await p.prenda.updateMany({
      where: {
        codigo: { startsWith: prefix }
      },
      data: {
        proveedorId: targetProv.id
      }
    });

    console.log(`Updated ${res.count} garments with prefix ${prefix} -> Provider: ${targetProv.nombre}`);
    updatedCount += res.count;
  }

  console.log(`\n🎉 Re-mapping completed! Total prendas updated: ${updatedCount}`);
}

fixMapping().finally(() => p.$disconnect());
