const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const prendas = await p.prenda.findMany({
    select: { codigo: true }
  });
  
  const prefixes = new Set();
  prendas.forEach(pr => {
    // Extract prefix, usually letters and numbers before C (e.g. DP1 for DP1C065) or first non-digit group
    const match = pr.codigo.match(/^([A-Za-z0-9]+)C\d+/);
    if (match) {
      prefixes.add(match[1]);
    } else {
      // Try splitting by dash
      const parts = pr.codigo.split('-');
      if (parts.length > 1) {
        prefixes.add(parts[0]);
      } else {
        prefixes.add(pr.codigo.substring(0, 4));
      }
    }
  });
  
  console.log("Distinct prefixes of garment codes in DB:");
  console.log(Array.from(prefixes));
  await p.$disconnect();
}
check();
