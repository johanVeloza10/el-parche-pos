const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const VALIDOS = [
  "ERRE TRES", "SUMERCÉ", "ESTEFANÍA", "CLAVELITO", "DUE", 
  "MANDALA", "PALOMA", "TSURU", "ANIMALEJA", "AMADITA", 
  "SOFÍA MAZUERA", "MAMBÍ", "ELPARCHE", "VIOLETA"
];

async function main() {
  const proveedores = await db.proveedor.findMany();
  let eliminados = 0;

  for (const prov of proveedores) {
    if (!VALIDOS.includes(prov.nombre.toUpperCase().replace(" ", "")) && !VALIDOS.includes(prov.nombre.toUpperCase())) {
      console.log(`Borrando proveedor inválido: ${prov.nombre}`);
      
      // Borrar prendas de este proveedor para no violar llave foránea
      await db.prenda.deleteMany({ where: { proveedorId: prov.id } });
      
      // Borrar liquidaciones de este proveedor
      await db.liquidacion.deleteMany({ where: { proveedorId: prov.id } });

      await db.proveedor.delete({ where: { id: prov.id } });
      eliminados++;
    }
  }

  console.log(`Proceso terminado. Se eliminaron ${eliminados} proveedores que no estaban en el Excel.`);
}

main().catch(console.error).finally(() => db.$disconnect());
