const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const vitrina = await p.prenda.count({ where: { deletedAt: null, estado: 'EN_VITRINA' } });
  const total = await p.prenda.count({ where: { deletedAt: null } });
  const provs = await p.proveedor.findMany({
    select: {
      id: true,
      nombre: true,
      comisionDefaultPct: true,
      modoComisionDefault: true,
      _count: { select: { prendas: true } }
    }
  });

  console.log("Total prendas en vitrina:", vitrina);
  console.log("Total prendas general:", total);
  console.log("Proveedores:", provs);
}

run().finally(() => p.$disconnect());
