import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.rol !== "ADMIN" && session.user.rol !== "CONTADOR")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const materiales = await db.materiaPrima.findMany({
      orderBy: { nombre: "asc" }
    });

    return NextResponse.json(materiales);

  } catch (error) {
    console.error("Error obteniendo materiales:", error);
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
    const { nombre, unidad, existenciaInicial, costoInicial } = body;

    if (!nombre || !unidad) {
      return NextResponse.json({ error: "Nombre y unidad son requeridos" }, { status: 400 });
    }

    const existencia = parseFloat(existenciaInicial || "0");
    const costoPromedioActual = parseFloat(costoInicial || "0");

    const nuevoMaterial = await db.materiaPrima.create({
      data: {
        nombre,
        unidad, // METRO | UNIDAD | CONO | KILO etc.
        existencia,
        costoPromedioActual
      }
    });

    return NextResponse.json(nuevoMaterial, { status: 201 });

  } catch (error) {
    console.error("Error creando material:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
