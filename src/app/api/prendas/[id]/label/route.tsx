import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { renderToStream } from "@react-pdf/renderer";
import { LabelBarcode } from "@/components/pdf/LabelBarcode";

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

    // Buscar la prenda
    const prenda = await db.prenda.findUnique({
      where: { id }
    });

    if (!prenda) {
      return new NextResponse("Prenda no encontrada", { status: 404 });
    }

    // Generar el PDF
    const stream = await renderToStream(<LabelBarcode prenda={prenda} />);

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
        // Inline para que el navegador lo abra directamente para imprimir
        "Content-Disposition": `inline; filename="etiqueta-${prenda.codigo}.pdf"`
      }
    });

  } catch (error) {
    console.error("Error generando etiqueta:", error);
    return new NextResponse("Error interno generando la etiqueta", { status: 500 });
  }
}
