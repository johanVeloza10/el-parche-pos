const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const salesCount = await p.venta.count();
  const itemsCount = await p.itemVenta.count();
  console.log(`Total Sales (Ventas) in DB: ${salesCount}`);
  console.log(`Total Sold Items (ItemsVenta) in DB: ${itemsCount}`);
  await p.$disconnect();
}
check();
