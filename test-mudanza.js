const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check if it already exists
  const existing = await prisma.prenda.findUnique({
    where: { codigo: 'TEST-MUDANZA-001' }
  });

  if (!existing) {
    await prisma.prenda.create({
      data: {
        codigo: 'TEST-MUDANZA-001',
        codigoBarras: 'TEST-MUDANZA-001',
        descripcion: '¡EXITO! CONEXIÓN A NUEVA BASE DE DATOS LOGRADA',
        categoria: 'PRUEBA',
        talla: 'U',
        color: 'ROJO',
        precioVenta: 1000,
        estado: 'EN_VITRINA',
        origen: 'PRODUCCION_PROPIA'
      }
    });
    console.log("Prenda de prueba creada exitosamente.");
  } else {
    console.log("La prenda de prueba ya existe.");
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
