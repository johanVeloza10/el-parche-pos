const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function checkAll() {
  try {
    const files = [
      'CODIFICACIÓN LISTADO DE PRECIOS 2026 (1).xlsx',
      'CODIFICACIÓN LISTADO DE PRECIOS 2026 (P.V - P.C).xlsx',
      'LISTA DE PRECIOS CODIFICADOS  2026 (P.V - P.C) 1.xlsx'
    ];
    
    let excelCodes = new Set();
    let fileCodes = {};
    
    for (const file of files) {
      fileCodes[file] = new Set();
      const workbook = xlsx.readFile(file);
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      
      for (const row of data) {
        const codigo = String(row['CÓDIGO'] || row['CODIGO'] || '').trim();
        if (codigo && codigo !== 'undefined' && codigo !== '}') {
          excelCodes.add(codigo);
          fileCodes[file].add(codigo);
        }
      }
      console.log(`File: ${file} has ${fileCodes[file].size} valid codes.`);
    }
    
    console.log(`Total unique codes in all Excel files: ${excelCodes.size}`);
    
    const prendasDb = await p.prenda.findMany({ select: { codigo: true } });
    const dbCodes = new Set(prendasDb.map(pr => pr.codigo));
    
    console.log(`Total prendas in DB: ${dbCodes.size}`);
    
    const missingInDb = [...excelCodes].filter(code => !dbCodes.has(code));
    
    console.log(`Unique codes in Excel that are NOT in DB: ${missingInDb.length}`);
    if (missingInDb.length > 0) {
      console.log('Sample missing codes:', missingInDb.slice(0, 50));
    } else {
      console.log('All unique codes from the 3 Excel files exist in the DB.');
    }
  } catch(e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
}
checkAll();
