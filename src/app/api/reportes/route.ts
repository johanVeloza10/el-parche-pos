import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.rol !== "ADMIN" && session.user.rol !== "CONTADOR")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mes = searchParams.get("mes") || new Date().toISOString().substring(0, 7); // Por defecto el mes actual, ej: "2026-06"

    const ahora = new Date();

    // 1. PRENDAS ENVEJECIDAS (> 60 días en vitrina)
    const limiteEnvejecida = new Date();
    limiteEnvejecida.setDate(ahora.getDate() - 60);

    const prendasEnvejecidasRaw = await db.prenda.findMany({
      where: {
        estado: "EN_VITRINA",
        fechaIngreso: {
          lte: limiteEnvejecida
        },
        deletedAt: null
      },
      include: {
        proveedor: {
          select: { nombre: true, telefono: true }
        }
      },
      orderBy: { fechaIngreso: "asc" }
    });

    const prendasEnvejecidas = prendasEnvejecidasRaw.map(p => {
      const dias = Math.floor((ahora.getTime() - new Date(p.fechaIngreso).getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: p.id,
        codigo: p.codigo,
        descripcion: p.descripcion,
        fechaIngreso: p.fechaIngreso,
        diasEnVitrina: dias,
        precioVenta: p.precioVenta,
        proveedor: p.proveedor?.nombre || "Producción Propia",
        telefonoProveedor: p.proveedor?.telefono || "-"
      };
    });

    // 2. ROTACIÓN PROMEDIO POR CATEGORÍA
    const prendasVendidas = await db.prenda.findMany({
      where: {
        estado: "VENDIDA",
        fechaVenta: { not: null }
      },
      select: {
        categoria: true,
        fechaIngreso: true,
        fechaVenta: true
      }
    });

    const rotacionPorCat: Record<string, { totalDias: number; count: number }> = {};
    for (const p of prendasVendidas) {
      if (!p.fechaVenta) continue;
      const dias = Math.floor((new Date(p.fechaVenta).getTime() - new Date(p.fechaIngreso).getTime()) / (1000 * 60 * 60 * 24));
      const cat = p.categoria || "Sin Categoría";
      
      if (!rotacionPorCat[cat]) {
        rotacionPorCat[cat] = { totalDias: 0, count: 0 };
      }
      rotacionPorCat[cat].totalDias += Math.max(0, dias);
      rotacionPorCat[cat].count++;
    }

    const rotacionPromedio = Object.entries(rotacionPorCat).map(([categoria, info]) => ({
      categoria,
      diasPromedio: Math.round(info.totalDias / info.count),
      cantidadVendida: info.count
    }));

    // 3. RANKING DE PROVEEDORES
    const proveedores = await db.proveedor.findMany({
      where: { activo: true },
      include: {
        prendas: {
          include: {
            itemVenta: true
          }
        }
      }
    });

    const rankingProveedores = proveedores.map(prov => {
      let ventasTotales = 0;
      let comisionTienda = 0;
      let devoluciones = 0;

      for (const p of prov.prendas) {
        if (p.estado === "VENDIDA" && p.itemVenta) {
          const precioCobrado = p.itemVenta.precioVenta - p.itemVenta.descuentoItem;
          ventasTotales += precioCobrado;
          comisionTienda += p.itemVenta.comisionBoutique;
        } else if (p.estado === "DEVUELTA_PROVEEDOR") {
          devoluciones++;
        }
      }

      return {
        id: prov.id,
        nombre: prov.nombre,
        ventasTotales,
        comisionTienda,
        devoluciones
      };
    }).sort((a, b) => b.ventasTotales - a.ventasTotales);

    // 4. COMISIÓN PROMEDIO REAL Y PUNTO DE EQUILIBRIO
    // Calculamos la comisión real sobre todas las ventas del sistema
    const itemsVenta = await db.itemVenta.findMany();
    let sumaVentas = 0;
    let sumaComisiones = 0;

    for (const item of itemsVenta) {
      const precioCobrado = item.precioVenta - item.descuentoItem;
      sumaVentas += precioCobrado;
      sumaComisiones += item.comisionBoutique;
    }

    const comisionPromedioReal = sumaVentas > 0 ? (sumaComisiones / sumaVentas) : 0.40; // 40% por defecto

    // Obtener costos fijos del mes consultado
    const costosMes = await db.costoNegocio.findMany({
      where: { mes, tipo: "FIJO" }
    });

    const totalCostosFijos = costosMes.reduce((sum, c) => sum + c.valor, 0);

    // Punto de Equilibrio: gastosFijos / comisionPromedioReal
    const puntoEquilibrio = comisionPromedioReal > 0 
      ? Math.round(totalCostosFijos / comisionPromedioReal)
      : totalCostosFijos * 2.5;

    return NextResponse.json({
      mesConsultado: mes,
      puntoEquilibrio,
      totalCostosFijos,
      comisionPromedioReal: Math.round(comisionPromedioReal * 100),
      prendasEnvejecidas,
      rotacionPromedio,
      rankingProveedores
    });

  } catch (error) {
    console.error("Error obteniendo indicadores:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
