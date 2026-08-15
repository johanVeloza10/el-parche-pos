const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function checkApartados() {
  const apartados = await p.apartado.findMany({
    include: {
      prenda: true,
      cliente: true
    }
  });
  console.log("Total apartados in DB:", apartados.length);
  console.log(JSON.stringify(apartados, null, 2));

  const cajas = await p.cierreCaja.findMany({
    where: { estado: "ABIERTA" }
  });
  console.log("Cajas abiertas in DB:", cajas);
}

checkApartados().finally(() => p.$disconnect());
