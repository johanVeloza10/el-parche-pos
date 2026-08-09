const xlsx = require('xlsx');

function parseSales() {
  const workbook = xlsx.readFile('REPORTE DE VENTAS 2026.xlsx');
  console.log("Sheet names in REPORTE DE VENTAS 2026.xlsx:", workbook.SheetNames);
  const sheetName = workbook.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
  
  let currentMarca = '';
  let currentMes = '';
  let items = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const firstCell = String(row[0] || '').trim();
    
    if (firstCell.startsWith('MARCA:')) {
      currentMarca = firstCell.replace('MARCA:', '').trim();
      continue;
    }
    
    if (firstCell.startsWith('MES:')) {
      currentMes = firstCell.replace('MES:', '').trim();
      continue;
    }
    
    if (firstCell === 'FECHA' || firstCell === 'FECHA ') {
      // Header row
      continue;
    }
    
    if (firstCell.startsWith('TOTAL VENTAS') || firstCell.startsWith('TOTAL A PAGAR') || firstCell.startsWith('REPORTE DE VENTAS')) {
      continue;
    }
    
    // Check if it's a data row
    const cod = row[1];
    if (cod !== undefined && !isNaN(parseInt(cod))) {
      items.push({
        marca: currentMarca,
        mes: currentMes,
        fecha: firstCell,
        cod: parseInt(cod),
        referencia: row[2],
        precioVenta: parseInt(row[3]) || 0,
        precioProveedor: parseInt(row[4]) || 0,
        comisionTienda: parseInt(row[5]) || 0
      });
    }
  }
  
  console.log(`Total items sold in report: ${items.length}`);
  const marcas = [...new Set(items.map(it => it.marca))];
  const meses = [...new Set(items.map(it => it.mes))];
  console.log("Brands found:", marcas);
  console.log("Months found:", meses);
  
  // Show first 5 items
  console.log("First 5 items sample:", items.slice(0, 5));
}
parseSales();
