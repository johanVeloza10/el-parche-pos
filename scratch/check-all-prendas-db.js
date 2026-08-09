const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const provs = await p.proveedor.findMany({
    include: {
      prendas: {
        take: 3,
        select: { codigo: true, descripcion: true }
      },
      _count: {
        select: { prendas: true }
      }
    }
  });
  
  console.log("Providers in DB, their garment count, and sample codes:");
  provs.forEach(pr => {
    const sampleCodes = pr.prendas.map(p => p.codigo).join(', ');
    console.log(`- ${pr.nombre} (ID: ${pr.id}): ${pr._count.prendas} garments. Samples: [${sampleCodes}]`);
  });
  await p.$disconnect();
}
check();
