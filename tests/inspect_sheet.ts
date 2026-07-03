import ExcelJS from "exceljs";
import path from "path";

async function main() {
  const filePath = path.join(process.cwd(), "LIBRO FISCAL 2026 (4).xlsx");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const sheet = workbook.getWorksheet("MARZO - EL PARCHE TIENDA");
  if (!sheet) {
    console.log("Pestaña no encontrada");
    return;
  }
  console.log(`Pestaña: ${sheet.name}, Filas: ${sheet.rowCount}`);
  
  // Imprimir las primeras 15 filas no vacías
  let printed = 0;
  sheet.eachRow((row, rowNumber) => {
    if (printed < 25) {
      console.log(`Fila ${rowNumber}:`, row.values);
      printed++;
    }
  });
}

main().catch(console.error);
