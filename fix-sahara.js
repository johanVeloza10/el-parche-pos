const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function fixSahara() {
  const updated = await p.prenda.updateMany({
    where: { codigo: '}' },
    data: {
      codigo: 'DP21C566',
      codigoBarras: 'DP21C566'
    }
  });
  console.log("Prenda PANTALÓN SAHARA actualizada:", updated);
  await p.$disconnect();
}

fixSahara().catch(console.error);
