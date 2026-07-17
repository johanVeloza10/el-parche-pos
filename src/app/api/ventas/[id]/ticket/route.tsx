import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { renderToStream } from "@react-pdf/renderer";
import { TicketReceipt } from "@/components/pdf/TicketReceipt";

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

    // Buscar la venta con todos sus detalles
    const venta = await db.venta.findUnique({
      where: { id },
      include: {
        usuario: { select: { nombre: true } },
        items: {
          include: {
            prenda: { select: { descripcion: true, codigo: true } }
          }
        },
        documentoFiscal: true
      }
    });

    if (!venta) {
      return new NextResponse("Venta no encontrada", { status: 404 });
    }

    // Traer la configuración del negocio para el logo/encabezado
    const config = await db.configuracionNegocio.findUnique({
      where: { id: "default" }
    });

    // Generar el PDF
    const stream = await renderToStream(<TicketReceipt venta={venta} config={config || {}} />);

    // Convertir el stream de Node a un ReadableStream web
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
        // Mostrar en el navegador en lugar de descargar directamente:
        "Content-Disposition": `inline; filename="ticket-${venta.id.substring(0,8)}.pdf"`
      }
    });

  } catch (error) {
    console.error("Error generando ticket:", error);
    return new NextResponse("Error interno generando el recibo", { status: 500 });
  }
}
