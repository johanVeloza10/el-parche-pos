const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log("Starting data import to new database...");
  const rawData = fs.readFileSync('db-export.json', 'utf8');
  const data = JSON.parse(rawData);
  
  console.log(`Importing ${data.configuracion.length} configuraciones...`);
  await prisma.configuracionNegocio.createMany({ data: data.configuracion, skipDuplicates: true });

  console.log(`Importing ${data.usuarios.length} usuarios...`);
  await prisma.usuario.createMany({ data: data.usuarios, skipDuplicates: true });

  console.log(`Importing ${data.proveedores.length} proveedores...`);
  await prisma.proveedor.createMany({ data: data.proveedores, skipDuplicates: true });

  console.log(`Importing ${data.clientes.length} clientes...`);
  await prisma.cliente.createMany({ data: data.clientes, skipDuplicates: true });

  if (data.ordenesProduccion && data.ordenesProduccion.length > 0) {
    console.log(`Importing ${data.ordenesProduccion.length} ordenes de produccion...`);
    await prisma.ordenProduccion.createMany({ data: data.ordenesProduccion, skipDuplicates: true });
  }

  console.log(`Importing ${data.prendas.length} prendas...`);
  // createMany for prendas (we don't have nested creates so createMany works well)
  await prisma.prenda.createMany({ data: data.prendas, skipDuplicates: true });

  console.log("Import completely successfully!");
}

main().catch(e => {
  console.error("Import failed:", e);
}).finally(async () => {
  await prisma.$disconnect();
});
