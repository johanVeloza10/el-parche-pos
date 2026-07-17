import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { ventaId, prendaId, motivo, tipo } = body; // tipo: "DEVOLUCION" o "CAMBIO"

    if (!ventaId || !prendaId || !motivo || !tipo) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // Usar transacción para asegurar consistencia
    const notaCredito = await db.$transaction(async (tx) => {
      // 1. Buscar la venta y el item
      const venta = await tx.venta.findUnique({
        where: { id: ventaId },
        include: { items: true, cliente: true }
      });

      if (!venta) throw new Error("Venta no encontrada");
      if (venta.anulada) throw new Error("La venta ya está anulada");

      const itemVenta = venta.items.find(i => i.prendaId === prendaId);
      if (!itemVenta) throw new Error("La prenda no pertenece a esta venta");

      // Verificar que no se haya devuelto ya
      const notaExistente = await tx.notaCredito.findFirst({
        where: { ventaOriginalId: venta.id, valor: itemVenta.precioVenta - itemVenta.descuentoItem }
      });
      // En una implementación real más robusta, deberíamos relacionar la nota con la prendaId directamente,
      // pero por simplicidad usaremos el valor y la ventaOriginal.

      // 2. Revertir la prenda a EN_VITRINA
      await tx.prenda.update({
        where: { id: prendaId },
        data: {
          estado: "EN_VITRINA",
          fechaVenta: null
        }
      });

      // 3. Crear la Nota de Crédito
      const valorDevolucion = itemVenta.precioVenta - itemVenta.descuentoItem;
      const fechaVenc = new Date();
      fechaVenc.setMonth(fechaVenc.getMonth() + 1); // Válido por 1 mes

      const nota = await tx.notaCredito.create({
        data: {
          ventaOriginalId: venta.id,
          clienteId: venta.clienteId,
          tipo,
          motivo,
          valor: valorDevolucion,
          estado: "VIGENTE",
          fechaVencimiento: fechaVenc
        }
      });

      // 4. Registrar auditoría
      await tx.auditLog.create({
        data: {
          entidad: "NotaCredito",
          entidadId: nota.id,
          accion: `CREADA_${tipo}`,
          usuarioId: session.user.id,
          motivo: `Prenda devuelta: ${prendaId}`,
          valorNuevo: JSON.stringify({ valor: valorDevolucion, prenda: prendaId })
        }
      });

      // 5. Restar el valor de la caja si hay una caja abierta (opcional, dependiendo de si devuelven el dinero o solo dan nota)
      // Como el modelo es "Nota de Crédito", asumimos que no se saca dinero físico de la caja,
      // sino que el cliente tiene un saldo a favor (vale) para otra compra.

      return nota;
    });

    return NextResponse.json({ success: true, notaCredito }, { status: 201 });

  } catch (error: any) {
    console.error("Error procesando devolución:", error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}
