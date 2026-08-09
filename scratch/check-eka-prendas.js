const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const eka = await p.proveedor.findFirst({
    where: { nombre: { contains: 'Eka' } }
  });
  if (eka) {
    const prendas = await p.prenda.findMany({
      where: { proveedorId: eka.id },
      take: 10
    });
    console.log(`Eka Accesorios provider ID: ${eka.id}`);
    console.log("Sample prendas for Eka:", prendas.map(pr => ({ id: pr.id, codigo: pr.codigo, descripcion: pr.descripcion, estado: pr.estado })));
  } else {
    console.log("Eka not found.");
  }
  await p.$disconnect();
}
check();
