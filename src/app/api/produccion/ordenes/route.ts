import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.rol !== "ADMIN" && session.user.rol !== "CONTADOR")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const ordenes = await db.ordenProduccion.findMany({
      include: {
        consumos: {
          include: {
            materiaPrima: { select: { nombre: true, unidad: true } }
          }
        },
        prendas: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(ordenes);

  } catch (error) {
    console.error("Error obteniendo órdenes de producción:", error);
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
    const { nombreDiseno, cantidadPrendas, margenObjetivo, costosIndirectos } = body;

    if (!nombreDiseno) {
      return NextResponse.json({ error: "El nombre del diseño es requerido" }, { status: 400 });
    }

    const nuevaOrden = await db.ordenProduccion.create({
      data: {
        nombreDiseno,
        cantidadPrendas: parseInt(cantidadPrendas || "1"),
        margenObjetivo: parseFloat(margenObjetivo || "50.0"),
        costosIndirectos: parseInt(costosIndirectos || "0"),
        estado: "ABIERTA"
      }
    });

    return NextResponse.json(nuevaOrden, { status: 201 });

  } catch (error) {
    console.error("Error creando orden de producción:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
