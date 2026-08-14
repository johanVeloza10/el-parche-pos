const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function checkCorazon() {
  try {
    // 1. Mirar en el POS DB
    const dbPrendas = await p.prenda.findMany({
      where: {
        descripcion: {
          contains: 'CORAZÓN', // sometimes accented
        }
      }
    });
    const dbPrendas2 = await p.prenda.findMany({
      where: {
        descripcion: {
          contains: 'CORAZON', // without accent
        }
      }
    });
    const allDb = [...dbPrendas, ...dbPrendas2].filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);
    
    console.log("=== EN EL POS (DB) ===");
    console.log(`Total encontradas: ${allDb.length}`);
    const byState = {};
    const byCode = {};
    for (const p of allDb) {
      if (!byState[p.estado]) byState[p.estado] = 0;
      byState[p.estado]++;
      
      const baseCode = p.codigo.split('-')[0];
      if (!byCode[baseCode]) byCode[baseCode] = 0;
      byCode[baseCode]++;
    }
    console.log("Por estado:", byState);
    console.log("Por código base:", byCode);
    
    // 2. Mirar en el Excel
    console.log("\n=== EN EL EXCEL ===");
    const filename = 'LISTA DE PRECIOS CODIFICADOS  2026 (P.V - P.C) (1).xlsx';
    const workbook = xlsx.readFile(filename);
    const sheet = workbook.Sheets['CODIFICACIÓN'];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    let excelFound = false;
    for (const row of rows) {
      if (!row || row.length < 2) continue;
      const desc = String(row[1] || '').trim().toUpperCase();
      if (desc.includes('CORAZÓN') || desc.includes('CORAZON')) {
        console.log(`Fila Excel: Código: ${row[0]}, Desc: ${desc}, Cantidad: ${row[2]}`);
        excelFound = true;
      }
    }
    if (!excelFound) console.log("No se encontró 'VESTIDO CORAZON' en el Excel.");
    
  } catch(e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
}
checkCorazon();
