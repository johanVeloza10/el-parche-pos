const xlsx = require('xlsx');

function parseAllSales() {
  const workbook = xlsx.readFile('REPORTE DE VENTAS 2026.xlsx');
  
  const excludeSheets = ['TOTAL VENTAS MES', 'PAGOS PENDIENTES'];
  const sheetsToParse = workbook.SheetNames.filter(name => !excludeSheets.includes(name));
  
  let totalItemsCount = 0;
  let itemsBySheet = {};
  
  for (const sheetName of sheetsToParse) {
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    let currentMarca = sheetName; // fallback if no MARCA: header found
    let currentMes = '';
    let sheetItemsCount = 0;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const firstCell = String(row[0] || '').trim();
      
      if (firstCell.toUpperCase().startsWith('MARCA:')) {
        currentMarca = firstCell.replace(/MARCA:/i, '').trim();
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
      
      // Check if it's a data row (code in column 1/index 1 must be a number)
      const cod = row[1];
      if (cod !== undefined && !isNaN(parseInt(cod)) && String(cod).trim() !== '') {
        sheetItemsCount++;
        totalItemsCount++;
      }
    }
    itemsBySheet[sheetName] = {
      marca: currentMarca,
      count: sheetItemsCount
    };
  }
  
  console.log(`Total sold items across all sheets: ${totalItemsCount}`);
  console.log("Items per sheet summary:");
  console.log(itemsBySheet);
}
parseAllSales();
