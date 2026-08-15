const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const files = fs.readdirSync(process.cwd()).filter(f => 
  f.endsWith('.xlsx') && 
  !f.startsWith('~') && 
  !f.toUpperCase().includes('REPORTE') && 
  !f.toUpperCase().includes('LIBRO') && 
  !f.toUpperCase().includes('CODIFICA') && 
  !f.toUpperCase().includes('LISTA')
);

console.log("Analyzing 14 Excel files:");
files.forEach(file => {
  const wb = xlsx.readFile(path.join(process.cwd(), file));
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);
  console.log(`\n--- File: ${file} (Rows: ${data.length}) ---`);
  if (data.length > 0) {
    console.log("Sample Row 0:", data[0]);
    console.log("Sample Row 1:", data[1] || {});
  }
});
