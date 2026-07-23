import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const alertas: Array<{
      tipo: "liquidacion" | "inventario" | "tendencia" | "meta";
      icono: string;
      titulo: string;
      mensaje: string;
      urgencia: "alta" | "media" | "baja";
    }> = [];

    // 1. Liquidaciones pendientes — prendas vendidas sin liquidar por proveedor
    const proveedoresConVentasSinLiquidar = await db.proveedor.findMany({
      where: {
        activo: true,
        prendas: {
          some: {
            estado: "VENDIDA",
            itemVenta: {
              itemLiquidacion: null,
            },
          },
        },
      },
      include: {
        prendas: {
          where: {
            estado: "VENDIDA",
            itemVenta: {
              itemLiquidacion: null,
            },
          },
          include: { itemVenta: true },
        },
      },
    });

    for (const prov of proveedoresConVentasSinLiquidar) {
      const montoPendiente = prov.prendas.reduce(
        (sum: number, p: any) => sum + (p.itemVenta?.paraProveedor || 0),
        0
      );
      if (montoPendiente > 0) {
        alertas.push({
          tipo: "liquidacion",
          icono: "💸",
          titulo: "Liquidación pendiente",
          mensaje: `Tienes $${montoPendiente.toLocaleString("es-CO")} pendientes por liquidar a ${prov.nombre} (${prov.prendas.length} prendas vendidas)`,
          urgencia: montoPendiente > 1000000 ? "alta" : "media",
        });
      }
    }

    // 2. Inventario estancado (prendas > 60 días en vitrina)
    const hace60Dias = new Date();
    hace60Dias.setDate(hace60Dias.getDate() - 60);

    const prendasEstancadas = await db.prenda.count({
      where: {
        estado: "EN_VITRINA",
        fechaIngreso: { lt: hace60Dias },
        deletedAt: null,
      },
    });

    if (prendasEstancadas > 0) {
      alertas.push({
        tipo: "inventario",
        icono: "📦",
        titulo: "Inventario estancado",
        mensaje: `${prendasEstancadas} prenda${prendasEstancadas > 1 ? "s" : ""} lleva${prendasEstancadas > 1 ? "n" : ""} más de 60 días sin venderse. Considera una promoción.`,
        urgencia: prendasEstancadas > 20 ? "alta" : "media",
      });
    }

    // 3. Comparación con el mes anterior
    const ahora = new Date();
    const mesActual = `${ahora.getFullYear()}-${(ahora.getMonth() + 1).toString().padStart(2, "0")}`;
    const mesAnteriorDate = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const mesAnterior = `${mesAnteriorDate.getFullYear()}-${(mesAnteriorDate.getMonth() + 1).toString().padStart(2, "0")}`;

    const diaActualDelMes = ahora.getDate();

    // Ventas de este mes
    const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const ventasMesActual = await db.venta.aggregate({
      _sum: { total: true },
      where: {
        anulada: false,
        fechaHora: { gte: inicioMesActual },
      },
    });

    // Ventas del mes pasado al mismo día
    const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const mismaFechaMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, diaActualDelMes);
    const ventasMesAnteriorAlMismoDia = await db.venta.aggregate({
      _sum: { total: true },
      where: {
        anulada: false,
        fechaHora: {
          gte: inicioMesAnterior,
          lte: mismaFechaMesAnterior,
        },
      },
    });

    const totalActual = ventasMesActual._sum.total || 0;
    const totalAnterior = ventasMesAnteriorAlMismoDia._sum.total || 0;

    if (totalAnterior > 0 && totalActual > 0) {
      const porcentajeCambio = Math.round(
        ((totalActual - totalAnterior) / totalAnterior) * 100
      );

      if (porcentajeCambio < -10) {
        alertas.push({
          tipo: "tendencia",
          icono: "📉",
          titulo: "Tendencia a la baja",
          mensaje: `Las ventas de este mes van ${Math.abs(porcentajeCambio)}% por debajo del mes pasado al mismo día.`,
          urgencia: porcentajeCambio < -25 ? "alta" : "media",
        });
      } else if (porcentajeCambio > 10) {
        alertas.push({
          tipo: "tendencia",
          icono: "📈",
          titulo: "¡Ventas en alza!",
          mensaje: `Las ventas de este mes van ${porcentajeCambio}% por encima del mes pasado al mismo día. ¡Excelente!`,
          urgencia: "baja",
        });
      }
    }

    // 4. Prendas en vitrina total
    const totalEnVitrina = await db.prenda.count({
      where: { estado: "EN_VITRINA", deletedAt: null },
    });

    if (totalEnVitrina < 10) {
      alertas.push({
        tipo: "inventario",
        icono: "🧵",
        titulo: "Inventario bajo",
        mensaje: `Solo quedan ${totalEnVitrina} prendas en vitrina. Es momento de recibir más mercancía.`,
        urgencia: totalEnVitrina < 5 ? "alta" : "media",
      });
    }

    // Ordenar por urgencia
    const ordenUrgencia = { alta: 0, media: 1, baja: 2 };
    alertas.sort((a, b) => ordenUrgencia[a.urgencia] - ordenUrgencia[b.urgencia]);

    return NextResponse.json(alertas, { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } });
  } catch (error) {
    console.error("Error en alertas:", error);
    return NextResponse.json(
      { error: "Error generando alertas" },
      { status: 500 }
    );
  }
}
