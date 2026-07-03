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
    const mes = searchParams.get("mes") || undefined; // Ej: "2026-06"

    const costos = await db.costoNegocio.findMany({
      where: {
        ...(mes ? { mes } : {})
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(costos);

  } catch (error) {
    console.error("Error obteniendo costos de negocio:", error);
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
    const { tipo, concepto, valor, mes, soporte } = body;

    if (!tipo || !concepto || !valor || !mes) {
      return NextResponse.json({ error: "Parámetros insuficientes" }, { status: 400 });
    }

    if (tipo !== "FIJO" && tipo !== "VARIABLE") {
      return NextResponse.json({ error: "El tipo de costo debe ser FIJO o VARIABLE" }, { status: 400 });
    }

    const nuevoCosto = await db.costoNegocio.create({
      data: {
        tipo,
        concepto,
        valor: parseInt(valor),
        mes, // Formato "2026-06"
        soporte: soporte || null
      }
    });

    return NextResponse.json(nuevoCosto, { status: 201 });

  } catch (error) {
    console.error("Error creando costo de negocio:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
