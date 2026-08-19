const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const VALIDOS = [
  "ERRE TRES", "SUMERCÉ", "ESTEFANÍA", "CLAVELITO", "DUE", 
  "MANDALA", "PALOMA", "TSURU", "ANIMALEJA", "AMADITA", 
  "SOFÍA MAZUERA", "MAMBÍ", "ELPARCHE", "VIOLETA"
];

async function main() {
  const proveedores = await db.proveedor.findMany();
  let inactivos = 0;
  let borrados = 0;

  for (const prov of proveedores) {
    if (!VALIDOS.includes(prov.nombre.toUpperCase().replace(" ", "")) && !VALIDOS.includes(prov.nombre.toUpperCase())) {
      // Revisa si tiene ventas
      const hasVentas = await db.itemVenta.count({
        where: { prenda: { proveedorId: prov.id } }
      });
      
      const hasLiquidaciones = await db.liquidacion.count({
        where: { proveedorId: prov.id }
      });

      if (hasVentas > 0 || hasLiquidaciones > 0) {
        console.log(`Marcando inactivo: ${prov.nombre} (Tiene registros históricos)`);
        await db.proveedor.update({ where: { id: prov.id }, data: { activo: false } });
        inactivos++;
      } else {
        console.log(`Borrando permanentemente: ${prov.nombre} (Sin registros históricos)`);
        await db.prenda.deleteMany({ where: { proveedorId: prov.id } });
        await db.proveedor.delete({ where: { id: prov.id } });
        borrados++;
      }
    } else {
       // Make sure it's active
       await db.proveedor.update({ where: { id: prov.id }, data: { activo: true } });
    }
  }

  console.log(`Proceso terminado. Se ocultaron ${inactivos} y se borraron ${borrados} proveedores.`);
}

main().catch(console.error).finally(() => db.$disconnect());
