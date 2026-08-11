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
    
    // 1. Get expected quantities from Excel
    const excelData = {}; // baseCode -> { expected: N, desc: string, marca: string }
    let totalExcelQty = 0;
    
    for (const row of rows) {
      if (!row || row.length < 2) continue;
      const codRaw = String(row[0] || '').trim().toUpperCase();
      if (codRaw === 'CÓDIGO' || codRaw === '' || codRaw === 'UNDEFINED') continue;
      
      const cantidad = parseInt(row[2]) || 0;
      if (cantidad > 0) {
        excelData[codRaw] = {
          expected: cantidad,
          desc: row[1],
          marca: row[5]
        };
        totalExcelQty += cantidad;
      }
    }
    
    // 2. Get actual quantities from DB (all states)
    const prendasDb = await p.prenda.findMany({ select: { codigo: true, estado: true } });
    const dbData = {}; // baseCode -> actual N
    let totalDbQty = prendasDb.length;
    
    for (const prenda of prendasDb) {
      // Base code is before any dash, e.g. DP1C003-1 -> DP1C003
      const baseCode = prenda.codigo.split('-')[0].toUpperCase();
      if (!dbData[baseCode]) dbData[baseCode] = 0;
      dbData[baseCode]++;
    }
    
    // 3. Compare
    console.log(`\n=== RESUMEN GLOBAL ===`);
    console.log(`Total prendas físicas esperadas según Excel: ${totalExcelQty}`);
    console.log(`Total prendas físicas registradas en POS DB: ${totalDbQty}`);
    
    console.log(`\n=== DESCUADRES POR REFERENCIA ===`);
    let missingReferences = 0;
    let missingTotalQty = 0;
    
    let excessReferences = 0;
    let excessTotalQty = 0;
    
    const report = [];
    
    for (const [baseCode, info] of Object.entries(excelData)) {
      const dbQty = dbData[baseCode] || 0;
      if (dbQty < info.expected) {
        const diff = info.expected - dbQty;
        report.push(`FALTAN ${diff} unds de ${baseCode} (${info.marca} - ${info.desc}). Excel: ${info.expected}, POS: ${dbQty}`);
        missingReferences++;
        missingTotalQty += diff;
      } else if (dbQty > info.expected) {
        const diff = dbQty - info.expected;
        report.push(`SOBRAN ${diff} unds de ${baseCode} (${info.marca} - ${info.desc}). Excel: ${info.expected}, POS: ${dbQty}`);
        excessReferences++;
        excessTotalQty += diff;
      }
    }
    
    // Find codes in DB not in Excel
    for (const baseCode of Object.keys(dbData)) {
      if (!excelData[baseCode]) {
        report.push(`SOBRA (No está en Excel) ${dbData[baseCode]} unds de ${baseCode}. POS: ${dbData[baseCode]}`);
        excessReferences++;
        excessTotalQty += dbData[baseCode];
      }
    }
    
    console.log(`\nResumen de Descuadres:`);
    console.log(`- Referencias con FALTANTES en el POS: ${missingReferences} (Total piezas faltantes: ${missingTotalQty})`);
    console.log(`- Referencias con SOBRANTES en el POS: ${excessReferences} (Total piezas sobrantes: ${excessTotalQty})`);
    
    console.log(`\nMuestra de los primeros 30 descuadres:`);
    report.slice(0, 30).forEach(msg => console.log(msg));
    
  } catch (e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
}

compare();
