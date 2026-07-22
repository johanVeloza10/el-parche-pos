const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function checkNonVitrina() {
  const nonVitrina = await p.prenda.findMany({
    where: { estado: { not: 'EN_VITRINA' } },
    select: { codigo: true, codigoBarras: true, descripcion: true, estado: true, fechaVenta: true }
  });
  
  console.log(`Prendas que NO están EN_VITRINA (${nonVitrina.length}):`);
  console.log(nonVitrina);

  await p.$disconnect();
}

checkNonVitrina().catch(console.error);
