const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const garment = await p.prenda.findFirst({
    where: { codigo: 'DP1C065' },
    include: { proveedor: true }
  });
  console.log("Garment DP1C065:");
  console.log(garment);
  await p.$disconnect();
}
check();
