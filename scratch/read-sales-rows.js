const xlsx = require('xlsx');

function check() {
  const workbook = xlsx.readFile('REPORTE DE VENTAS 2026.xlsx');
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
  
  console.log("Primeras 20 filas:");
  for (let i = 0; i < Math.min(20, data.length); i++) {
    console.log(`Fila ${i}:`, data[i]);
  }
}
check();
