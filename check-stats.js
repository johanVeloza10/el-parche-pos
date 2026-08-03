const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const proveedores = await prisma.proveedor.findMany({
    include: {
      _count: {
        select: { prendas: true }
      }
    }
  });

  const totalPrendas = await prisma.prenda.count();
  
  console.log(`Total Proveedores: ${proveedores.length}`);
  console.log(`Total Prendas: ${totalPrendas}`);
  console.log('--- Proveedores Detalle ---');
  proveedores.forEach(p => {
    console.log(`- ${p.nombre}: ${p._count.prendas} prendas`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
