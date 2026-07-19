const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function resetForProduction() {
  console.log("⚠️ INICIANDO LIMPIEZA DE DATOS DE PRUEBA...");
  
  try {
    // 1. Borrar todos los registros transaccionales
    console.log("- Borrando Logs de Auditoría...");
    await p.auditLog.deleteMany({});
    
    console.log("- Borrando Ítems de Ventas...");
    await p.itemVenta.deleteMany({});
    
    console.log("- Borrando Documentos Fiscales...");
    await p.documentoFiscal.deleteMany({});
    
    console.log("- Borrando Ventas...");
    await p.venta.deleteMany({});
    
    console.log("- Borrando Apartados...");
    await p.apartado.deleteMany({});
    
    console.log("- Borrando Cierres de Caja...");
    await p.cierreCaja.deleteMany({});
    
    // 2. Restaurar el estado de todas las prendas
    console.log("- Restaurando el estado de todas las prendas a EN_VITRINA...");
    await p.prenda.updateMany({
      data: {
        estado: 'EN_VITRINA',
        fechaVenta: null
      }
    });
    
    // 3. Reiniciar contadores de configuración
    console.log("- Reiniciando consecutivos de facturación...");
    await p.configuracionNegocio.update({
      where: { id: 'default' },
      data: {
        consecutivoActual: 0,
        numeracionDeePos: 0,
        numeracionFactura: 0
      }
    });

    console.log("✅ ¡SISTEMA REINICIADO Y LISTO PARA PRODUCCIÓN!");
    console.log("Tus productos, proveedores y usuarios siguen intactos.");
  } catch (error) {
    console.error("❌ Ocurrió un error:", error);
  } finally {
    await p.$disconnect();
  }
}

resetForProduction();
