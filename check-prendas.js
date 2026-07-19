const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const all = await p.prenda.findMany({ select: { codigo: true, descripcion: true } });
  console.log("Total:", all.length);
  const par = all.filter(a => a.codigo.startsWith('PAR-'));
  const dp = all.filter(a => a.codigo.startsWith('DP'));
  const others = all.filter(a => !a.codigo.startsWith('PAR-') && !a.codigo.startsWith('DP'));
  
  console.log("Starts with PAR-:", par.length);
  console.log("Starts with DP:", dp.length);
  console.log("Others:", others.length);
  if (others.length > 0) {
    console.log("Sample others:", others.slice(0, 5));
  }
  await p.$disconnect();
}
run();
