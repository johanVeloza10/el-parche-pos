import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { renderToStream } from "@react-pdf/renderer";
import ArqueoCajaPDF from "@/components/pdf/ArqueoCajaPDF";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const caja = await db.cierreCaja.findUnique({
      where: { id: params.id },
      include: {
        usuario: true,
      },
    });

    if (!caja) {
      return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 });
    }

    const config = await db.configuracionNegocio.findFirst();

    const stream = await renderToStream(<ArqueoCajaPDF caja={caja} config={config || {}} />);

    const readable = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => controller.enqueue(chunk));
        stream.on("end", () => controller.close());
        stream.on("error", (err) => controller.error(err));
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Arqueo_Caja_${caja.id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Error generando PDF", details: error.message },
      { status: 500 }
    );
  }
}
