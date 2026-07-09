import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando importación de catálogo desde Excel...");

  const files = fs.readdirSync(".").filter(f => f.endsWith(".xlsx") && f.includes("P.V - P.C"));
  if (files.length === 0) {
    console.error("❌ No se encontró el archivo Excel 'CODIFICACIÓ́N LISTADO DE PRECIOS 2026 (P.V - P.C).xlsx'");
    process.exit(1);
  }

  const excelPath = files[0];
  console.log(`📖 Leyendo archivo: ${excelPath}`);
  
  const wb = XLSX.readFile(excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  
  // Leer todas las filas
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  
  // F0: ["CÓDIGO","REFERENCIA","PRECIO VENTA","PRECIO CONSIGNACIÓN ","MARCA"]
  const headers = rows[0];
  console.log("Encabezados encontrados:", headers);

  let creadosProveedores = 0;
  let creadasPrendas = 0;
  let actualizadasPrendas = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const codigo = row[0]?.toString().trim();
    const referencia = row[1]?.toString().trim();
    const precioVentaRaw = row[2];
    const precioConsignacionRaw = row[3];
    const marcaRaw = row[4]?.toString().trim();

    if (!codigo || !referencia) continue;

    const precioVenta = Math.round(Number(precioVentaRaw) || 0);
    const precioConsignacion = Math.round(Number(precioConsignacionRaw) || 0);
    const marca = marcaRaw || "SIN MARCA";

    // 1. Obtener o crear Proveedor (excepto si es EL PARCHE que se considera marca propia)
    let proveedorId: string | null = null;
    let comisionPct = 30.0; // valor por defecto

    if (marca !== "EL PARCHE") {
      // Buscar proveedor
      let proveedor = await prisma.proveedor.findFirst({
        where: { nombre: { equals: marca } }
      });

      if (!proveedor) {
        // Generar un número de documento ficticio basado en el nombre
        const cleanName = marca.replace(/[^a-zA-Z0-9]/g, "").substring(0, 10).toUpperCase();
        const docNum = `NIT-${cleanName || "PROV"}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Si hay consignación y venta, calcular comisión real
        if (precioVenta > 0 && precioConsignacion > 0) {
          comisionPct = Math.round(((precioVenta - precioConsignacion) / precioVenta) * 10000) / 100;
        }

        proveedor = await prisma.proveedor.create({
          data: {
            nombre: marca,
            tipoDocumento: "NIT",
            numeroDocumento: docNum,
            comisionDefaultPct: comisionPct > 0 && comisionPct <= 100 ? comisionPct : 30.0,
            modoComisionDefault: "PORCENTAJE",
            activo: true
          }
        });
        creadosProveedores++;
        console.log(`➕ Proveedor creado: ${marca} (${docNum}) con comisión: ${comisionPct}%`);
      }
      proveedorId = proveedor.id;
      comisionPct = proveedor.comisionDefaultPct;
    }

    // 2. Crear o actualizar Prenda
    const isOwnProduction = marca === "EL PARCHE";
    
    // Verificar si ya existe prenda con ese código
    const prendaExistente = await prisma.prenda.findUnique({
      where: { codigo }
    });

    // Calcular comisión específica para esta prenda
    let prendaComisionPct = comisionPct;
    if (precioVenta > 0 && precioConsignacion > 0) {
      prendaComisionPct = Math.round(((precioVenta - precioConsignacion) / precioVenta) * 10000) / 100;
    }

    const dataPrenda = {
      codigoBarras: codigo, // Usar el código también como código de barras para el escáner
      origen: isOwnProduction ? "PRODUCCION_PROPIA" : "CONSIGNACION",
      proveedorId: isOwnProduction ? null : proveedorId,
      descripcion: referencia,
      categoria: "Prenda de Vestir", // Genérica
      talla: "UNICA",
      color: "Multicolor",
      precioVenta: precioVenta,
      valorProveedor: isOwnProduction ? null : precioConsignacion,
      comisionPct: isOwnProduction ? null : (prendaComisionPct > 0 && prendaComisionPct <= 100 ? prendaComisionPct : 30.0),
      costoProduccion: isOwnProduction ? precioConsignacion : null, // el precio de consignación de EL PARCHE actúa como costo de producción base
      estado: "EN_VITRINA"
    };

    if (prendaExistente) {
      await prisma.prenda.update({
        where: { id: prendaExistente.id },
        data: dataPrenda
      });
      actualizadasPrendas++;
    } else {
      await prisma.prenda.create({
        data: {
          codigo,
          ...dataPrenda
        }
      });
      creadasPrendas++;
    }
  }

  console.log(`\n🎉 Importación finalizada con éxito:`);
  console.log(`- Proveedores nuevos creados: ${creadosProveedores}`);
  console.log(`- Prendas nuevas creadas: ${creadasPrendas}`);
  console.log(`- Prendas actualizadas: ${actualizadasPrendas}`);
}

main()
  .catch(e => {
    console.error("❌ Error importando catálogo:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
