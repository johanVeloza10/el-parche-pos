import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST — Add an expense to the current open caja
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { concepto, monto, soporte } = body;

    if (!concepto || !monto) {
      return NextResponse.json(
        { error: "concepto y monto son requeridos" },
        { status: 400 }
      );
    }

    const montoNum = parseInt(monto, 10);
    if (isNaN(montoNum) || montoNum <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser un número positivo" },
        { status: 400 }
      );
    }

    // Find the open caja for the current user
    const cajaAbierta = await db.cierreCaja.findFirst({
      where: {
        usuarioId: session.user.id,
        estado: "ABIERTA",
      },
    });

    if (!cajaAbierta) {
      return NextResponse.json(
        { error: "No tienes una caja abierta. Abre la caja primero." },
        { status: 400 }
      );
    }

    // We will save this in CostoNegocio and also increment gastosEfectivo in CierreCaja
    const mesActual = new Date().toISOString().substring(0, 7); // YYYY-MM
    
    // Perform both in a transaction
    await db.$transaction(async (tx) => {
      await tx.costoNegocio.create({
        data: {
          tipo: "VARIABLE",
          concepto: concepto,
          valor: montoNum,
          mes: mesActual,
          soporte: soporte || null,
        },
      });

      await tx.cierreCaja.update({
        where: { id: cajaAbierta.id },
        data: {
          gastosEfectivo: { increment: montoNum },
        },
      });
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error("Error registrando gasto:", error);
    return NextResponse.json(
      { error: error.message || "Error registrando gasto" },
      { status: 500 }
    );
  }
}
