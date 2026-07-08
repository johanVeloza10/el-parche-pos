import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener todos los proveedores activos con sus prendas vendidas
    const proveedores = await db.proveedor.findMany({
      where: { activo: true },
      include: {
        prendas: {
          where: { estado: "VENDIDA" },
          include: {
            itemVenta: true,
          },
        },
        _count: {
          select: {
            prendas: {
              where: { estado: "EN_VITRINA" },
            },
          },
        },
      },
    });

    // Calcular el ranking
    const ranking = proveedores
      .map((prov) => {
        const prendasVendidas = prov.prendas.filter((p) => p.itemVenta);
        const totalVentas = prendasVendidas.reduce(
          (sum, p) => sum + (p.itemVenta?.precioVenta || 0),
          0
        );
        const totalComision = prendasVendidas.reduce(
          (sum, p) => sum + (p.itemVenta?.comisionBoutique || 0),
          0
        );
        const totalParaProveedor = prendasVendidas.reduce(
          (sum, p) => sum + (p.itemVenta?.paraProveedor || 0),
          0
        );

        // Contar prendas estancadas (en vitrina hace más de 60 días)
        const hace60Dias = new Date();
        hace60Dias.setDate(hace60Dias.getDate() - 60);
        const prendasEnVitrina = (prov._count as any)?.prendas || 0;

        return {
          id: prov.id,
          nombre: prov.nombre,
          prendasVendidas: prendasVendidas.length,
          prendasEnVitrina,
          totalVentas,
          totalComision,
          totalParaProveedor,
          comisionPct: prov.comisionDefaultPct,
        };
      })
      .filter((p) => p.prendasVendidas > 0 || p.prendasEnVitrina > 0)
      .sort((a, b) => b.totalComision - a.totalComision);

    return NextResponse.json(ranking);
  } catch (error) {
    console.error("Error en ranking de proveedores:", error);
    return NextResponse.json(
      { error: "Error obteniendo ranking" },
      { status: 500 }
    );
  }
}
