const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function checkSahara() {
  const item = await p.prenda.findFirst({
    where: { descripcion: { contains: 'SAHARA', mode: 'insensitive' } }
  });
  console.log("PANTALÓN SAHARA in DB:", item);

  await p.$disconnect();
}

checkSahara().catch(console.error);
