import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET — Get current open caja for the logged-in user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const cajaAbierta = await db.cierreCaja.findFirst({
      where: {
        usuarioId: session.user.id,
        estado: "ABIERTA",
      },
      include: {
        _count: {
          select: { ventas: true },
        },
      },
    });

    return NextResponse.json({ caja: cajaAbierta });
  } catch (error: any) {
    console.error("Error obteniendo caja:", error);
    return NextResponse.json(
      { error: error.message || "Error obteniendo caja" },
      { status: 500 }
    );
  }
}

// POST — Open a new caja
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check there isn't already an open caja for this user
    const cajaExistente = await db.cierreCaja.findFirst({
      where: {
        usuarioId: session.user.id,
        estado: "ABIERTA",
      },
    });

    if (cajaExistente) {
      return NextResponse.json(
        { error: "Ya tienes una caja abierta. Ciérrala antes de abrir otra." },
        { status: 400 }
      );
    }

    const nuevaCaja = await db.cierreCaja.create({
      data: {
        usuarioId: session.user.id,
        estado: "ABIERTA",
      },
    });

    return NextResponse.json({ caja: nuevaCaja }, { status: 201 });
  } catch (error: any) {
    console.error("Error abriendo caja:", error);
    return NextResponse.json(
      { error: error.message || "Error abriendo caja" },
      { status: 500 }
    );
  }
}

// PATCH — Close the current caja (arqueo)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { efectivoContado, observacion } = body;

    if (efectivoContado === undefined || efectivoContado === null) {
      return NextResponse.json(
        { error: "El campo efectivoContado es requerido" },
        { status: 400 }
      );
    }

    // Find the open caja for the current user
    const cajaAbierta = await db.cierreCaja.findFirst({
      where: {
        usuarioId: session.user.id,
        estado: "ABIERTA",
      },
    });

    if (!cajaAbierta) {
      return NextResponse.json(
        { error: "No tienes una caja abierta para cerrar" },
        { status: 404 }
      );
    }

    // Calculate diferencia = efectivoContado - ventasEfectivo
    const diferencia = efectivoContado - cajaAbierta.ventasEfectivo;

    const cajaCerrada = await db.cierreCaja.update({
      where: { id: cajaAbierta.id },
      data: {
        estado: "CERRADA",
        efectivoContado,
        diferencia,
        observacion: observacion || null,
      },
      include: {
        _count: {
          select: { ventas: true },
        },
      },
    });

    return NextResponse.json({ caja: cajaCerrada });
  } catch (error: any) {
    console.error("Error cerrando caja:", error);
    return NextResponse.json(
      { error: error.message || "Error cerrando caja" },
      { status: 500 }
    );
  }
}
