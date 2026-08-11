const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const marcaMap = {
  'EL PARCHE': 'DP1',
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

async function inject() {
  try {
    // 1. Map all providers by name/id
    const proveedores = await p.proveedor.findMany();
    const provNameToId = {};
    for (const prov of proveedores) {
      provNameToId[prov.nombre.toUpperCase()] = prov.id;
    }
    
    // Helper to find provider ID
    const getProvId = (marca) => {
      const upperMarca = marca.toUpperCase().trim();
      const mappedId = marcaMap[upperMarca];
      
      if (mappedId) {
        // Find exact provider by ID
        const match = proveedores.find(pr => pr.id === mappedId);
        if (match) return match.id;
      }
      
      // Fallback: search by name
      for (const prov of proveedores) {
        if (prov.nombre.toUpperCase().includes(upperMarca) || upperMarca.includes(prov.nombre.toUpperCase())) {
          return prov.id;
        }
      }
      
      // If El Parche or EKA, fallback to DP1
      if (upperMarca.includes('PARCHE') || upperMarca.includes('EKA')) return 'DP1';
      
      return null;
    };

    console.log("Leyendo archivo Excel...");
    const filename = 'LISTA DE PRECIOS CODIFICADOS  2026 (P.V - P.C) (1).xlsx';
    const workbook = xlsx.readFile(filename);
    const sheet = workbook.Sheets['CODIFICACIÓN'];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    let injectedCount = 0;
    
    // Group DB items by base code
    const prendasDb = await p.prenda.findMany();
    const dbGroups = {}; // baseCode -> array of prendas
    
    for (const prenda of prendasDb) {
      const baseCode = prenda.codigo.split('-')[0].toUpperCase();
      if (!dbGroups[baseCode]) dbGroups[baseCode] = [];
      dbGroups[baseCode].push(prenda);
    }
    
    console.log("Iniciando inyección de cantidades...");
    
    for (const row of rows) {
      if (!row || row.length < 2) continue;
      const codRaw = String(row[0] || '').trim().toUpperCase();
      if (codRaw === 'CÓDIGO' || codRaw === '' || codRaw === 'UNDEFINED') continue;
      
      const desc = String(row[1] || '').trim();
      const cantidad = parseInt(row[2]) || 0;
      const precioVenta = parseInt(row[3]) || 0;
      const precioConsignacion = parseInt(row[4]) || 0;
      const marca = String(row[5] || '').trim();
      
      if (cantidad <= 0) continue;
      
      const existingItems = dbGroups[codRaw] || [];
      const currentQty = existingItems.length;
      
      if (currentQty < cantidad) {
        const missing = cantidad - currentQty;
        console.log(`[${codRaw}] Faltan ${missing} prendas. Creando...`);
        
        let template = null;
        if (existingItems.length > 0) {
          // Clone the first existing one
          template = existingItems[0];
        } else {
          // It doesn't exist at all, we must create a template from scratch
          const provId = getProvId(marca);
          if (!provId) {
            console.log(`  -> ⚠️ Advertencia: No se encontró proveedor para la marca '${marca}'. Usando nulo.`);
          }
          template = {
            descripcion: desc,
            categoria: 'GENERAL',
            talla: 'ÚNICA',
            color: 'N/A',
            precioVenta: precioVenta,
            valorProveedor: precioConsignacion,
            comisionPct: null,
            modoComision: 'PORCENTAJE',
            proveedorId: provId,
            origen: 'CONSIGNACION'
          };
        }
        
        // Find highest existing suffix to append
        let highestSuffix = 0;
        for (const item of existingItems) {
          if (item.codigo === codRaw) highestSuffix = Math.max(highestSuffix, 1);
          if (item.codigo.includes('-')) {
            const suf = parseInt(item.codigo.split('-')[1]);
            if (!isNaN(suf)) highestSuffix = Math.max(highestSuffix, suf);
          }
        }
        
        // Inyect missing
        for (let i = 1; i <= missing; i++) {
          let nextSuffix = highestSuffix + i;
          // Si highestSuffix es 0 y es el primer item, el código puede ser solo "codRaw", pero como ya dijimos 
          // missing = cantidad - 0, y highest = 0, el primer item sera codRaw-1 (o codRaw)
          // Mejor siempre usar guion para evitar conflictos si el codigo ya existe.
          let newCodigo = existingItems.length === 0 && i === 1 ? codRaw : `${codRaw}-${nextSuffix}`;
          
          await p.prenda.create({
            data: {
              codigo: newCodigo,
              codigoBarras: newCodigo,
              descripcion: template.descripcion || desc,
              categoria: template.categoria || 'GENERAL',
              talla: template.talla || 'ÚNICA',
              color: template.color || 'N/A',
              precioVenta: template.precioVenta > 0 ? template.precioVenta : precioVenta,
              valorProveedor: template.valorProveedor > 0 ? template.valorProveedor : precioConsignacion,
              comisionPct: template.comisionPct,
              modoComision: template.modoComision || 'PORCENTAJE',
              proveedorId: template.proveedorId,
              origen: template.origen || 'CONSIGNACION',
              estado: 'EN_VITRINA' // Siempre entran a vitrina
            }
          });
          injectedCount++;
        }
      }
    }
    
    console.log(`\n🎉 PROCESO COMPLETADO.`);
    console.log(`Se inyectaron un total de ${injectedCount} prendas nuevas al inventario para cuadrar con el Excel.`);
    
  } catch (e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
}

inject();
