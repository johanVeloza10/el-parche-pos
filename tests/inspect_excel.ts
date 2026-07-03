import ExcelJS from "exceljs";
import path from "path";

async function main() {
  const filePath = path.join(process.cwd(), "LIBRO FISCAL 2026 (4).xlsx");
  console.log(`Leyendo archivo: ${filePath}`);
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  console.log("\nPestañas encontradas:");
  workbook.eachSheet((sheet, id) => {
    console.log(`  - ID: ${id}, Nombre: ${sheet.name}, Filas: ${sheet.rowCount}`);
  });
}

main().catch(console.error);
