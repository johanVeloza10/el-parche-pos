const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const brandPrefixes = {
  'EKA': 'DP1',
  'MANDALA': 'DP17',
  'CLAVELITO': 'DP11',
  'ESTEFANÍA': 'DP9',
  'ANIMALEJA': 'DP13',
  'MALEJA CORREA': 'DP15',
  'AJÍ PICAFLOR': 'DP12',
  'EMCI': 'DP14',
  'DUE': 'DP14',
  'R3': 'DP29',
  'SUMERCÉ': 'DP4',
  'TSURU': 'DP24',
  'ELVIRA LAGO': 'DP3',
  'ELVIRA': 'DP3',
  'PALOMA': 'DP23',
  'MI CAJITA PÚRPURA': 'DP28',
  'MAMBÍ': 'DP19',
  'MARAHÉ': 'DP16',
  'SEMILLA COLECTIVO': 'DP10',
  'MUNDO CRECIENTE': 'DP21'
};

function parseExcelDate(dateStr, mesStr) {
  const yearMatch = String(mesStr).match(/\d{4}/);
  const year = yearMatch ? parseInt(yearMatch[0]) : 2026;
  
  const dayMatch = String(dateStr).match(/^\d+/);
  const day = dayMatch ? parseInt(dayMatch[0]) : 1;
  
  const monthNames = {
    'ENERO': 0, 'FEBRERO': 1, 'MARZO': 2, 'ABRIL': 3, 'MAYO': 4, 'JUNIO': 5,
    'JULIO': 6, 'AGOSTO': 7, 'SEPTIEMBRE': 8, 'OCTUBRE': 9, 'NOVIEMBRE': 10, 'DICIEMBRE': 11
  };
  
  const cleanMes = String(mesStr).split(' ')[0].toUpperCase().trim();
  const month = monthNames[cleanMes] !== undefined ? monthNames[cleanMes] : 0;
  
  return new Date(year, month, day, 12, 0, 0);
}

async function syncSales() {
  try {
    const workbook = xlsx.readFile('REPORTE DE VENTAS 2026.xlsx');
    const excludeSheets = ['TOTAL VENTAS MES', 'PAGOS PENDIENTES'];
    const sheetsToParse = workbook.SheetNames.filter(name => !excludeSheets.includes(name));
    
    // Find admin user
    const admin = await p.usuario.findFirst({
      where: { rol: 'ADMIN' }
    });
    if (!admin) {
      throw new Error("No admin user found in database!");
    }
    
    // Load all garments
    const prendasDb = await p.prenda.findMany();
    const dbCodesMap = new Map();
    prendasDb.forEach(pr => dbCodesMap.set(pr.codigo, pr));
    
    // Load existing items sold
    const itemsVentaDb = await p.itemVenta.findMany({ select: { prendaId: true } });
    const existingSoldPrendas = new Set(itemsVentaDb.map(it => it.prendaId));
    
    let totalExcelSales = 0;
    let alreadyImportedCount = 0;
    let newlyImportedCount = 0;
    let unmatchedCount = 0;
    
    for (const sheetName of sheetsToParse) {
      const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
      const prefix = brandPrefixes[sheetName.toUpperCase().trim()] || brandPrefixes[sheetName.trim()];
      
      if (!prefix) continue;
      
      let currentMes = '';
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        
        const firstCell = String(row[0] || '').trim();
        if (firstCell.toUpperCase().startsWith('MARCA:')) {
          continue;
        }
        
        if (firstCell.toUpperCase().startsWith('MES:')) {
          currentMes = firstCell.replace(/MES:/i, '').trim();
          continue;
        }
        
        if (firstCell.toUpperCase() === 'FECHA' || firstCell.toUpperCase() === 'FECHA ') {
          continue;
        }
        
        if (firstCell.toUpperCase().startsWith('TOTAL VENTAS') || 
            firstCell.toUpperCase().startsWith('TOTAL A PAGAR') || 
            firstCell.toUpperCase().startsWith('REPORTE DE VENTAS')) {
          continue;
        }
        
        const codRaw = row[1];
        if (codRaw !== undefined && !isNaN(parseInt(codRaw)) && String(codRaw).trim() !== '') {
          totalExcelSales++;
          const codNum = parseInt(codRaw);
          const codStr = String(codNum).padStart(3, '0');
          let garmentCode = `${prefix}C${codStr}`;
          
          let prenda = dbCodesMap.get(garmentCode);
          if (!prenda) {
            // Try without padding
            garmentCode = `${prefix}C${codNum}`;
            prenda = dbCodesMap.get(garmentCode);
          }
          
          if (!prenda) {
            unmatchedCount++;
            continue;
          }
          
          // Check if already has a sale record
          if (existingSoldPrendas.has(prenda.id)) {
            alreadyImportedCount++;
            continue;
          }
          
          // Parse sale info
          const fechaVenta = parseExcelDate(firstCell, currentMes);
          const precioVenta = parseInt(row[3]) || 0;
          const precioProveedor = parseInt(row[4]) || 0;
          const comisionTienda = parseInt(row[5]) || 0;
          
          // Create sale transaction
          await p.$transaction(async (tx) => {
            // 1. Create Venta
            const venta = await tx.venta.create({
              data: {
                usuarioId: admin.id,
                fechaHora: fechaVenta,
                medioPago: 'EFECTIVO',
                subtotal: precioVenta,
                total: precioVenta,
                anulada: false
              }
            });
            
            // 2. Create ItemVenta
            await tx.itemVenta.create({
              data: {
                ventaId: venta.id,
                prendaId: prenda.id,
                precioVenta: precioVenta,
                comisionBoutique: comisionTienda,
                paraProveedor: precioProveedor,
                esProduccionPropia: prenda.origen === 'PRODUCCION_PROPIA',
                costoProduccion: prenda.costoProduccion
              }
            });
            
            // 3. Update Prenda state to VENDIDA
            await tx.prenda.update({
              where: { id: prenda.id },
              data: {
                estado: 'VENDIDA',
                fechaVenta: fechaVenta
              }
            });
            
            // Add audit log
            await tx.auditLog.create({
              data: {
                entidad: 'Prenda',
                entidadId: prenda.id,
                accion: 'VENTA',
                usuarioId: admin.id,
                motivo: 'Importación histórica desde Excel',
                valorNuevo: JSON.stringify({ estado: 'VENDIDA', fechaVenta })
              }
            });
          });
          
          existingSoldPrendas.add(prenda.id);
          newlyImportedCount++;
        }
      }
    }
    
    console.log(`Sync Completed!`);
    console.log(`- Total sales in Excel: ${totalExcelSales}`);
    console.log(`- Already imported previously: ${alreadyImportedCount}`);
    console.log(`- Newly imported: ${newlyImportedCount}`);
    console.log(`- Unmatched (skipped): ${unmatchedCount}`);
  } catch(e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
}

syncSales();
