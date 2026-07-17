import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado");

    const apartados = await db.apartado.findMany({
      where: estado ? { estado } : undefined,
      include: {
        prenda: true,
        cliente: true,
      },
      orderBy: {
        fechaCreacion: "desc",
      },
    });

    return NextResponse.json(apartados);
  } catch (error: any) {
    console.error("Error al obtener apartados:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { clienteId, prendas, abonoTotal, medioPago, desglosePago } = body;

    if (!clienteId) {
      return NextResponse.json({ error: "clienteId es requerido" }, { status: 400 });
    }

    if (!prendas || prendas.length === 0) {
      return NextResponse.json({ error: "prendas no puede estar vacío" }, { status: 400 });
    }

    if (typeof abonoTotal !== 'number' || abonoTotal <= 0) {
      return NextResponse.json({ error: "abonoTotal debe ser mayor a 0" }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      // Buscar cierre de caja abierto para el usuario actual
      const cajaAbierta = await tx.cierreCaja.findFirst({
        where: {
          usuarioId: session.user.id,
          estado: "ABIERTA",
        },
      });

      if (!cajaAbierta) {
        throw new Error("No hay una caja abierta para este usuario");
      }

      const totalPrendas = prendas.reduce((sum: number, p: any) => sum + p.precioVenta, 0);

      const createdApartados = [];
      let abonoRestante = abonoTotal;

      for (let i = 0; i < prendas.length; i++) {
        const prendaInput = prendas[i];
        const prenda = await tx.prenda.findUnique({ where: { id: prendaInput.id } });

        if (!prenda) {
          throw new Error(`Prenda con ID ${prendaInput.id} no encontrada`);
        }

        if (prenda.estado !== "EN_VITRINA") {
          throw new Error(`Prenda ${prenda.codigo} no está en vitrina (Estado actual: ${prenda.estado})`);
        }

        let abonoPrenda = 0;
        if (i === prendas.length - 1) {
          abonoPrenda = abonoRestante;
        } else {
          abonoPrenda = Math.round((prenda.precioVenta / totalPrendas) * abonoTotal);
          abonoRestante -= abonoPrenda;
        }

        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() + 30);

        const apartado = await tx.apartado.create({
          data: {
            prendaId: prenda.id,
            clienteId: clienteId,
            abono: abonoPrenda,
            totalPrenda: prenda.precioVenta,
            fechaLimite: fechaLimite,
            estado: "VIGENTE",
          },
        });

        await tx.prenda.update({
          where: { id: prenda.id },
          data: { estado: "APARTADA" },
        });

        createdApartados.push(apartado.id);
      }

      const updateData: any = {};

      if (medioPago === "EFECTIVO") {
        updateData.ventasEfectivo = { increment: abonoTotal };
      } else if (medioPago === "TARJETA") {
        updateData.ventasTarjeta = { increment: abonoTotal };
      } else if (medioPago === "TRANSFERENCIA") {
        updateData.ventasTransferencia = { increment: abonoTotal };
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

      updateData.abonosApartados = { increment: abonoTotal };
      updateData.totalVentasSistema = { increment: abonoTotal };

      await tx.cierreCaja.update({
        where: { id: cajaAbierta.id },
        data: updateData
      });

      return createdApartados;
    });

    return NextResponse.json({ apartados: result }, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear apartados:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
