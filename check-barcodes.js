const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const all = await p.prenda.findMany({ select: { codigo: true, codigoBarras: true, descripcion: true } });
  
  const missingBarcodes = all.filter(a => !a.codigoBarras);
  const mismatches = all.filter(a => a.codigo !== a.codigoBarras);
  
  console.log("Total prendas:", all.length);
  console.log("Prendas sin codigoBarras:", missingBarcodes.length);
  console.log("Prendas donde codigo != codigoBarras:", mismatches.length);
  if (mismatches.length > 0) {
    console.log("Muestra de diferencias:", mismatches.slice(0, 5));
  }
  
  // Let's print some sample codes starting with DP
  const dpPrendas = all.filter(a => a.codigo.startsWith('DP'));
  console.log("Sample DP codes and barcodes:");
  console.log(dpPrendas.slice(0, 10));

  await p.$disconnect();
}
run();
