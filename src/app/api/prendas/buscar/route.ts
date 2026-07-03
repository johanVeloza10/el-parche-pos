import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q) {
      return NextResponse.json([]);
    }

    // Buscamos prendas en vitrina que coincidan con el código de barras, código interno o descripción
    const prendas = await db.prenda.findMany({
      where: {
        estado: "EN_VITRINA",
        deletedAt: null,
        OR: [
          { codigoBarras: { equals: q } },
          { codigo: { contains: q } }, // SQLite is case-insensitive with Prisma 'contains' if configured, but let's just do standard contains
          { descripcion: { contains: q } },
        ],
      },
      take: 20, // Limitamos a 20 resultados para no saturar la UI
      include: {
        proveedor: {
          select: { nombre: true },
        },
      },
    });

    return NextResponse.json(prendas);
  } catch (error) {
    console.error("Error buscando prendas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
