import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/liquidaciones/[id] - Obtener detalles de una liquidación
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.rol !== "ADMIN" && session.user.rol !== "CONTADOR")) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const { id } = await context.params;

    const liquidacion = await db.liquidacion.findUnique({
      where: { id },
      include: {
        proveedor: true,
        items: true
      }
    });

    if (!liquidacion) {
      return new NextResponse("Liquidación no encontrada", { status: 404 });
    }

    return NextResponse.json(liquidacion, { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } });

  } catch (error) {
    console.error("Error obteniendo liquidación:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

// PUT /api/liquidaciones/[id] - Actualizar estado o datos de pago
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.rol !== "ADMIN" && session.user.rol !== "CONTADOR")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { estado, fechaPago, soportePago } = body;

    const liquidacionExistente = await db.liquidacion.findUnique({
      where: { id }
    });

    if (!liquidacionExistente) {
      return NextResponse.json({ error: "Liquidación no encontrada" }, { status: 404 });
    }

    // Validar transiciones de estado lógicas
    if (estado === "PAGADA" && liquidacionExistente.estado !== "APROBADA") {
      return NextResponse.json({ error: "Solo se pueden pagar liquidaciones que estén previamente APROBADAS" }, { status: 400 });
    }

    const updated = await db.liquidacion.update({
      where: { id },
      data: {
        estado,
        ...(fechaPago ? { fechaPago: new Date(fechaPago) } : {}),
        ...(soportePago ? { soportePago } : {})
      }
    });

    return NextResponse.json(updated, { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } });

  } catch (error) {
    console.error("Error actualizando liquidación:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/liquidaciones/[id] - Eliminar borrador y liberar items
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.rol !== "ADMIN" && session.user.rol !== "CONTADOR")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;

    const liquidacion = await db.liquidacion.findUnique({
      where: { id }
    });

    if (!liquidacion) {
      return NextResponse.json({ error: "Liquidación no encontrada" }, { status: 404 });
    }

    if (liquidacion.estado !== "BORRADOR") {
      return NextResponse.json({ error: "Solo se pueden anular liquidaciones en estado BORRADOR" }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      // 1. Eliminar desgloses (Cascade handles this but doing it explicitly is fine)
      await tx.itemLiquidacion.deleteMany({
        where: { liquidacionId: id }
      });

      // 2. Eliminar liquidación
      await tx.liquidacion.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true, message: "Liquidación borrada e inventario liberado" });

  } catch (error) {
    console.error("Error eliminando liquidación:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
