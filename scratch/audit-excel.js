const xlsx = require('xlsx');

function auditExcel() {
  const filename = 'LISTA DE PRECIOS CODIFICADOS  2026 (P.V - P.C) (1).xlsx';
  console.log(`Iniciando auditoría profunda del archivo: ${filename}\n`);
  
  const workbook = xlsx.readFile(filename);
  const sheet = workbook.Sheets['CODIFICACIÓN'];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  const seenCodes = {};
  const anomalies = {
    duplicates: [],
    missingPrices: [],
    zeroQuantities: [],
    missingDesc: [],
    weirdBrands: [],
    totalRowsAnalyzed: 0,
    totalExpectedGarments: 0
  };
  
  // Asumimos que la fila 0 es el encabezado
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;
    
    anomalies.totalRowsAnalyzed++;
    
    const codRaw = String(row[0] || '').trim().toUpperCase();
    const desc = String(row[1] || '').trim();
    const cantidad = parseInt(row[2]);
    const precioVenta = parseInt(row[3]);
    const precioConsignacion = parseInt(row[4]);
    const marca = String(row[5] || '').trim();
    
    // 1. Check empty or invalid codes
    if (!codRaw || codRaw === 'CÓDIGO' || codRaw === 'UNDEFINED') {
      continue;
    }
    
    // 2. Check for duplicates
    if (seenCodes[codRaw]) {
      anomalies.duplicates.push(`Fila ${i + 1}: El código ${codRaw} está repetido. Ya había aparecido en la fila ${seenCodes[codRaw]}.`);
    } else {
      seenCodes[codRaw] = i + 1;
    }
    
    // 3. Check for zero or invalid quantities
    if (isNaN(cantidad) || cantidad <= 0) {
      if (desc.toUpperCase() !== 'DAÑADO') {
        anomalies.zeroQuantities.push(`Fila ${i + 1}: Código ${codRaw} tiene cantidad ${row[2]} (Cero, nula o texto inválido) pero no dice 'DAÑADO'.`);
      }
    } else {
      anomalies.totalExpectedGarments += cantidad;
    }
    
    // 4. Check missing prices
    if ((isNaN(precioVenta) || precioVenta <= 0) && desc.toUpperCase() !== 'DAÑADO') {
      anomalies.missingPrices.push(`Fila ${i + 1}: Código ${codRaw} no tiene precio de venta válido (${row[3]}).`);
    }
    
    // 5. Check missing descriptions
    if (!desc || desc === '') {
      anomalies.missingDesc.push(`Fila ${i + 1}: Código ${codRaw} no tiene descripción/referencia.`);
    }
    
    // 6. Check strange brands
    if (!marca || marca.length < 2) {
      anomalies.weirdBrands.push(`Fila ${i + 1}: Código ${codRaw} no tiene una marca/diseñador especificado.`);
    }
  }
  
  // Output report
  console.log("=== RESULTADOS DE LA AUDITORÍA DE CALIDAD DEL EXCEL ===");
  console.log(`Total de filas reales analizadas: ${anomalies.totalRowsAnalyzed}`);
  console.log(`Total prendas físicas sumadas (solo cantidades > 0): ${anomalies.totalExpectedGarments}`);
  
  console.log(`\n1. CÓDIGOS REPETIDOS: ${anomalies.duplicates.length}`);
  anomalies.duplicates.forEach(a => console.log("   - " + a));
  
  console.log(`\n2. SIN DESCRIPCIÓN/REFERENCIA: ${anomalies.missingDesc.length}`);
  anomalies.missingDesc.forEach(a => console.log("   - " + a));
  
  console.log(`\n3. PRECIOS INVÁLIDOS O EN CERO (Que no son Dañados): ${anomalies.missingPrices.length}`);
  anomalies.missingPrices.slice(0, 15).forEach(a => console.log("   - " + a));
  if (anomalies.missingPrices.length > 15) console.log(`   ... y ${anomalies.missingPrices.length - 15} más.`);
  
  console.log(`\n4. CANTIDADES EN CERO O VACÍAS (Que no son Dañados): ${anomalies.zeroQuantities.length}`);
  anomalies.zeroQuantities.slice(0, 15).forEach(a => console.log("   - " + a));
  if (anomalies.zeroQuantities.length > 15) console.log(`   ... y ${anomalies.zeroQuantities.length - 15} más.`);
  
  console.log(`\n5. SIN MARCA DEFINIDA: ${anomalies.weirdBrands.length}`);
  anomalies.weirdBrands.forEach(a => console.log("   - " + a));

}

auditExcel();
