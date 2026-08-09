const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const code = '65';
  const matching = await p.prenda.findMany({
    where: {
      OR: [
        { codigo: { contains: code } },
        { codigo: code }
      ]
    },
    take: 10
  });
  console.log(`Prendas matching '${code}':`, matching.map(pr => ({ id: pr.id, codigo: pr.codigo, descripcion: pr.descripcion, estado: pr.estado })));
  await p.$disconnect();
}
check();
