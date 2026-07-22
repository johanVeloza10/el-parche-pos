const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const rootDir = 'C:\\Users\\Usuario\\.gemini\\antigravity\\scratch\\el-parche-pos';
const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));

console.log("Archivos Excel encontrados:", files);

files.forEach(file => {
  const wb = xlsx.readFile(path.join(rootDir, file));
  wb.SheetNames.forEach(sheetName => {
    const sheet = wb.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    data.forEach(row => {
      const rowStr = JSON.stringify(row);
      if (rowStr.toUpperCase().includes('SAHARA')) {
        console.log(`Encontrado en ${file} [${sheetName}]:`, row);
      }
    });
  });
});
