const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const count = await p.historicoLibro.count();
  console.log(`Total HistoricoLibro entries in DB: ${count}`);
  if (count > 0) {
    const samples = await p.historicoLibro.findMany({ take: 5 });
    console.log("Samples:", samples);
  }
  await p.$disconnect();
}
check();
