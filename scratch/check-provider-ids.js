const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const provs = await p.proveedor.findMany({
    select: { id: true, nombre: true }
  });
  console.log("Providers in DB:");
  console.log(provs);
  await p.$disconnect();
}
check();
