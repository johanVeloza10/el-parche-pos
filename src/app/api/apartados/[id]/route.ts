import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const apartado = await db.apartado.findUnique({
      where: { id },
      include: {
        prenda: true,
        cliente: true,
      },
    });

    if (!apartado) {
      return NextResponse.json({ error: "Apartado no encontrado" }, { status: 404 });
    }

    return NextResponse.json(apartado, { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } });
  } catch (error: any) {
    console.error("Error al obtener apartado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { nuevoAbono, medioPago, desglosePago, liquidar } = body;

    if (typeof nuevoAbono !== 'number' || nuevoAbono <= 0) {
      return NextResponse.json({ error: "nuevoAbono debe ser mayor a 0" }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      const cajaAbierta = await tx.cierreCaja.findFirst({
        where: {
          usuarioId: session.user.id,
          estado: "ABIERTA",
        },
      });

      if (!cajaAbierta) {
        throw new Error("No hay una caja abierta para este usuario");
      }

      const apartado = await tx.apartado.findUnique({
        where: { id },
        include: { prenda: true }
      });

      if (!apartado) {
        throw new Error("Apartado no encontrado");
      }

      if (apartado.estado !== "VIGENTE") {
        throw new Error(`El apartado no está vigente (Estado actual: ${apartado.estado})`);
      }

      let apartadoUpdated;

      if (liquidar) {
        const remainingBalance = apartado.totalPrenda - apartado.abono;

        if (nuevoAbono < remainingBalance) {
          throw new Error("Para liquidar, el nuevo abono debe cubrir el saldo restante");
        }

        apartadoUpdated = await tx.apartado.update({
          where: { id },
          data: {
            abono: apartado.totalPrenda,
            estado: 'COMPLETADO',
          }
        });

        let paraProveedor = 0;
        let comisionBoutique = apartado.totalPrenda;

        if (apartado.prenda.origen === "CONSIGNACION" && apartado.prenda.proveedorId) {
          if (apartado.prenda.modoComision === "VALOR_FIJO" && apartado.prenda.valorProveedor) {
            paraProveedor = apartado.prenda.valorProveedor;
          } else if (apartado.prenda.modoComision === "PORCENTAJE" && apartado.prenda.comisionPct) {
            const porcentajeParaProveedor = 100 - apartado.prenda.comisionPct;
            paraProveedor = Math.round(apartado.totalPrenda * (porcentajeParaProveedor / 100));
          }
          comisionBoutique = apartado.totalPrenda - paraProveedor;
        }

        const venta = await tx.venta.create({
          data: {
            usuarioId: session.user.id,
            clienteId: apartado.clienteId,
            cierreCajaId: cajaAbierta.id,
            medioPago: medioPago || "EFECTIVO",
            desglosePago: desglosePago ? JSON.stringify(desglosePago) : null,
            subtotal: apartado.totalPrenda,
            descuento: 0,
            total: apartado.totalPrenda,
            politicaDescuento: "ASUME_BOUTIQUE",
            items: {
              create: [{
                prendaId: apartado.prendaId,
                precioVenta: apartado.totalPrenda,
                descuentoItem: 0,
                paraProveedor: paraProveedor,
                comisionBoutique: comisionBoutique,
                esProduccionPropia: apartado.prenda.origen === "PRODUCCION_PROPIA",
                costoProduccion: apartado.prenda.costoProduccion,
              }]
            }
          }
        });

        await tx.prenda.update({
          where: { id: apartado.prendaId },
          data: { 
            estado: 'VENDIDA',
            fechaVenta: new Date()
          }
        });

        await tx.auditLog.create({
          data: {
            entidad: "Prenda",
            entidadId: apartado.prendaId,
            accion: "VENTA_REGISTRADA",
            usuarioId: session.user.id,
            motivo: `Liquidación de apartado, Vendida en factura #${venta.id}`,
            valorAnterior: JSON.stringify({ estado: "APARTADA" }),
            valorNuevo: JSON.stringify({ estado: "VENDIDA" })
          }
        });

      } else {
        apartadoUpdated = await tx.apartado.update({
          where: { id },
          data: {
            abono: { increment: nuevoAbono }
          }
        });
      }

      const updateData: any = {};
      if (medioPago === "EFECTIVO") {
        updateData.ventasEfectivo = { increment: nuevoAbono };
      } else if (medioPago === "TARJETA") {
        updateData.ventasTarjeta = { increment: nuevoAbono };
      } else if (medioPago === "TRANSFERENCIA") {
        updateData.ventasTransferencia = { increment: nuevoAbono };
      } else if (medioPago === "MIXTO" && desglosePago) {
        const desglose = typeof desglosePago === "string"
          ? JSON.parse(desglosePago)
          : desglosePago;
        if (desglose.efectivo) {
          updateData.ventasEfectivo = { increment: desglose.efectivo };
        }
        if (desglose.tarjeta) {
          updateData.ventasTarjeta = { increment: desglose.tarjeta };
        }
        if (desglose.transferencia) {
          updateData.ventasTransferencia = { increment: desglose.transferencia };
        }
      }

      updateData.totalVentasSistema = { increment: nuevoAbono };

      await tx.cierreCaja.update({
        where: { id: cajaAbierta.id },
        data: updateData
      });

      return apartadoUpdated;
    });

    return NextResponse.json({ apartado: result }, { status: 200 });

  } catch (error: any) {
    console.error("Error al actualizar apartado:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
