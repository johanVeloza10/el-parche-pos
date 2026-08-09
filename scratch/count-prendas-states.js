const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const counts = await p.prenda.groupBy({
    by: ['estado'],
    _count: { id: true }
  });
  console.log("Garment counts by state in DB:");
  console.log(counts);
  await p.$disconnect();
}
check();
