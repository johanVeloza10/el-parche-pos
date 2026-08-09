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

async function testMatch() {
  try {
    const workbook = xlsx.readFile('REPORTE DE VENTAS 2026.xlsx');
    const excludeSheets = ['TOTAL VENTAS MES', 'PAGOS PENDIENTES'];
    const sheetsToParse = workbook.SheetNames.filter(name => !excludeSheets.includes(name));
    
    // Load all DB codes into memory
    const prendasDb = await p.prenda.findMany({ select: { id: true, codigo: true, precioVenta: true, estado: true } });
    const dbCodesMap = new Map();
    prendasDb.forEach(pr => dbCodesMap.set(pr.codigo, pr));
    
    console.log(`Loaded ${dbCodesMap.size} garments from DB into memory.`);
    
    let totalRows = 0;
    let matched = 0;
    let unmatched = [];
    
    for (const sheetName of sheetsToParse) {
      const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
      const prefix = brandPrefixes[sheetName.toUpperCase().trim()] || brandPrefixes[sheetName.trim()];
      
      if (!prefix) {
        console.log(`⚠️ No prefix found for sheet: ${sheetName}`);
        continue;
      }
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        
        const firstCell = String(row[0] || '').trim();
        if (firstCell.toUpperCase().startsWith('MARCA:') || 
            firstCell.toUpperCase().startsWith('MES:') || 
            firstCell.toUpperCase() === 'FECHA' || 
            firstCell.toUpperCase() === 'FECHA ' ||
            firstCell.toUpperCase().startsWith('TOTAL VENTAS') || 
            firstCell.toUpperCase().startsWith('TOTAL A PAGAR') || 
            firstCell.toUpperCase().startsWith('REPORTE DE VENTAS')) {
          continue;
        }
        
        const codRaw = row[1];
        if (codRaw !== undefined && !isNaN(parseInt(codRaw)) && String(codRaw).trim() !== '') {
          totalRows++;
          const codNum = parseInt(codRaw);
          // Pad code to 3 digits (e.g. 3 -> 003)
          const codStr = String(codNum).padStart(3, '0');
          const garmentCode = `${prefix}C${codStr}`;
          
          if (dbCodesMap.has(garmentCode)) {
            matched++;
          } else {
            // Try matching without padding (e.g. DP1C65 if DP1C065 doesn't exist)
            const garmentCodeNoPad = `${prefix}C${codNum}`;
            if (dbCodesMap.has(garmentCodeNoPad)) {
              matched++;
            } else {
              unmatched.push({ sheet: sheetName, row: i, code: codRaw, attemptedCode: garmentCode });
            }
          }
        }
      }
    }
    
    console.log(`Total rows checked: ${totalRows}`);
    console.log(`Matched garments: ${matched}`);
    console.log(`Unmatched garments: ${unmatched.length}`);
    if (unmatched.length > 0) {
      console.log("Unmatched sample:", unmatched.slice(0, 20));
    }
  } catch(e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
}
testMatch();
