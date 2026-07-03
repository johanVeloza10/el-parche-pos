import ExcelJS from "exceljs";
import path from "path";

const getVal = (cell: any): number => {
  if (cell === null || cell === undefined) return 0;
  if (typeof cell === "number") return cell;
  if (typeof cell === "object" && cell !== null && "result" in cell) {
    return typeof cell.result === "number" ? cell.result : 0;
  }
  const parsed = parseInt(String(cell).replace(/[$,.]/g, ""));
  return isNaN(parsed) ? 0 : parsed;
};

async function main() {
  const filePath = path.join(process.cwd(), "LIBRO FISCAL 2026 (4).xlsx");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheetsToProcess = [
    { name: "ENERO - EL PARCHE TIENDA", mesNombre: "Enero", mes: "2026-01" },
    { name: "FEBRERO - EL PARCHE TIENDA", mesNombre: "Febrero", mes: "2026-02" },
    { name: "MARZO - EL PARCHE TIENDA", mesNombre: "Marzo", mes: "2026-03" },
    { name: "ABRIL - EL PARCHE TIENDA", mesNombre: "Abril", mes: "2026-04" },
    { name: "MAYO", mesNombre: "Mayo", mes: "2026-05" }
  ];

  let granTotalVentas = 0;
  let granTotalIngreso = 0;
  let granTotalGastos = 0;
  let granTotalGanancia = 0;

  for (const sInfo of sheetsToProcess) {
    const sheet = workbook.getWorksheet(sInfo.name);
    if (!sheet) {
      console.log(`❌ No se encontró pestaña: ${sInfo.name}`);
      continue;
    }

    let mesVentas = 0;
    let mesIngreso = 0;
    let mesGastos = 0;
    let mesGanancia = 0;
    let rowsProcessed = 0;

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber < 3) return; // Saltar cabeceras
      
      const dayVal = row.getCell(1).value;
      if (dayVal === null || dayVal === undefined) return;

      const dayNum = typeof dayVal === "number" ? dayVal : parseInt(String(dayVal));
      if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) return; // No es una fila de día

      const ventas = getVal(row.getCell(2).value);
      const pagos = getVal(row.getCell(3).value);
      const ingreso = getVal(row.getCell(4).value);
      const gastos = getVal(row.getCell(5).value);
      const ganancia = getVal(row.getCell(6).value);

      mesVentas += ventas;
      mesIngreso += ingreso;
      mesGastos += gastos;
      mesGanancia += ganancia;
      rowsProcessed++;
    });

    console.log(`\n📊 Mes: ${sInfo.mesNombre} (${sInfo.mes}) - ${rowsProcessed} días procesados`);
    console.log(`  Ventas:   $${mesVentas.toLocaleString("es-CO")}`);
    console.log(`  Ingreso:  $${mesIngreso.toLocaleString("es-CO")}`);
    console.log(`  Gastos:   $${mesGastos.toLocaleString("es-CO")}`);
    console.log(`  Ganancia: $${mesGanancia.toLocaleString("es-CO")}`);

    granTotalVentas += mesVentas;
    granTotalIngreso += mesIngreso;
    granTotalGastos += mesGastos;
    granTotalGanancia += mesGanancia;
  }

  console.log("\n==========================================");
  console.log("🏆 GRAN TOTAL DEL LIBRO FISCAL (5 MESES):");
  console.log(`  Ventas brutas:   $${granTotalVentas.toLocaleString("es-CO")} (esperado: $81.232.323)`);
  console.log(`  Ingreso Tienda:  $${granTotalIngreso.toLocaleString("es-CO")} (esperado: $33.292.654)`);
  console.log(`  Gastos:          $${granTotalGastos.toLocaleString("es-CO")} (esperado: $16.647.253)`);
  console.log(`  Ganancia Real:   $${granTotalGanancia.toLocaleString("es-CO")} (esperado: $16.645.401)`);
}

main().catch(console.error);
