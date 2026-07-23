import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;

    // Buscamos la venta por su ID o por el número del documento fiscal
    const venta = await db.venta.findFirst({
      where: {
        OR: [
          { id: id },
          { documentoFiscal: { numero: { equals: id, mode: "insensitive" } } },
          { documentoFiscal: { numero: { equals: `POS-${id}`, mode: "insensitive" } } },
          { documentoFiscal: { numero: { equals: `FE-${id}`, mode: "insensitive" } } }
        ]
      },
      include: {
        cliente: true,
        items: {
          include: {
            prenda: true
          }
        },
        documentoFiscal: true
      }
    });

    if (!venta) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    }

    return NextResponse.json(venta, { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } });

  } catch (error: any) {
    console.error("Error obteniendo detalles de venta:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
