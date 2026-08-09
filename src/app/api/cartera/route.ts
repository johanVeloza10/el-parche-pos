import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Listar todas las Cuentas por Cobrar con saldo > 0
    const cuentas = await db.cuentaPorCobrar.findMany({
      where: {
        saldoPendiente: { gt: 0 }
      },
      include: {
        cliente: true,
        venta: {
          include: {
            items: {
              include: { prenda: true }
            }
          }
        },
        historialAbonos: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(cuentas);
  } catch (error) {
    console.error("Error obteniendo cartera:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { cuentaId, abono, medioPago } = await req.json();

    if (!cuentaId || typeof abono !== "number" || abono <= 0) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const cuenta = await db.cuentaPorCobrar.findUnique({
      where: { id: cuentaId },
      include: { historialAbonos: true, venta: true }
    });

    if (!cuenta) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }

    if (cuenta.saldoPendiente <= 0) {
      return NextResponse.json({ error: "Esta cuenta ya está pagada" }, { status: 400 });
    }

    const montoAbono = Math.min(abono, cuenta.saldoPendiente);
    const nuevoSaldo = cuenta.saldoPendiente - montoAbono;
    const nuevoEstado = nuevoSaldo === 0 ? "PAGADA" : "PENDIENTE";
    const paymentMethod = medioPago || "EFECTIVO";

    // Buscar caja abierta
    const cajaAbierta = await db.cierreCaja.findFirst({
      where: { estado: "ABIERTA" }
    });

    const result = await db.$transaction(async (tx) => {
      // 1. Crear el abono
      const nuevoAbono = await tx.abonoCuentaCobrar.create({
        data: {
          cuentaCobrarId: cuentaId,
          monto: montoAbono,
          medioPago: paymentMethod,
          cajeroId: session.user.id,
          cajeroNombre: session.user.name || "Cajero",
          cierreCajaId: cajaAbierta?.id || null
        }
      });

      // 2. Actualizar cuenta
      const cuentaActualizada = await tx.cuentaPorCobrar.update({
        where: { id: cuentaId },
        data: {
          abonos: { increment: montoAbono },
          saldoPendiente: nuevoSaldo,
          estado: nuevoEstado
        }
      });

      // 3. Registrar en Caja si hay caja abierta
      if (cajaAbierta) {
        const updateData: any = {};
        if (paymentMethod === "EFECTIVO") {
          updateData.ventasEfectivo = { increment: montoAbono };
        } else if (paymentMethod === "TARJETA") {
          updateData.ventasTarjeta = { increment: montoAbono };
        } else if (paymentMethod === "TRANSFERENCIA") {
          updateData.ventasTransferencia = { increment: montoAbono };
        }
        updateData.totalVentasSistema = { increment: montoAbono };

        await tx.cierreCaja.update({
          where: { id: cajaAbierta.id },
          data: updateData
        });
      }

      return cuentaActualizada;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error registrando abono:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
