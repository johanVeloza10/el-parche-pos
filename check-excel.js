const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  try {
    const workbook = xlsx.readFile('CODIFICACIÓN LISTADO DE PRECIOS 2026 (1).xlsx');
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    // Asumiendo que el código está en una columna llamada "CÓDIGO" o similar
    const codesInExcel = [];
    for (const row of data) {
      // Intentar encontrar la columna del código
      const codeKey = Object.keys(row).find(k => k.toUpperCase().includes('COD') || k.toUpperCase().includes('CÓD'));
      if (codeKey && row[codeKey]) {
        codesInExcel.push(String(row[codeKey]).trim());
      }
    }
    
    console.log(`Códigos encontrados en Excel: ${codesInExcel.length}`);
    
    const prendasDb = await p.prenda.findMany({ select: { codigo: true } });
    const codesInDb = new Set(prendasDb.map(pr => pr.codigo));
    
    const missingInDb = codesInExcel.filter(code => !codesInDb.has(code));
    
    console.log(`Códigos que están en el Excel pero NO en la Base de Datos: ${missingInDb.length}`);
    if (missingInDb.length > 0) {
      console.log('Muestra de códigos faltantes:', missingInDb.slice(0, 10));
    }
  } catch(e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
}
check();
