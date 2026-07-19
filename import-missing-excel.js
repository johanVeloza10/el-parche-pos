const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function importMissing() {
  try {
    const files = [
      'CODIFICACIÓN LISTADO DE PRECIOS 2026 (1).xlsx',
      'CODIFICACIÓN LISTADO DE PRECIOS 2026 (P.V - P.C).xlsx'
    ];
    
    const prendasDb = await p.prenda.findMany({ select: { codigo: true } });
    const existingCodes = new Set(prendasDb.map(pr => pr.codigo));
    
    // Map of providers to ID
    const provs = await p.proveedor.findMany();
    const provMap = new Map();
    provs.forEach(pr => provMap.set(pr.nombre.toUpperCase().trim(), pr.id));
    
    let addedCount = 0;
    
    for (const file of files) {
      console.log("Reading file:", file);
      const workbook = xlsx.readFile(file);
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      
      for (const row of data) {
        const codigo = String(row['CÓDIGO'] || '').trim();
        if (!codigo) continue;
        
        if (!existingCodes.has(codigo)) {
          console.log(`Adding missing code: ${codigo}`);
          
          const descripcion = String(row['REFERENCIA'] || 'SIN DESCRIPCION').trim();
          let precio = parseInt(row['PRECIO']);
          if (isNaN(precio)) precio = 0;
          
          const marca = String(row['MARCA'] || '').trim().toUpperCase();
          const esPropia = marca === 'EL PARCHE' || marca === '';
          const origen = esPropia ? 'PRODUCCION_PROPIA' : 'CONSIGNACION';
          
          let proveedorId = null;
          if (!esPropia) {
            if (provMap.has(marca)) {
              proveedorId = provMap.get(marca);
            } else {
              // Create new provider if not exists
              const newProv = await p.proveedor.create({
                data: {
                  nombre: String(row['MARCA'] || 'Desconocido'),
                  tipoDocumento: 'NIT',
                  numeroDocumento: '000000000',
                  comisionDefaultPct: 30,
                  telefono: '0000000',
                  email: 'nodata@elparche.co',
                  direccion: 'N/A'
                }
              });
              provMap.set(marca, newProv.id);
              proveedorId = newProv.id;
              console.log(`Created new provider: ${marca}`);
            }
          }
          
          await p.prenda.create({
            data: {
              codigo: codigo,
              codigoBarras: codigo,
              descripcion: descripcion,
              precioVenta: precio,
              origen: origen,
              proveedorId: proveedorId,
              categoria: 'Prenda de Vestir',
              talla: 'UNICA',
              color: 'Multicolor',
              estado: 'EN_VITRINA'
            }
          });
          
          existingCodes.add(codigo);
          addedCount++;
        }
      }
    }
    
    console.log(`Total de prendas nuevas añadidas: ${addedCount}`);
  } catch(e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
}

importMissing();
