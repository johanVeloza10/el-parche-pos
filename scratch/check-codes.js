const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  try {
    const res = await p.prenda.findMany({ where: { codigo: { startsWith: 'DP1C013' } } });
    console.log(res.map(r => ({ cod: r.codigo, est: r.estado })));
  } finally {
    await p.$disconnect();
  }
}
run();
