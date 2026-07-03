import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.rol !== "ADMIN" && session.user.rol !== "CONTADOR")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: ordenProduccionId } = await context.params;
    const body = await req.json();
    const { materiaPrimaId, cantidad } = body;

    if (!materiaPrimaId || !cantidad) {
      return NextResponse.json({ error: "Insumo y cantidad requeridos" }, { status: 400 });
    }

    const cant = parseFloat(cantidad);

    const consumo = await db.$transaction(async (tx) => {
      // 1. Obtener el insumo y validar stock
      const mp = await tx.materiaPrima.findUnique({
        where: { id: materiaPrimaId }
      });

      if (!mp) {
        throw new Error("El material no existe");
      }

      if (mp.existencia < cant) {
        throw new Error(`Stock insuficiente para ${mp.nombre}. Disponible: ${mp.existencia} ${mp.unidad}`);
      }

      const costoUnitario = mp.costoPromedioActual;
      const costoTotal = Math.round(cant * costoUnitario);

      // 2. Registrar el consumo
      const nuevoConsumo = await tx.consumoMateriaPrima.create({
        data: {
          ordenProduccionId,
          materiaPrimaId,
          cantidad: cant,
          costoUnitarioAlConsumo: costoUnitario,
          costoTotal
        }
      });

      // 3. Descontar existencias de la materia prima
      await tx.materiaPrima.update({
        where: { id: materiaPrimaId },
        data: {
          existencia: { decrement: cant }
        }
      });

      return nuevoConsumo;
    });

    return NextResponse.json(consumo, { status: 201 });

  } catch (error: any) {
    console.error("Error registrando consumo:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 400 });
  }
}
