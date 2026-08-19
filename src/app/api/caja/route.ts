import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

const NUMERO_DUENA = "3153259229";

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
        usuario: {
          select: { nombre: true }
        },
        _count: {
          select: { ventas: true },
        },
      },
    });

    return NextResponse.json({ caja: cajaAbierta }, { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } });
  } catch (error: any) {
    console.error("Error obteniendo caja:", error);
    return NextResponse.json(
      { error: error.message || "Error obteniendo caja" },
      { status: 500 }
    );
  }
}

// POST — Open a new caja
export async function POST(req: NextRequest) {
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

    const body = await req.json().catch(() => ({}));
    const { fondoInicial } = body;

    const nuevaCaja = await db.cierreCaja.create({
      data: {
        usuarioId: session.user.id,
        estado: "ABIERTA",
        fondoInicial: fondoInicial || 0,
      },
    });

    // Enviar WhatsApp a la dueña
    const msg = `🟢 *APERTURA DE CAJA*\nFecha: ${new Date().toLocaleString("es-CO")}\nCajero: ${session.user.name || "N/A"}\nFondo Inicial: $${(fondoInicial || 0).toLocaleString("es-CO")}`;
    await sendWhatsAppMessage(NUMERO_DUENA, msg);

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

    // Calculate diferencia = efectivoContado - (fondoInicial + ventasEfectivo + abonosApartados - gastosEfectivo)
    const efectivoEsperado = cajaAbierta.fondoInicial + cajaAbierta.ventasEfectivo + cajaAbierta.abonosApartados - cajaAbierta.gastosEfectivo;
    const diferencia = efectivoContado - efectivoEsperado;

    const cajaCerrada = await db.cierreCaja.update({
      where: { id: cajaAbierta.id },
      data: {
        estado: "CERRADA",
        efectivoContado,
        diferencia,
        observacion: observacion || null,
      },
      include: {
        usuario: {
          select: { nombre: true }
        },
        _count: {
          select: { ventas: true },
        },
      },
    });

    // Enviar WhatsApp a la dueña
    const msg = `💰 *CIERRE DE CAJA*\nFecha: ${new Date().toLocaleString("es-CO")}\nCajero: ${cajaCerrada.usuario?.nombre || "N/A"}\n\n` +
      `Total Ventas Sistema: $${cajaCerrada.totalVentasSistema.toLocaleString("es-CO")}\n` +
      `  - Efectivo: $${cajaCerrada.ventasEfectivo.toLocaleString("es-CO")}\n` +
      `  - Tarjeta: $${cajaCerrada.ventasTarjeta.toLocaleString("es-CO")}\n` +
      `  - Transferencias: $${cajaCerrada.ventasTransferencia.toLocaleString("es-CO")}\n` +
      `  - Notas de Crédito: $${cajaCerrada.ventasNotaCredito.toLocaleString("es-CO")}\n\n` +
      `Efectivo en Caja (Contado por cajero): $${cajaCerrada.efectivoContado?.toLocaleString("es-CO")}\n` +
      `Abonos Apartados: $${cajaCerrada.abonosApartados.toLocaleString("es-CO")}\n` +
      `Gastos Día: $${cajaCerrada.gastosEfectivo.toLocaleString("es-CO")}\n\n` +
      `Efectivo Esperado: $${efectivoEsperado.toLocaleString("es-CO")}\n` +
      `Efectivo Contado: $${efectivoContado.toLocaleString("es-CO")}\n` +
      `Diferencia: $${diferencia.toLocaleString("es-CO")}\n` +
      (observacion ? `Observación: ${observacion}` : "");
      
    await sendWhatsAppMessage(NUMERO_DUENA, msg);

    return NextResponse.json({ caja: cajaCerrada }, { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } });
  } catch (error: any) {
    console.error("Error cerrando caja:", error);
    return NextResponse.json(
      { error: error.message || "Error cerrando caja" },
      { status: 500 }
    );
  }
}
