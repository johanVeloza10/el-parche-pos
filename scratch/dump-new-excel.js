const xlsx = require('xlsx');

function dump() {
  const filename = 'LISTA DE PRECIOS CODIFICADOS  2026 (P.V - P.C) (1).xlsx';
  const workbook = xlsx.readFile(filename);
  console.log("Sheet names:", workbook.SheetNames);
  
  for (let i = 0; i < Math.min(3, workbook.SheetNames.length); i++) {
    const sheet = workbook.SheetNames[i];
    console.log(`\n--- Sheet: ${sheet} ---`);
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheet], { header: 1 });
    console.log(rows.slice(0, 10));
  }
}
dump();
