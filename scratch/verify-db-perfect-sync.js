const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function verify() {
  try {
    const filename = 'LISTA DE PRECIOS CODIFICADOS  2026 (P.V - P.C) (1).xlsx';
    const workbook = xlsx.readFile(filename);
    const sheet = workbook.Sheets['CODIFICACIÓN'];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    let totalExcelRows = 0;
    let totalExcelQuantity = 0;
    const excelExpectations = {};
    
    // Read all rows
    for (let i = 1; i < rows.length; i++) { // Skip header row
      const row = rows[i];
      if (!row || row.length < 2) continue;
      
      const codigo = String(row[0] || '').trim().toUpperCase();
      if (!codigo || codigo === 'CÓDIGO' || codigo === 'UNDEFINED') continue;
      
      const desc = String(row[1] || '').trim();
      const cantidad = parseInt(row[2]) || 0;
      const precioVenta = parseInt(row[3]) || 0;
      const precioConsignacion = parseInt(row[4]) || 0;
      const marca = String(row[5] || '').trim();
      
      if (cantidad > 0) {
        totalExcelRows++;
        totalExcelQuantity += cantidad;
        
        excelExpectations[codigo] = {
          cantidad,
          desc,
          precioVenta,
          precioConsignacion,
          marca,
          rowNumber: i + 1
        };
      }
    }
    
    // Fetch all items from DB
    const dbPrendas = await p.prenda.findMany();
    const dbCounts = {};
    for (const prenda of dbPrendas) {
      const baseCode = prenda.codigo.split('-')[0].toUpperCase();
      if (!dbCounts[baseCode]) dbCounts[baseCode] = 0;
      dbCounts[baseCode]++;
    }
    
    let missingErrors = [];
    for (const [code, info] of Object.entries(excelExpectations)) {
      const currentInDb = dbCounts[code] || 0;
      if (currentInDb < info.cantidad) {
        missingErrors.push(`Fila ${info.rowNumber}: Código ${code} (${info.marca} - ${info.desc}) -> Excel pide ${info.cantidad}, pero en POS solo hay ${currentInDb}`);
      }
    }
    
    console.log("=== REPORTE DE FALTANTES DEL EXCEL ===");
    console.log(`Total de filas con cantidad > 0 leídas del Excel: ${totalExcelRows}`);
    console.log(`Total de prendas físicas sumadas de todas las celdas de cantidad: ${totalExcelQuantity}`);
    
    if (missingErrors.length === 0) {
      console.log("✅ PERFECTO: Absolutamente todas las prendas y cantidades indicadas en el Excel están completas en el sistema POS. ¡No se saltó ninguna!");
    } else {
      console.log(`❌ ALERTA: Aún faltan prendas para algunas referencias:`);
      missingErrors.forEach(e => console.log(e));
    }
    
  } catch (e) {
    console.error("Error en verificación:", e);
  } finally {
    await p.$disconnect();
  }
}

verify();
