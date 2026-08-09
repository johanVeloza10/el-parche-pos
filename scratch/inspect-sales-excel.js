const xlsx = require('xlsx');

function check() {
  const workbook = xlsx.readFile('REPORTE DE VENTAS 2026.xlsx');
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
  if (data.length > 0) {
    console.log("Columnas disponibles en REPORTE DE VENTAS 2026.xlsx:");
    console.log(Object.keys(data[0]));
    console.log("Primera fila de ejemplo:");
    console.log(data[0]);
    console.log(`Total registros en el reporte de ventas: ${data.length}`);
  }
}
check();
