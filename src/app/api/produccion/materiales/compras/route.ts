import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.rol !== "ADMIN" && session.user.rol !== "CONTADOR")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { materiaPrimaId, cantidad, costoTotal, proveedorInsumo, soporte } = body;

    if (!materiaPrimaId || !cantidad || !costoTotal || !proveedorInsumo) {
      return NextResponse.json({ error: "Parámetros insuficientes" }, { status: 400 });
    }

    const cant = parseFloat(cantidad);
    const costo = parseInt(costoTotal);
    const costoUnitario = costo / cant;

    const actualizacion = await db.$transaction(async (tx) => {
      // 1. Registrar la compra
      const compra = await tx.compraMateriaPrima.create({
        data: {
          materiaPrimaId,
          proveedorInsumo,
          cantidad: cant,
          costoTotal: costo,
          costoUnitario,
          soporte: soporte || null
        }
      });

      // 2. Obtener insumo actual
      const mp = await tx.materiaPrima.findUnique({
        where: { id: materiaPrimaId }
      });

      if (!mp) {
        throw new Error("El material no existe en la base de datos");
      }

      // 3. Recalcular existencias y costo promedio ponderado
      const existenciaAnterior = mp.existencia;
      const costoAnterior = mp.costoPromedioActual;

      const nuevaExistencia = existenciaAnterior + cant;
      
      // Promedio ponderado: (Valor en libros anterior + costo nueva compra) / Nueva existencia
      const nuevoCostoPromedio = nuevaExistencia > 0 
        ? ((existenciaAnterior * costoAnterior) + costo) / nuevaExistencia 
        : 0;

      // 4. Actualizar insumo
      await tx.materiaPrima.update({
        where: { id: materiaPrimaId },
        data: {
          existencia: nuevaExistencia,
          costoPromedioActual: nuevoCostoPromedio
        }
      });

      return compra;
    });

    return NextResponse.json(actualizacion, { status: 201 });

  } catch (error: any) {
    console.error("Error registrando compra de material:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}
