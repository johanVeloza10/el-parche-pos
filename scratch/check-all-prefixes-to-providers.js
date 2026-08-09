const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const prefixes = [
    'DP1', 'DP2', 'DP3', 'DP4', 'DP5', 'DP6', 'DP7', 'DP8', 'DP9', 'DP10',
    'DP11', 'DP12', 'DP13', 'DP14', 'DP15', 'DP16', 'DP17', 'DP18', 'DP19', 'DP20',
    'DP21', 'DP22', 'DP23', 'DP24', 'DP25', 'DP27', 'DP28', 'DP29', 'DP30'
  ];
  
  console.log("Analyzing garment prefix mapping to provider in DB:");
  for (const prefix of prefixes) {
    const pr = await p.prenda.findFirst({
      where: { codigo: { startsWith: prefix } },
      include: { proveedor: true }
    });
    const provName = pr?.proveedor?.nombre || "N/A";
    console.log(`Prefix ${prefix} -> Provider: ${provName} (Total prendas: ${await p.prenda.count({ where: { codigo: { startsWith: prefix } } })})`);
  }
  await p.$disconnect();
}
check();
