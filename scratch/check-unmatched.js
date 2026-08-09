const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const codes = ['114', '203', '813', '804', '417', '76'];
  for (const c of codes) {
    const matches = await p.prenda.findMany({
      where: { codigo: { contains: c } },
      select: { codigo: true, descripcion: true, proveedor: { select: { nombre: true } } }
    });
    console.log(`Matches for code substring '${c}':`, matches);
  }
  await p.$disconnect();
}
check();
