const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const items = await p.prenda.findMany({
    where: { codigo: { startsWith: 'DP1C003' } },
    select: { codigo: true, estado: true }
  });
  console.log("DB items for DP1C003:", items);
  await p.$disconnect();
}
check();
