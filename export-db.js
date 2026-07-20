const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.rgkoruuoyvjwknwfslet:Elparche10%40@aws-0-us-east-1.pooler.supabase.com:5432/postgres'
    }
  }
});

async function main() {
  console.log("Exporting data from old database...");
  
  const data = {};
  
  data.configuracion = await prisma.configuracionNegocio.findMany();
  data.usuarios = await prisma.usuario.findMany();
  data.proveedores = await prisma.proveedor.findMany();
  data.ordenesProduccion = await prisma.ordenProduccion.findMany();
  data.prendas = await prisma.prenda.findMany();
  
  // They haven't used clients or sales yet (or we can just skip them for a clean start on Aug 1, but let's grab them just in case)
  data.clientes = await prisma.cliente.findMany();
  
  fs.writeFileSync('db-export.json', JSON.stringify(data, null, 2));
  console.log("Export complete! Exported items:", data.prendas.length, "prendas");
}

main().catch(console.error).finally(() => prisma.$disconnect());
