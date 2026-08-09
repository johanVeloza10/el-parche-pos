import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = params;

    const proveedor = await db.proveedor.findUnique({
      where: { id }
    });

    if (!proveedor) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });
    }
    
    // Calcular saldos
    const ventasPendientes = await db.itemVenta.findMany({
      where: {
        itemLiquidacion: null,
        prenda: { proveedorId: id, estado: "VENDIDA" },
        venta: { anulada: false }
      }
    });
    
    const saldoPorPagar = ventasPendientes.reduce((acc: number, item: any) => acc + item.paraProveedor, 0);

    return NextResponse.json({
      ...proveedor,
      saldoPorPagar,
    });
  } catch (error) {
    console.error("Error obteniendo proveedor:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
