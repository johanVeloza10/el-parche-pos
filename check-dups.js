const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function checkDuplicates() {
  const all = await p.prenda.findMany();
  console.log("Total prendas:", all.length);

  const byDesc = {};
  all.forEach(item => {
    const key = item.descripcion.trim().toUpperCase();
    if (!byDesc[key]) byDesc[key] = [];
    byDesc[key].push(item);
  });

  const dupDescs = Object.keys(byDesc).filter(k => byDesc[k].length > 1);
  console.log(`\nDescripciones repetidas (${dupDescs.length}):`);
  dupDescs.forEach(k => {
    console.log(`- "${k}":`, byDesc[k].map(x => ({ id: x.id, codigo: x.codigo, codigoBarras: x.codigoBarras, estado: x.estado })));
  });

  // Check item with code '}'
  const badItem = all.find(x => x.codigo === '}');
  if (badItem) {
    console.log("\nBad item code '}' found:", badItem);
  }

  await p.$disconnect();
}

checkDuplicates().catch(console.error);
