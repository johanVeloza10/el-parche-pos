import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { renderToStream } from "@react-pdf/renderer";
import { ApartadoReceipt } from "@/components/pdf/ApartadoReceipt";

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

    // Buscar el apartado
    const apartado = await db.apartado.findUnique({
      where: { id },
      include: {
        prenda: true,
        cliente: true
      }
    });

    if (!apartado) {
      return new NextResponse("Apartado no encontrado", { status: 404 });
    }

    // Traer la configuración
    const config = await db.configuracionNegocio.findUnique({
      where: { id: "default" }
    });

    // Generar PDF
    const stream = await renderToStream(<ApartadoReceipt apartado={apartado} config={config || {}} />);

    // Web stream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      }
    });

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="ticket-apartado-${apartado.id.substring(0,8)}.pdf"`
      }
    });

  } catch (error) {
    console.error("Error generando ticket de apartado:", error);
    return new NextResponse("Error interno generando el recibo", { status: 500 });
  }
}
