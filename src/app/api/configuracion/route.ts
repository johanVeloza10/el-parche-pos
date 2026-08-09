import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let config = await db.configuracionNegocio.findUnique({
      where: { id: "default" }
    });

    if (!config) {
      config = await db.configuracionNegocio.create({
        data: { id: "default" }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error obteniendo configuracion:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    
    // Solo permitimos actualizar campos específicos (ej. DIAN / técnicos)
    const data: any = {};
    if (body.regimenIva !== undefined) data.regimenIva = body.regimenIva;
    if (body.numeracionFactura !== undefined) data.numeracionFactura = body.numeracionFactura;
    
    const config = await db.configuracionNegocio.update({
      where: { id: "default" },
      data
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error actualizando configuracion:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
