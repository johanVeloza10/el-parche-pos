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
      return NextResponse.json([], { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } });
    }

    const searchTerm = q.trim();

    // Buscamos prendas que coincidan con código de barras, código interno o descripción
    const prendas = await db.prenda.findMany({
      where: {
        deletedAt: null,
        OR: [
          { codigoBarras: { equals: searchTerm, mode: 'insensitive' } },
          { codigoBarras: { contains: searchTerm, mode: 'insensitive' } },
          { codigo: { equals: searchTerm, mode: 'insensitive' } },
          { codigo: { contains: searchTerm, mode: 'insensitive' } },
          { descripcion: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: 20,
      include: {
        proveedor: {
          select: { nombre: true },
        },
      },
    });

    return NextResponse.json(prendas, { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } });
  } catch (error) {
    console.error("Error buscando prendas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
