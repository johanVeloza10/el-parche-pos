import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { renderToStream } from "@react-pdf/renderer";
import { ReceptionAct } from "@/components/pdf/ReceptionAct";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const { id } = await context.params;

    // Buscar proveedor
    const proveedor = await db.proveedor.findUnique({
      where: { id }
    });

    if (!proveedor) {
      return new NextResponse("Proveedor no encontrado", { status: 404 });
    }

    // Buscar prendas registradas hoy (Colombia UTC-5)
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

    if (prendas.length === 0) {
      return new NextResponse("No hay prendas ingresadas hoy para este proveedor", { status: 400 });
    }

    // Traer la configuración global
    const config = await db.configuracionNegocio.findUnique({
      where: { id: "default" }
    });

    // Generar el stream del PDF
    const stream = await renderToStream(<ReceptionAct proveedor={proveedor} prendas={prendas} config={config || {}} />);

    // Convertir el stream de Node a un ReadableStream web
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      }
    });

    const safeNombre = proveedor.nombre.replace(/[^a-zA-Z0-9]/g, "_");

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="acta-recepcion-${safeNombre}.pdf"`
      }
    });

  } catch (error) {
    console.error("Error generando PDF de acta de recepción:", error);
    return new NextResponse("Error generando el acta de recepción", { status: 500 });
  }
}
