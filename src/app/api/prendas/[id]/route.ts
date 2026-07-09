import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// PATCH /api/prendas/[id] - Actualizar precio o estado de una prenda
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { precioVenta, estado, valorProveedor, categoria, descripcion } = body;

    // Buscar prenda existente
    const prenda = await db.prenda.findUnique({
      where: { id }
    });

    if (!prenda) {
      return NextResponse.json({ error: "Prenda no encontrada" }, { status: 404 });
    }

    // Preparar campos para actualizar
    const updateData: any = {};
    const auditChanges: any = {};

    if (precioVenta !== undefined) {
      updateData.precioVenta = parseInt(precioVenta);
      auditChanges.precioVenta = {
        anterior: prenda.precioVenta,
        nuevo: parseInt(precioVenta)
      };
      
      // Recalcular comisionPct si es de consignación y tiene valorProveedor
      if (prenda.origen === "CONSIGNACION" && prenda.valorProveedor) {
        const provVal = prenda.valorProveedor;
        const newPrice = parseInt(precioVenta);
        if (newPrice > 0) {
          updateData.comisionPct = Math.round(((newPrice - provVal) / newPrice) * 10000) / 100;
        }
      }
    }

    if (estado !== undefined) {
      updateData.estado = estado;
      auditChanges.estado = {
        anterior: prenda.estado,
        nuevo: estado
      };
      if (estado === "VENDIDA") {
        updateData.fechaVenta = new Date();
      } else if (estado === "EN_VITRINA") {
        updateData.fechaVenta = null;
      }
    }

    if (valorProveedor !== undefined) {
      updateData.valorProveedor = parseInt(valorProveedor);
      auditChanges.valorProveedor = {
        anterior: prenda.valorProveedor,
        nuevo: parseInt(valorProveedor)
      };

      // Recalcular comisionPct si se cambia el valorProveedor
      const currentPrice = updateData.precioVenta || prenda.precioVenta;
      const newVal = parseInt(valorProveedor);
      if (currentPrice > 0) {
        updateData.comisionPct = Math.round(((currentPrice - newVal) / currentPrice) * 10000) / 100;
      }
    }

    if (categoria !== undefined) updateData.categoria = categoria;
    if (descripcion !== undefined) updateData.descripcion = descripcion;

    // Actualizar Prenda
    const prendaActualizada = await db.prenda.update({
      where: { id },
      data: updateData
    });

    // Registrar en AuditLog
    await db.auditLog.create({
      data: {
        entidad: "Prenda",
        entidadId: id,
        accion: "ACTUALIZACION_PRENDA",
        usuarioId: session.user.id,
        motivo: "Edición rápida desde inventario",
        valorAnterior: JSON.stringify({ estado: prenda.estado, precioVenta: prenda.precioVenta, valorProveedor: prenda.valorProveedor }),
        valorNuevo: JSON.stringify(updateData)
      }
    });

    return NextResponse.json(prendaActualizada);

  } catch (error: any) {
    console.error("Error actualizando prenda:", error);
    return NextResponse.json({ error: error.message || "Error al actualizar" }, { status: 400 });
  }
}

// DELETE /api/prendas/[id] - Soft delete prenda
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const prenda = await db.prenda.findUnique({ where: { id } });

    if (!prenda) {
      return NextResponse.json({ error: "Prenda no encontrada" }, { status: 404 });
    }

    await db.prenda.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    await db.auditLog.create({
      data: {
        entidad: "Prenda",
        entidadId: id,
        accion: "ELIMINACION_PRENDA",
        usuarioId: session.user.id,
        motivo: "Eliminación desde el panel de administración"
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al eliminar" }, { status: 400 });
  }
}
