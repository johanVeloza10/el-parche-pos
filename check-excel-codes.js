const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const rootDir = 'C:\\Users\\Usuario\\.gemini\\antigravity\\scratch\\el-parche-pos';
const files = ['CODIFICACIÓN LISTADO DE PRECIOS 2026 (P.V - P.C).xlsx', 'CODIFICACIÓN LISTADO DE PRECIOS 2026 (1).xlsx'];

files.forEach(file => {
  const wb = xlsx.readFile(path.join(rootDir, file));
  wb.SheetNames.forEach(sheetName => {
    const sheet = wb.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    console.log(`\n=== ${file} [${sheetName}] === (${data.length} filas)`);
    data.forEach((row, idx) => {
      const code = String(row['CÓDIGO'] || row['CODIGO'] || '').trim();
      const desc = String(row['REFERENCIA'] || row['DESCRIPCION'] || '').trim();
      if (!desc) return; // skip empty rows
      
      if (!code || code.length < 3 || /[^A-Za-z0-9\-\.]/.test(code)) {
        console.log(`Fila ${idx + 2}: CÓDIGO RARO => "${code}" | REFERENCIA => "${desc}" | MARCA => "${row['MARCA'] || ''}"`);
      }
    });
  });
});
