import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { renderToStream } from "@react-pdf/renderer";
import { LiquidationReceipt } from "@/components/pdf/LiquidationReceipt";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.rol !== "ADMIN" && session.user.rol !== "CONTADOR")) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const { id } = params;

    // Buscar liquidación
    const liquidacion = await db.liquidacion.findUnique({
      where: { id },
      include: {
        proveedor: true,
        items: true
      }
    });

    if (!liquidacion) {
      return new NextResponse("Liquidación no encontrada", { status: 404 });
    }

    // Traer la configuración global
    const config = await db.configuracionNegocio.findUnique({
      where: { id: "default" }
    });

    // Generar el stream del PDF
    const stream = await renderToStream(<LiquidationReceipt liq={liquidacion} config={config || {}} />);

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
        "Content-Disposition": `inline; filename="liquidacion-${liquidacion.id.substring(0, 8)}.pdf"`
      }
    });

  } catch (error) {
    console.error("Error generando PDF de liquidación:", error);
    return new NextResponse("Error generando el comprobante", { status: 500 });
  }
}
