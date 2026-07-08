import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST — Anular a sale
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { ventaId, motivo } = body;

    if (!ventaId) {
      return NextResponse.json(
        { error: "ventaId es requerido" },
        { status: 400 }
      );
    }

    if (!motivo || motivo.trim() === "") {
      return NextResponse.json(
        { error: "El motivo de anulación es requerido" },
        { status: 400 }
      );
    }

    await db.$transaction(async (tx) => {
      // 1. Find the venta with items and prendas
      const venta = await tx.venta.findUnique({
        where: { id: ventaId },
        include: {
          items: {
            include: {
              prenda: true,
            },
          },
        },
      });

      if (!venta) {
        throw new Error("Venta no encontrada");
      }

      // 2. Check it's not already anulada
      if (venta.anulada) {
        throw new Error("Esta venta ya fue anulada");
      }

      // 3. Set anulada=true, motivoAnulacion=motivo
      await tx.venta.update({
        where: { id: ventaId },
        data: {
          anulada: true,
          motivoAnulacion: motivo.trim(),
        },
      });

      // 4. For each item, set the prenda estado back to EN_VITRINA and fechaVenta=null
      for (const item of venta.items) {
        await tx.prenda.update({
          where: { id: item.prendaId },
          data: {
            estado: "EN_VITRINA",
            fechaVenta: null,
          },
        });
      }

      // 5. If the venta had a cierreCajaId, decrement payment counters
      if (venta.cierreCajaId) {
        const decrementData: any = {
          totalVentasSistema: { decrement: venta.total },
        };

        if (venta.medioPago === "EFECTIVO") {
          decrementData.ventasEfectivo = { decrement: venta.total };
        } else if (venta.medioPago === "TARJETA") {
          decrementData.ventasTarjeta = { decrement: venta.total };
        } else if (venta.medioPago === "TRANSFERENCIA") {
          decrementData.ventasTransferencia = { decrement: venta.total };
        } else if (venta.medioPago === "MIXTO" && venta.desglosePago) {
          const desglose = JSON.parse(venta.desglosePago);
          if (desglose.efectivo) {
            decrementData.ventasEfectivo = { decrement: desglose.efectivo };
          }
          if (desglose.tarjeta) {
            decrementData.ventasTarjeta = { decrement: desglose.tarjeta };
          }
          if (desglose.transferencia) {
            decrementData.ventasTransferencia = { decrement: desglose.transferencia };
          }
        }

        await tx.cierreCaja.update({
          where: { id: venta.cierreCajaId },
          data: decrementData,
        });
      }

      // 6. Create AuditLog entry
      await tx.auditLog.create({
        data: {
          entidad: "Venta",
          entidadId: ventaId,
          accion: "VENTA_ANULADA",
          usuarioId: session.user.id,
          motivo: motivo.trim(),
          valorAnterior: JSON.stringify({
            anulada: false,
            total: venta.total,
            medioPago: venta.medioPago,
          }),
          valorNuevo: JSON.stringify({
            anulada: true,
            motivoAnulacion: motivo.trim(),
          }),
        },
      });
    });

    return NextResponse.json({ success: true, message: "Venta anulada exitosamente" });
  } catch (error: any) {
    console.error("Error anulando venta:", error);
    return NextResponse.json(
      { error: error.message || "Error anulando la venta" },
      { status: 400 }
    );
  }
}
