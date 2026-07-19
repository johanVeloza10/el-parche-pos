const xlsx = require('xlsx');

function check() {
  const workbook = xlsx.readFile('CODIFICACIÓN LISTADO DE PRECIOS 2026 (1).xlsx');
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
  if (data.length > 0) {
    console.log("Columnas disponibles en el Excel:");
    console.log(Object.keys(data[0]));
    console.log("Primera fila de ejemplo:");
    console.log(data[0]);
  }
}
check();
