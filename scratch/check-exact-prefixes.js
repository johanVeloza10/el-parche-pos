const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const prendas = await p.prenda.findMany({
    select: { codigo: true, proveedor: { select: { nombre: true } } }
  });
  
  const mappings = {};
  prendas.forEach(pr => {
    // Exact match for prefix (e.g. DP1 for DP1C065, or 625 for 625-...)
    const match = pr.codigo.match(/^([A-Za-z0-9]+)C\d+/);
    if (match) {
      const prefix = match[1];
      const provName = pr.proveedor?.nombre || "N/A";
      if (!mappings[prefix]) mappings[prefix] = new Set();
      mappings[prefix].add(provName);
    } else {
      const parts = pr.codigo.split('-');
      if (parts.length > 1) {
        const prefix = parts[0];
        const provName = pr.proveedor?.nombre || "N/A";
        if (!mappings[prefix]) mappings[prefix] = new Set();
        mappings[prefix].add(provName);
      }
    }
  });
  
  console.log("Exact prefix mapping to provider names:");
  for (const [prefix, names] of Object.entries(mappings)) {
    console.log(`- ${prefix} -> ${Array.from(names).join(', ')}`);
  }
  await p.$disconnect();
}
check();
