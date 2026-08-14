const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const cajas = await p.cierreCaja.findMany({
    orderBy: { fecha: 'desc' },
    take: 5
  });
  console.log("Últimas 5 cajas:", cajas);
  await p.$disconnect();
}
check();
