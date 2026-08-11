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
  'MUNDO CRECIENTE': 'DP21',
  'DEPARTAMENTO N°5': 'DP5'
};

async function analyzeNewList() {
  try {
    const filename = 'LISTA DE PRECIOS CODIFICADOS  2026 (P.V - P.C) (1).xlsx';
    console.log(`Analizando archivo: ${filename}...`);
    const workbook = xlsx.readFile(filename);
    
    // Contar cantidades en Excel
    const excelCounts = {}; // prefix -> { total: X, details: { codRaw: count } }
    let totalExcel = 0;
    
    for (const sheetName of workbook.SheetNames) {
      if (sheetName.toUpperCase() === 'INVENTARIO VENDIDO') continue;
      
      const prefix = brandPrefixes[sheetName.toUpperCase().trim()] || brandPrefixes[sheetName.trim()];
      if (!prefix) continue;
      
      if (!excelCounts[prefix]) {
        excelCounts[prefix] = { brand: sheetName, total: 0, details: {} };
      }
      
      const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
      for (const row of rows) {
        if (!row || row.length < 2) continue;
        const codRaw = String(row[0] || '').trim();
        if (codRaw.toUpperCase() === 'CÓDIGO' || codRaw === '') continue;
        
        // Verifica si es un número (código válido)
        if (!isNaN(parseInt(codRaw))) {
          const codNum = parseInt(codRaw);
          excelCounts[prefix].total++;
          totalExcel++;
          if (!excelCounts[prefix].details[codNum]) excelCounts[prefix].details[codNum] = 0;
          excelCounts[prefix].details[codNum]++;
        }
      }
    }
    
    // Traer todos los códigos desde la DB
    const prendasDb = await p.prenda.findMany({
      select: { codigo: true, estado: true, proveedor: { select: { nombre: true } } }
    });
    
    const dbCounts = {}; // prefix -> { vitrina: X, vendida: X, total: X }
    let totalDbVitrina = 0;
    
    for (const prenda of prendasDb) {
      const match = prenda.codigo.match(/^(DP\d+)C/);
      if (match) {
        const prefix = match[1];
        if (!dbCounts[prefix]) dbCounts[prefix] = { vitrina: 0, vendida: 0, total: 0 };
        dbCounts[prefix].total++;
        if (prenda.estado === 'EN_VITRINA') {
          dbCounts[prefix].vitrina++;
          totalDbVitrina++;
        } else if (prenda.estado === 'VENDIDA') {
          dbCounts[prefix].vendida++;
        }
      }
    }
    
    console.log(`\n================ RESULTADOS ================`);
    console.log(`Total prendas en el nuevo Excel: ${totalExcel}`);
    console.log(`Total prendas EN_VITRINA en el POS: ${totalDbVitrina}`);
    console.log(`Total prendas en POS (Todos los estados): ${prendasDb.length}`);
    
    console.log(`\n--- Desglose por Diseñador (Excel vs POS) ---`);
    for (const [prefix, data] of Object.entries(excelCounts)) {
      const posVitrina = dbCounts[prefix]?.vitrina || 0;
      const posVendida = dbCounts[prefix]?.vendida || 0;
      const posTotal = dbCounts[prefix]?.total || 0;
      
      const diffVitrina = data.total - posVitrina;
      
      console.log(`${data.brand} (${prefix}):`);
      console.log(`   - En el Excel hay: ${data.total} prendas.`);
      console.log(`   - En el POS hay: ${posVitrina} EN VITRINA (y ${posVendida} VENDIDAS) -> Total DB: ${posTotal}`);
      
      if (diffVitrina === 0) {
        console.log(`   ✅ CUADRA EXACTO (Excel == POS Vitrina)`);
      } else if (data.total === posTotal) {
        console.log(`   ℹ️ CUADRA CON HISTÓRICO: El Excel tiene prendas que ya marcamos como VENDIDAS en el POS.`);
      } else {
        console.log(`   ⚠️ DESCUADRE: Diferencia de ${Math.abs(diffVitrina)} prendas.`);
      }
    }
    
  } catch (e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
}
analyzeNewList();
