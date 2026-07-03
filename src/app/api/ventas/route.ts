import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { billingProvider } from "@/lib/facturacion";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { items, medioPago, desglosePago, clienteId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No hay prendas en la venta" }, { status: 400 });
    }

    // Calculamos totales desde el frontend, pero siempre debemos re-validar con BD
    const prendaIds = items.map((item: any) => item.id);
    
    // TRANSACTION: Todo o nada
    const nuevaVenta = await db.$transaction(async (tx) => {
      // 0. Buscar cierre de caja abierto para el usuario actual
      const cajaAbierta = await tx.cierreCaja.findFirst({
        where: {
          usuarioId: session.user.id,
          estado: "ABIERTA"
        }
      });

      // 1. Bloqueamos/Revisamos las prendas
      const prendasEnBd = await tx.prenda.findMany({
        where: { id: { in: prendaIds } },
      });

      if (prendasEnBd.length !== items.length) {
        throw new Error("Algunas prendas no existen");
      }

      for (const p of prendasEnBd) {
        if (p.estado !== "EN_VITRINA") {
          throw new Error(`La prenda ${p.codigo} ya no está disponible (Estado: ${p.estado})`);
        }
      }

      // 2. Preparamos los items de venta calculando comisiones
      let subtotalVenta = 0;
      let totalDescuento = 0;
      let totalVenta = 0;

      const itemsParaCrear = prendasEnBd.map(prendaBd => {
        const itemFrontend = items.find((i: any) => i.id === prendaBd.id);
        const descuentoItem = itemFrontend.descuento || 0;
        
        const precioVenta = prendaBd.precioVenta;
        const precioFinalItem = precioVenta - descuentoItem;
        
        subtotalVenta += precioVenta;
        totalDescuento += descuentoItem;
        totalVenta += precioFinalItem;

        let paraProveedor = 0;
        let comisionBoutique = precioFinalItem;

        if (prendaBd.origen === "CONSIGNACION" && prendaBd.proveedorId) {
          if (prendaBd.modoComision === "VALOR_FIJO" && prendaBd.valorProveedor) {
            paraProveedor = prendaBd.valorProveedor;
          } else if (prendaBd.modoComision === "PORCENTAJE" && prendaBd.comisionPct) {
            const porcentajeParaProveedor = 100 - prendaBd.comisionPct;
            paraProveedor = Math.round(precioVenta * (porcentajeParaProveedor / 100));
          }
          comisionBoutique = precioFinalItem - paraProveedor;
        }

        return {
          prendaId: prendaBd.id,
          precioVenta: precioVenta,
          descuentoItem: descuentoItem,
          paraProveedor: paraProveedor,
          comisionBoutique: comisionBoutique,
          esProduccionPropia: prendaBd.origen === "PRODUCCION_PROPIA",
          costoProduccion: prendaBd.costoProduccion,
        };
      });

      // 3. Crear la Venta
      const venta = await tx.venta.create({
        data: {
          usuarioId: session.user.id,
          clienteId: clienteId || null,
          cierreCajaId: cajaAbierta?.id || null,
          medioPago: medioPago || "EFECTIVO",
          desglosePago: desglosePago ? JSON.stringify(desglosePago) : null,
          subtotal: subtotalVenta,
          descuento: totalDescuento,
          total: totalVenta,
          politicaDescuento: "ASUME_BOUTIQUE",
          items: {
            create: itemsParaCrear
          }
        },
        include: {
          items: {
            include: {
              prenda: true
            }
          },
          cliente: true
        }
      });

      // 4. Actualizar estado de las prendas a VENDIDA
      await tx.prenda.updateMany({
        where: { id: { in: prendaIds } },
        data: { 
          estado: "VENDIDA",
          fechaVenta: new Date()
        }
      });

      // 5. Registrar en AuditLog
      for (const p of prendasEnBd) {
        await tx.auditLog.create({
          data: {
            entidad: "Prenda",
            entidadId: p.id,
            accion: "VENTA_REGISTRADA",
            usuarioId: session.user.id,
            motivo: `Vendida en factura #${venta.id}`,
            valorAnterior: JSON.stringify({ estado: "EN_VITRINA" }),
            valorNuevo: JSON.stringify({ estado: "VENDIDA" })
          }
        });
      }

      // Si hay caja abierta, acumulamos los totales en caja
      if (cajaAbierta) {
        const updateData: any = {};
        if (medioPago === "EFECTIVO") updateData.ventasEfectivo = { increment: totalVenta };
        else if (medioPago === "TARJETA") updateData.ventasTarjeta = { increment: totalVenta };
        else if (medioPago === "TRANSFERENCIA") updateData.ventasTransferencia = { increment: totalVenta };
        
        updateData.totalVentasSistema = { increment: totalVenta };
        
        await tx.cierreCaja.update({
          where: { id: cajaAbierta.id },
          data: updateData
        });
      }

      return venta;
    });

    // --- LLAMAR A FACTURACIÓN DIAN (Fuera de la transacción de DB principal) ---
    try {
      const vdto = {
        id: nuevaVenta.id,
        total: nuevaVenta.total,
        descuento: nuevaVenta.descuento,
        medioPago: nuevaVenta.medioPago,
        items: nuevaVenta.items.map(item => ({
          prendaId: item.prendaId,
          precioVenta: item.precioVenta,
          descripcion: item.prenda.descripcion
        }))
      };

      let result;
      let tipoDoc = "DEE_POS";

      if (nuevaVenta.cliente) {
        tipoDoc = "FACTURA_ELECTRONICA";
        const cdto = {
          nombre: nuevaVenta.cliente.nombre,
          tipoDocumento: nuevaVenta.cliente.tipoDocumento,
          numeroDocumento: nuevaVenta.cliente.numeroDocumento,
          email: nuevaVenta.cliente.email
        };
        result = await billingProvider.emitirFacturaElectronica(vdto, cdto);
      } else {
        result = await billingProvider.emitirDeePos(vdto);
      }

      // Crear DocumentoFiscal con la respuesta exitosa o rechazada
      await db.documentoFiscal.create({
        data: {
          ventaId: nuevaVenta.id,
          tipo: tipoDoc,
          numero: result.numero,
          cufe: result.cufe,
          qrData: result.qrData,
          estadoTransmision: result.estadoTransmision,
          clienteNombre: nuevaVenta.cliente?.nombre || null,
          clienteDocumento: nuevaVenta.cliente?.numeroDocumento || null,
          clienteEmail: nuevaVenta.cliente?.email || null,
          payloadEnviado: JSON.stringify(vdto),
          respuestaProveedor: JSON.stringify(result.respuestaProveedor)
        }
      });

    } catch (billingError) {
      console.error("Fallo emitiendo documento DIAN, se guardará como PENDIENTE:", billingError);
      
      // Creamos el documento como PENDIENTE para permitir retransmisión
      await db.documentoFiscal.create({
        data: {
          ventaId: nuevaVenta.id,
          tipo: nuevaVenta.cliente ? "FACTURA_ELECTRONICA" : "DEE_POS",
          numero: `PEND-${nuevaVenta.id.substring(0, 8).toUpperCase()}`,
          estadoTransmision: "PENDIENTE",
          clienteNombre: nuevaVenta.cliente?.nombre || null,
          clienteDocumento: nuevaVenta.cliente?.numeroDocumento || null,
          clienteEmail: nuevaVenta.cliente?.email || null,
          respuestaProveedor: JSON.stringify({ error: "No se pudo conectar con el proveedor de facturación" })
        }
      });
    }

    return NextResponse.json({ success: true, ventaId: nuevaVenta.id });

  } catch (error: any) {
    console.error("Error procesando venta:", error);
    return NextResponse.json({ error: error.message || "Error procesando la venta" }, { status: 400 });
  }
}

