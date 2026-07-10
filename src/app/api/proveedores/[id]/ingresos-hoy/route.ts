import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Calcular el inicio del día de hoy en hora local (Colombia es UTC-5)
    const ahora = new Date();
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

    const prendas = await db.prenda.findMany({
      where: {
        proveedorId: id,
        fechaIngreso: {
          gte: inicioHoy,
        },
        deletedAt: null,
      },
      orderBy: {
        fechaIngreso: "desc",
      },
    });

    const proveedor = await db.proveedor.findUnique({
      where: { id },
    });

    if (!proveedor) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      proveedor,
      prendas,
    });
  } catch (error) {
    console.error("Error al obtener prendas ingresadas hoy:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
