import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const pendientes = await db.documentoFiscal.count({
      where: {
        estadoTransmision: "PENDIENTE",
      },
    });

    return NextResponse.json({ pendientes }, { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } });
  } catch (error) {
    console.error("Error fetching DIAN alerts:", error);
    return NextResponse.json({ pendientes: 0 }, { status: 500 });
  }
}
