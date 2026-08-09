const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const prendas = await p.prenda.findMany({
    where: { codigo: { startsWith: 'DP1C' } },
    take: 30,
    select: { codigo: true, descripcion: true, precioVenta: true, estado: true }
  });
  console.log("Prendas starting with DP1C:");
  console.log(prendas);
  await p.$disconnect();
}
check();
