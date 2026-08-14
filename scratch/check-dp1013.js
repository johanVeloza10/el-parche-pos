const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function checkRef() {
  try {
    const queries = ['DP1013', 'DP1C013', 'DP10C013', 'DP10C13'];
    
    console.log("=== EN EL POS (DB) ===");
    for (const q of queries) {
      const dbPrendas = await p.prenda.findMany({
        where: {
          codigo: { startsWith: q }
        }
      });
      if (dbPrendas.length > 0) {
        console.log(`\nBúsqueda '${q}': Encontradas ${dbPrendas.length}`);
        const byState = {};
        for (const pr of dbPrendas) {
          if (!byState[pr.estado]) byState[pr.estado] = 0;
          byState[pr.estado]++;
        }
        console.log(`Estado para ${q}:`, byState);
      }
    }
    
    console.log("\n=== EN EL EXCEL ===");
    const filename = 'LISTA DE PRECIOS CODIFICADOS  2026 (P.V - P.C) (1).xlsx';
    const workbook = xlsx.readFile(filename);
    const sheet = workbook.Sheets['CODIFICACIÓN'];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    for (const q of queries) {
      let found = false;
      for (const row of rows) {
        if (!row || row.length < 2) continue;
        const code = String(row[0] || '').trim().toUpperCase();
        if (code === q || code.includes(q)) {
          console.log(`Fila Excel - Código: ${code}, Desc: ${row[1]}, Cantidad: ${row[2]}`);
          found = true;
        }
      }
      if (!found) {
        // console.log(`No se encontró '${q}' en el Excel.`);
      }
    }
    
  } catch(e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
}
checkRef();
