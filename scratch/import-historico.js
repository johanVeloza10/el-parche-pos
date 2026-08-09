const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const path = require('path');

const prisma = new PrismaClient();

async function importHistorico() {
  console.log('🌱 Importando histórico del libro fiscal desde Excel (LIBRO FISCAL 2026 (4).xlsx)...');
  
  try {
    const filePath = path.join(process.cwd(), "LIBRO FISCAL 2026 (4).xlsx");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    // Wiping just the HistoricoLibro table to prevent duplicates if run multiple times
    await prisma.historicoLibro.deleteMany();
    console.log("🧹 HistoricoLibro table cleaned.");

    const sheetsToProcess = [
      { name: "ENERO - EL PARCHE TIENDA", mesNombre: "Enero", mes: "2026-01" },
      { name: "FEBRERO - EL PARCHE TIENDA", mesNombre: "Febrero", mes: "2026-02" },
      { name: "MARZO - EL PARCHE TIENDA", mesNombre: "Marzo", mes: "2026-03" },
      { name: "ABRIL - EL PARCHE TIENDA", mesNombre: "Abril", mes: "2026-04" },
      { name: "MAYO", mesNombre: "Mayo", mes: "2026-05" },
      { name: "JUNIO", mesNombre: "Junio", mes: "2026-06" },
      { name: "JULIO", mesNombre: "Julio", mes: "2026-07" }
    ];

    const getVal = (cell) => {
      if (cell === null || cell === undefined) return 0;
      if (typeof cell === "number") return cell;
      if (typeof cell === "object" && cell !== null && "result" in cell) {
        return typeof cell.result === "number" ? cell.result : 0;
      }
      const parsed = parseInt(String(cell).replace(/[$,.]/g, ""));
      return isNaN(parsed) ? 0 : parsed;
    };

    const allData = [];

    for (const sInfo of sheetsToProcess) {
      const sheet = workbook.getWorksheet(sInfo.name);
      if (!sheet) {
        console.log(`❌ No se encontró pestaña: ${sInfo.name}`);
        continue;
      }

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber < 3) return; // Saltar cabeceras
        
        const dayVal = row.getCell(1).value;
        if (dayVal === null || dayVal === undefined) return;

        const dayNum = typeof dayVal === "number" ? dayVal : parseInt(String(dayVal));
        if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) return; // No es una fila de día

        const ventasBrutas = getVal(row.getCell(2).value);
        const pagosTerceros = getVal(row.getCell(3).value);
        const ingresoReal = getVal(row.getCell(4).value);
        const gastos = getVal(row.getCell(5).value);
        const saldoDia = getVal(row.getCell(6).value);

        const diaStr = dayNum.toString().padStart(2, '0');
        const mesPart = sInfo.mes.split('-')[1];
        const fecha = `2026-${mesPart}-${diaStr}`;

        allData.push({
          mes: sInfo.mes,
          mesNombre: sInfo.mesNombre,
          dia: dayNum,
          fecha,
          ventasBrutas,
          pagosTerceros,
          ingresoReal,
          gastos,
          saldoDia
        });
      });
    }

    if (allData.length > 0) {
      const res = await prisma.historicoLibro.createMany({
        data: allData
      });
      console.log(`✅ ${res.count} registros históricos cargados exitosamente en una sola operación!`);
    } else {
      console.log("No se encontraron registros para importar.");
    }
  } catch (error) {
    console.error('❌ Error al cargar el histórico Excel:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importHistorico();
