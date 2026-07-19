const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function find33() {
  try {
    const matching = await p.prenda.findMany({
      where: {
        codigo: {
          endsWith: '33'
        }
      }
    });
    console.log(JSON.stringify(matching, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
}
find33();
