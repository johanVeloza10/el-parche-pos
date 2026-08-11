const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function compare() {
  try {
    const filename = 'LISTA DE PRECIOS CODIFICADOS  2026 (P.V - P.C) (1).xlsx';
    console.log(`Analizando archivo: ${filename}...`);
    const workbook = xlsx.readFile(filename);
    const sheet = workbook.Sheets['CODIFICACIÓN'];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    const excelData = {};
    for (const row of rows) {
      if (!row || row.length < 2) continue;
      const codRaw = String(row[0] || '').trim().toUpperCase();
      if (codRaw === 'CÓDIGO' || codRaw === '' || codRaw === 'UNDEFINED') continue;
      
      const cantidad = parseInt(row[2]) || 0;
      if (cantidad > 0) {
        excelData[codRaw] = { expected: cantidad, desc: row[1], marca: row[5] };
      }
    }
    
    const prendasDb = await p.prenda.findMany({ select: { codigo: true, estado: true } });
    const dbData = {};
    for (const prenda of prendasDb) {
      const baseCode = prenda.codigo.split('-')[0].toUpperCase();
      if (!dbData[baseCode]) dbData[baseCode] = 0;
      dbData[baseCode]++;
    }
    
    const reportSobrantes = [];
    
    for (const [baseCode, info] of Object.entries(excelData)) {
      const dbQty = dbData[baseCode] || 0;
      if (dbQty > info.expected) {
        reportSobrantes.push(`SOBRAN ${dbQty - info.expected} unds de ${baseCode}. Excel: ${info.expected}, POS: ${dbQty}`);
      }
    }
    
    for (const baseCode of Object.keys(dbData)) {
      if (!excelData[baseCode]) {
        reportSobrantes.push(`SOBRA (No está en Excel) ${dbData[baseCode]} unds de ${baseCode}. POS: ${dbData[baseCode]}`);
      }
    }
    
    console.log(`\nMuestra de los primeros 20 SOBRANTES:`);
    reportSobrantes.slice(0, 20).forEach(msg => console.log(msg));
    
  } catch (e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
}

compare();
