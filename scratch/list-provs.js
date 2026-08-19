const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const p = await db.proveedor.findMany({ select: { id: true, nombre: true } });
  console.log(JSON.stringify(p, null, 2));
}

main().catch(console.error).finally(() => db.$disconnect());
