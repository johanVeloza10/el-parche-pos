import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  const rows = await db.historicoLibro.findMany();
  const total = rows.reduce((s, r) => s + r.ventasBrutas, 0);
  const ingreso = rows.reduce((s, r) => s + r.ingresoReal, 0);
  const ganancia = rows.reduce((s, r) => s + r.saldoDia, 0);
  const gastos = rows.reduce((s, r) => s + r.gastos, 0);
  
  console.log("📊 TOTALES DEL HISTÓRICO EN BASE DE DATOS:");
  console.log(`  Ventas brutas total:  $${total.toLocaleString("es-CO")}`);
  console.log(`  Ingreso real total:   $${ingreso.toLocaleString("es-CO")}`);
  console.log(`  Gastos total:         $${gastos.toLocaleString("es-CO")}`);
  console.log(`  Ganancia neta total:  $${ganancia.toLocaleString("es-CO")}`);
  
  const meses: Record<string, number> = {};
  for (const r of rows) {
    meses[r.mes] = (meses[r.mes] || 0) + r.ventasBrutas;
  }
  console.log("\n  Ventas por mes:");
  for (const [mes, v] of Object.entries(meses)) {
    console.log(`    ${mes}: $${(v as number).toLocaleString("es-CO")}`);
  }
}

main().finally(() => db.$disconnect());
