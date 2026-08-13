const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const filenameMap = {
  'CLAVELITO COLORADO': 'CLAVELITO',
  'CRECIENTE CALZADO': 'CRECIENTE',
  'DUE DISEÑO': 'DUE',
  'EL PARCHE': 'PARCHE',
  'EN LLAMAS': 'LLAMAS', // we'll need to see if this exists
  'ERRE TRES': 'R3',
  'ESTEFANÍA': 'ESTEFANÍA',
  'MAMBÍ': 'MAMBÍ',
  'MANDALA TEXTIL': 'MANDALA',
  'MARAHÉ': 'MARAHÉ',
  'PALOMA': 'PALOMA',
  'PLEGADOS TSURU': 'TSURU',
  'SEMILLA COLECTIVO': 'SEMILLA',
  'SU MERCÉ': 'SUMERCÉ'
};

async function sync() {
  try {
    console.log("Iniciando sincronización masiva de 14 proveedores...");
    
    // 1. Obtener proveedores de la BD
    const proveedores = await p.proveedor.findMany();
    const provIdMap = {}; // filename (sin .xlsx) -> id
    
    const files = fs.readdirSync(process.cwd()).filter(f => 
      f.endsWith('.xlsx') && 
      !f.startsWith('~') && 
      !f.toUpperCase().includes('REPORTE') && 
      !f.toUpperCase().includes('LIBRO') && 
      !f.toUpperCase().includes('CODIFICA') && 
      !f.toUpperCase().includes('LISTA')
    );
    console.log(`Archivos encontrados para procesar (${files.length}):`, files);
    
    for (const f of files) {
      const baseName = f.replace('.xlsx', '').toUpperCase().trim();
      const searchKey = filenameMap[baseName] || baseName;
      
      let matchedId = null;
      for (const prov of proveedores) {
        if (prov.nombre.toUpperCase().includes(searchKey) || searchKey.includes(prov.nombre.toUpperCase())) {
          matchedId = prov.id;
          break;
        }
      }
      if (!matchedId) {
        console.warn(`⚠️ ALERTA: No se encontró proveedor exacto para el archivo "${f}". Se asignará al por defecto (El Parche).`);
        matchedId = proveedores.find(pr => pr.nombre.toUpperCase().includes('PARCHE'))?.id || null;
      }
      provIdMap[f] = matchedId;
    }
    
    // 2. Procesar cada archivo
    let totalInyectadas = 0;
    let totalDadasDeBaja = 0;
    let totalActualizadas = 0;
    let catalogosCreados = 0;
    
    for (const f of files) {
      console.log(`\n=================================================`);
      console.log(`Procesando archivo: ${f}`);
      const provId = provIdMap[f];
      if (!provId) continue;
      
      const workbook = xlsx.readFile(path.join(process.cwd(), f));
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;
        
        const codRaw = String(row[0] || '').trim().toUpperCase();
        if (!codRaw || codRaw === 'CÓDIGO' || codRaw === 'UNDEFINED' || codRaw.startsWith('CÓD')) continue;
        
        const desc = String(row[1] || '').trim();
        const cantidadExcel = parseInt(row[2]) || 0;
        let precioVenta = parseInt(row[3]) || 0;
        let precioConsignacion = parseInt(row[4]) || 0;
        
        // Si el Excel no tiene precios, ponemos defaults para no romper
        if (precioVenta === 0) precioVenta = 1000;
        if (precioConsignacion === 0) precioConsignacion = Math.round(precioVenta * 0.7);
        
        // 3. Buscar TODAS las prendas con este código base en la BD
        const prendasExistentes = await p.prenda.findMany({
          where: {
            codigo: { startsWith: codRaw }
          }
        });
        
        // Filtramos para asegurar que el codigo base coincide (evitar que DP1 match DP10)
        // Ejemplo: si el código en bd es "DP1C003-2", al hacer split por "-" el base es "DP1C003"
        const prendasDelCodigo = prendasExistentes.filter(p => p.codigo.split('-')[0].toUpperCase() === codRaw);
        
        // Contamos cuántas están en vitrina físicamente
        const enVitrina = prendasDelCodigo.filter(p => p.estado === 'EN_VITRINA');
        const cantidadBD = enVitrina.length;
        
        // 4. Actualizar descripción, precio y proveedor de las que SÍ existen
        if (prendasDelCodigo.length > 0) {
          for (const pr of prendasDelCodigo) {
            // Actualizamos si algo cambió
            if (pr.descripcion !== desc || pr.precioVenta !== precioVenta || pr.proveedorId !== provId) {
              await p.prenda.update({
                where: { id: pr.id },
                data: {
                  descripcion: desc || pr.descripcion, // Si el excel viene vacio, dejamos el que tenia
                  precioVenta: precioVenta > 1000 ? precioVenta : pr.precioVenta,
                  valorProveedor: precioConsignacion > 1000 ? precioConsignacion : pr.valorProveedor,
                  proveedorId: provId
                }
              });
              totalActualizadas++;
            }
          }
        }
        
        // 5. Lógica de Diferencial (Crear o Dar de Baja)
        if (cantidadExcel === 0 && prendasDelCodigo.length === 0) {
          // El código viene vacío/cero en el Excel y NUNCA se ha creado en el POS.
          // Lo creamos como catálogo en estado DADA_BAJA.
          await p.prenda.create({
            data: {
              codigo: codRaw,
              codigoBarras: codRaw,
              descripcion: desc || "REF SIN DESCRIPCIÓN",
              categoria: 'GENERAL',
              talla: 'ÚNICA',
              color: 'N/A',
              precioVenta,
              valorProveedor: precioConsignacion,
              modoComision: 'PORCENTAJE',
              proveedorId: provId,
              origen: 'CONSIGNACION',
              estado: 'DADA_BAJA' // <--- No suma en inventario
            }
          });
          catalogosCreados++;
          console.log(`[CATÁLOGO] Creada ref vacía ${codRaw}`);
          
        } else if (cantidadExcel > cantidadBD) {
          // Faltan prendas en el POS, hay que inyectar
          const faltantes = cantidadExcel - cantidadBD;
          
          // Buscar el sufijo más alto para no chocar códigos
          let maxSuffix = 0;
          for (const pr of prendasDelCodigo) {
            if (pr.codigo === codRaw) maxSuffix = Math.max(maxSuffix, 1);
            if (pr.codigo.includes('-')) {
              const suf = parseInt(pr.codigo.split('-')[1]);
              if (!isNaN(suf)) maxSuffix = Math.max(maxSuffix, suf);
            }
          }
          
          for (let k = 1; k <= faltantes; k++) {
            const nextSuffix = maxSuffix + k;
            const newCodigo = prendasDelCodigo.length === 0 && k === 1 ? codRaw : `${codRaw}-${nextSuffix}`;
            
            await p.prenda.create({
              data: {
                codigo: newCodigo,
                codigoBarras: newCodigo,
                descripcion: desc || "REF SIN DESCRIPCIÓN",
                categoria: 'GENERAL',
                talla: 'ÚNICA',
                color: 'N/A',
                precioVenta,
                valorProveedor: precioConsignacion,
                modoComision: 'PORCENTAJE',
                proveedorId: provId,
                origen: 'CONSIGNACION',
                estado: 'EN_VITRINA'
              }
            });
            totalInyectadas++;
          }
          console.log(`[INYECCIÓN] ${codRaw} -> Se inyectaron ${faltantes} unds (Excel pide ${cantidadExcel}, POS tenía ${cantidadBD})`);
          
        } else if (cantidadExcel < cantidadBD) {
          // Sobran prendas en el POS, hay que dar de baja
          const sobrantes = cantidadBD - cantidadExcel;
          
          // Tomamos las primeras 'sobrantes' de enVitrina
          for (let k = 0; k < sobrantes; k++) {
            const prendaBajar = enVitrina[k];
            await p.prenda.update({
              where: { id: prendaBajar.id },
              data: { estado: 'DADA_BAJA' }
            });
            totalDadasDeBaja++;
          }
          console.log(`[AJUSTE] ${codRaw} -> Se dieron de baja ${sobrantes} unds (Excel pide ${cantidadExcel}, POS tenía ${cantidadBD})`);
        }
        
      }
    }
    
    console.log(`\n🎉 PROCESO COMPLETADO EXITOSAMENTE.`);
    console.log(`Prendas inyectadas (Nuevas): ${totalInyectadas}`);
    console.log(`Prendas retiradas de vitrina (Sobraban): ${totalDadasDeBaja}`);
    console.log(`Prendas actualizadas (Nombres/Precios): ${totalActualizadas}`);
    console.log(`Referencias de Catálogo guardadas (Cant. 0): ${catalogosCreados}`);
    
  } catch (e) {
    console.error("Error fatal durante la sincronización:", e);
  } finally {
    await p.$disconnect();
  }
}

sync();
