const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function fullDiagnostic() {
  const prendas = await p.prenda.findMany();
  
  console.log("=== DIAGNÓSTICO DE PRENDAS Y CÓDIGOS DE BARRAS ===");
  console.log("Total prendas en base de datos:", prendas.length);
  
  // 1. Estados
  const estados = {};
  prendas.forEach(pr => estados[pr.estado] = (estados[pr.estado] || 0) + 1);
  console.log("\n1. Distribución por estado:");
  console.table(estados);

  // 2. Revisar si hay códigos con caracteres extraños o no-ASCII
  const codigosEspeciales = prendas.filter(pr => /[^\w\-\.]/.test(pr.codigo) || /[^\w\-\.]/.test(pr.codigoBarras || ''));
  console.log(`\n2. Códigos con caracteres especiales (${codigosEspeciales.length}):`);
  if (codigosEspeciales.length > 0) {
    console.log(codigosEspeciales.map(pr => ({ codigo: pr.codigo, codigoBarras: pr.codigoBarras, desc: pr.descripcion })));
  }

  // 3. Revisar si hay duplicados de codigoBarras o codigo
  const codigosVistos = new Set();
  const dupCodigos = [];
  prendas.forEach(pr => {
    if (codigosVistos.has(pr.codigo)) dupCodigos.push(pr.codigo);
    else codigosVistos.add(pr.codigo);
  });
  console.log(`\n3. Códigos duplicados: ${dupCodigos.length}`);

  // 4. Revisar prendas VENDIDAS recientemente (que el cliente puede estar intentando probar)
  const vendidas = prendas.filter(pr => pr.estado === 'VENDIDA');
  console.log(`\n4. Prendas actualmente VENDIDAS (${vendidas.length}):`);
  console.log(vendidas.map(pr => `${pr.codigo} (${pr.codigoBarras}) - ${pr.descripcion}`));

  await p.$disconnect();
}

fullDiagnostic().catch(console.error);
