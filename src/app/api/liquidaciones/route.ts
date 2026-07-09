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
    const proveedorId = searchParams.get("proveedorId") || undefined;

    const liquidaciones = await db.liquidacion.findMany({
      where: {
        ...(proveedorId ? { proveedorId } : {})
      },
      include: {
        proveedor: {
          select: { nombre: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(liquidaciones);

  } catch (error) {
    console.error("Error obteniendo liquidaciones:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.rol !== "ADMIN" && session.user.rol !== "CONTADOR")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { proveedorId, fechaInicio, fechaFin } = body;

    if (!proveedorId || !fechaInicio || !fechaFin) {
      return NextResponse.json({ error: "Parámetros insuficientes" }, { status: 400 });
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    // Ajustar fin para cubrir todo el último día hasta las 23:59:59
    fin.setHours(23, 59, 59, 999);

    const nuevaLiquidacion = await db.$transaction(async (tx: any) => {
      // 1. Buscar todas las ventas del proveedor en el rango de fechas que NO estén liquidadas
      const itemsPendientes = await tx.itemVenta.findMany({
        where: {
          itemLiquidacion: null,
          prenda: {
            proveedorId,
            estado: "VENDIDA"
          },
          venta: {
            fechaHora: {
              gte: inicio,
              lte: fin
            },
            anulada: false
          }
        },
        include: {
          prenda: true
        }
      });

      if (itemsPendientes.length === 0) {
        throw new Error("No hay ventas pendientes por liquidar para este período");
      }

      // 2. Calcular acumulados
      let totalVentas = 0;
      let totalComision = 0;
      let netoAPagar = 0;

      for (const item of itemsPendientes) {
        const precioCobrado = item.precioVenta - item.descuentoItem;
        totalVentas += precioCobrado;
        totalComision += item.comisionBoutique;
        netoAPagar += item.paraProveedor;
      }

      // 3. Crear Liquidación en estado BORRADOR
      const liquidacion = await tx.liquidacion.create({
        data: {
          proveedorId,
          periodoInicio: inicio,
          periodoFin: fin,
          totalVentas,
          totalComision,
          netoAPagar,
          estado: "BORRADOR"
        }
      });

      // 5. Crear ItemLiquidacion para el desglose detallado
      for (const item of itemsPendientes) {
        await tx.itemLiquidacion.create({
          data: {
            liquidacionId: liquidacion.id,
            itemVentaId: item.id,
            prendaCodigo: item.prenda.codigo,
            prendaDescripcion: item.prenda.descripcion,
            precioVenta: item.precioVenta - item.descuentoItem,
            valorProveedor: item.paraProveedor,
            comision: item.comisionBoutique
          }
        });
      }

      return liquidacion;
    });

    return NextResponse.json(nuevaLiquidacion, { status: 201 });

  } catch (error: any) {
    console.error("Error creando liquidación:", error);
    return NextResponse.json({ error: error.message || "Error al procesar la liquidación" }, { status: 400 });
  }
}
