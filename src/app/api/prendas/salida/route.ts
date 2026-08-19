import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { prendasIds, observaciones } = body;

    if (!prendasIds || prendasIds.length === 0) {
      return NextResponse.json({ error: "No hay prendas para devolver" }, { status: 400 });
    }

    // Verificar que todas estén en vitrina
    const prendas = await db.prenda.findMany({
      where: { id: { in: prendasIds } },
      include: { proveedor: true }
    });

    const noDisponibles = prendas.filter(p => p.estado !== "EN_VITRINA");
    if (noDisponibles.length > 0) {
      return NextResponse.json({ 
        error: `Las siguientes prendas no están en vitrina: ${noDisponibles.map(p => p.codigo).join(", ")}` 
      }, { status: 400 });
    }

    // Actualizar prendas a DEVUELTA_PROVEEDOR
    await db.prenda.updateMany({
      where: { id: { in: prendasIds } },
      data: { estado: "DEVUELTA_PROVEEDOR" }
    });

    // Registrar en AuditLog
    await db.auditLog.create({
      data: {
        entidad: "Prenda",
        entidadId: prendasIds.join(","),
        accion: "DEVOLUCION_A_PROVEEDOR",
        usuarioId: session.user.id,
        valorNuevo: JSON.stringify({ 
          observaciones, 
          cantidad: prendasIds.length,
          prendas: prendas.map(p => ({ codigo: p.codigo, proveedor: p.proveedor?.nombre })) 
        })
      }
    });

    return NextResponse.json({ success: true, count: prendasIds.length });

  } catch (error: any) {
    console.error("Error en salida de prendas:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar la salida" },
      { status: 500 }
    );
  }
}
