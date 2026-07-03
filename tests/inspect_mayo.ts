import ExcelJS from "exceljs";
import path from "path";

async function main() {
  const filePath = path.join(process.cwd(), "LIBRO FISCAL 2026 (4).xlsx");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  for (const name of ["MAYO", "JUNIO"]) {
    const sheet = workbook.getWorksheet(name);
    if (!sheet) {
      console.log(`\nPestaña ${name} no encontrada.`);
      continue;
    }
    console.log(`\nPestaña: ${sheet.name}, Filas: ${sheet.rowCount}`);
    let printed = 0;
    sheet.eachRow((row, rowNumber) => {
      if (printed < 5) {
        console.log(`Fila ${rowNumber}:`, row.values);
        printed++;
      }
    });
  }
}

main().catch(console.error);
