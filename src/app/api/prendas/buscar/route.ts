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
      take: 100,
      include: {
        proveedor: {
          select: { nombre: true },
        },
      },
    });

    // Ordenar para que EN_VITRINA siempre salga de primero
    prendas.sort((a, b) => {
      if (a.estado === 'EN_VITRINA' && b.estado !== 'EN_VITRINA') return -1;
      if (a.estado !== 'EN_VITRINA' && b.estado === 'EN_VITRINA') return 1;
      return 0;
    });

    // Si hay más de 20, devolver solo los primeros 20 más relevantes (los de vitrina)
    const top20 = prendas.slice(0, 20);

    return NextResponse.json(top20, { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } });
  } catch (error) {
    console.error("Error buscando prendas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
