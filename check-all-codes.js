const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function checkAll() {
  try {
    const files = [
      'CODIFICACIÓN LISTADO DE PRECIOS 2026 (1).xlsx',
      'CODIFICACIÓN LISTADO DE PRECIOS 2026 (P.V - P.C).xlsx'
    ];
    
    let excelCodes = new Set();
    
    for (const file of files) {
      const workbook = xlsx.readFile(file);
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      
      for (const row of data) {
        const codigo = String(row['CÓDIGO'] || row['CODIGO'] || '').trim();
        if (codigo && codigo !== 'undefined') {
          excelCodes.add(codigo);
        }
      }
    }
    
    console.log(`Total códigos únicos en los archivos de Excel: ${excelCodes.size}`);
    
    const prendasDb = await p.prenda.findMany({ select: { codigo: true } });
    const dbCodes = new Set(prendasDb.map(pr => pr.codigo));
    
    console.log(`Total prendas en la base de datos: ${dbCodes.size}`);
    
    const missingInDb = [...excelCodes].filter(code => !dbCodes.has(code));
    
    console.log(`Códigos en Excel que NO están en BD: ${missingInDb.length}`);
    if (missingInDb.length > 0) {
      console.log('Faltan:', missingInDb);
    } else {
      console.log('¡Todos los códigos de los archivos Excel están en la base de datos!');
    }
  } catch(e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
}
checkAll();
