const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const prendas = await p.prenda.findMany();
  console.log("Total prendas en DB:", prendas.length);
  
  const porEstado = {};
  prendas.forEach(pr => {
    porEstado[pr.estado] = (porEstado[pr.estado] || 0) + 1;
  });
  console.log("Prendas por estado:", porEstado);

  const deleted = prendas.filter(pr => pr.deletedAt !== null);
  console.log("Prendas con soft delete (deletedAt):", deleted.length);

  const noCodigoBarras = prendas.filter(pr => !pr.codigoBarras);
  console.log("Prendas sin codigoBarras:", noCodigoBarras.length);

  const conEspacios = prendas.filter(pr => pr.codigo.includes(' ') || (pr.codigoBarras && pr.codigoBarras.includes(' ')));
  console.log("Prendas con espacios en codigo/codigoBarras:", conEspacios.length);

  const diferentes = prendas.filter(pr => pr.codigo !== pr.codigoBarras);
  console.log("Prendas donde codigo != codigoBarras:", diferentes.length);

  console.log("\nMuestra de prendas (primeras 10):");
  console.log(prendas.slice(0, 10).map(pr => ({
    codigo: pr.codigo,
    codigoBarras: pr.codigoBarras,
    descripcion: pr.descripcion,
    estado: pr.estado
  })));

  await p.$disconnect();
}

check().catch(console.error);
