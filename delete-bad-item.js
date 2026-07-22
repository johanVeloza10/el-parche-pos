const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function deleteBadItem() {
  const deleted = await p.prenda.deleteMany({
    where: { codigo: '}' }
  });
  console.log("Prenda corrupta '}' eliminada:", deleted);
  await p.$disconnect();
}

deleteBadItem().catch(console.error);
