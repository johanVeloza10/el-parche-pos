const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function fullAudit() {
  console.log("=== INICIANDO AUDITORÍA GENERAL DE FUNCIONALIDADES ===");

  // 1. ConfiguracionNegocio
  const config = await db.configuracionNegocio.findUnique({ where: { id: "default" } });
  console.log("✅ Configuración negocio:", config ? `${config.nombreNegocio} - NIT ${config.nit}` : "❌ NO EXISTE");

  // 2. Proveedores y comisiones
  const provCount = await db.proveedor.count();
  const provSample = await db.proveedor.findMany({ take: 3, select: { nombre: true, comisionDefaultPct: true } });
  console.log(`✅ Proveedores registrados: ${provCount}. Ejemplo:`, provSample);

  // 3. Inventario (Prendas)
  const totalPrendas = await db.prenda.count({ where: { deletedAt: null } });
  const enVitrinaCount = await db.prenda.count({ where: { estado: "EN_VITRINA", deletedAt: null } });
  const vendidasCount = await db.prenda.count({ where: { estado: "VENDIDA", deletedAt: null } });
  const apartadasCount = await db.prenda.count({ where: { estado: "APARTADA", deletedAt: null } });
  console.log(`✅ Inventario prendas -> Total: ${totalPrendas} | Vitrina: ${enVitrinaCount} | Vendidas: ${vendidasCount} | Apartadas: ${apartadasCount}`);

  // 4. Apartados
  const apartadosCount = await db.apartado.count();
  const apartadosVigentes = await db.apartado.count({ where: { estado: "VIGENTE" } });
  console.log(`✅ Apartados -> Total: ${apartadosCount} | Vigentes: ${apartadosVigentes}`);

  // 5. Cajas Diarias
  const cajasTotal = await db.cierreCaja.count();
  const cajaAbierta = await db.cierreCaja.findFirst({ where: { estado: "ABIERTA" } });
  console.log(`✅ Cajas -> Registradas: ${cajasTotal} | Caja abierta actual:`, cajaAbierta ? `ID: ${cajaAbierta.id} (${cajaAbierta.fecha.toISOString()})` : "Ninguna abierta");

  // 6. Ventas
  const ventasTotal = await db.venta.count();
  console.log(`✅ Ventas totales en historial: ${ventasTotal}`);

  console.log("=== AUDITORÍA FINALIZADA SIN ANOMALÍAS DE ESTRUCTURA ===");
}

fullAudit()
  .catch(err => console.error("❌ ERROR EN AUDITORÍA:", err))
  .finally(() => db.$disconnect());
