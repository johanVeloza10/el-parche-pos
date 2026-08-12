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
    const { items, medioPago, desglosePago, clienteId, abonoCredito } = body;

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

      if (cajaAbierta) {
        // Verificar que la caja no sea de un día anterior
        const hoy = new Date();
        // Ajustamos ambas fechas a Bogotá para comparar el día
        const hoyStr = hoy.toLocaleString("en-US", { timeZone: "America/Bogota", day: "numeric", month: "numeric", year: "numeric" });
        const cajaStr = new Date(cajaAbierta.createdAt).toLocaleString("en-US", { timeZone: "America/Bogota", day: "numeric", month: "numeric", year: "numeric" });
        
        if (hoyStr !== cajaStr) {
          throw new Error("ALERTA: Tienes una caja abierta de un día anterior. Por favor ve al módulo 'Caja Diaria', haz el cierre de caja (Arqueo) y abre una nueva con la fecha de hoy para poder vender.");
        }
      }

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

      const itemsParaCrear = prendasEnBd.map((prendaBd: any) => {
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

      // 4.5. Si es crédito, crear CuentaPorCobrar
      if (medioPago === "CREDITO") {
        if (!clienteId) {
          throw new Error("El cliente es obligatorio para ventas a crédito");
        }
        
        const abonoInicialNum = abonoCredito || 0;
        const saldoPendiente = totalVenta - abonoInicialNum;
        
        const cuenta = await tx.cuentaPorCobrar.create({
          data: {
            ventaId: venta.id,
            clienteId: clienteId,
            saldoInicial: totalVenta,
            abonos: abonoInicialNum,
            saldoPendiente: saldoPendiente,
            estado: saldoPendiente <= 0 ? "PAGADA" : "PENDIENTE"
          }
        });

        if (abonoInicialNum > 0) {
          await tx.abonoCuentaCobrar.create({
            data: {
              cuentaCobrarId: cuenta.id,
              monto: abonoInicialNum,
              medioPago: "EFECTIVO", // By default abono inicial is cash in this simple flow
              cierreCajaId: cajaAbierta?.id || null,
              cajeroId: session.user.id,
              cajeroNombre: session.user.name || "Cajero"
            }
          });
        }
      }

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

        if (medioPago === "CREDITO") {
          // Venta a crédito / fiado: la prenda sale del inventario
          // Solo entra a caja si hay un abono inicial
          if (abonoCredito && abonoCredito > 0) {
            updateData.ventasEfectivo = { increment: abonoCredito };
            // Note: abonos a crédito podrían tener su propio contador, pero por ahora lo sumamos al efectivo
          }
          // El total de la venta se suma a reportes (totalVentasSistema)
        } else if (medioPago === "EFECTIVO") {
          updateData.ventasEfectivo = { increment: totalVenta };
        } else if (medioPago === "TARJETA") {
          updateData.ventasTarjeta = { increment: totalVenta };
        } else if (medioPago === "TRANSFERENCIA") {
          updateData.ventasTransferencia = { increment: totalVenta };
        } else if (medioPago === "MIXTO" && desglosePago) {
          // Parse desglose — it may already be an object from the frontend body
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

        updateData.totalVentasSistema = { increment: totalVenta };

        await tx.cierreCaja.update({
          where: { id: cajaAbierta.id },
          data: updateData
        });
      }

      return venta;
    });

    // --- LLAMAR A FACTURACIÓN DIAN (Simulado) ---
    try {
      const config = await db.configuracionNegocio.findUnique({ where: { id: "default" } });
      const currentDeePos = config?.numeracionDeePos || 0;
      const currentFactura = config?.numeracionFactura || 0;

      let tipoDoc = "DEE_POS";
      let nuevoConsecutivo = 0;

      if (nuevaVenta.cliente) {
        tipoDoc = "FACTURA_ELECTRONICA";
        nuevoConsecutivo = currentFactura + 1;
        await db.configuracionNegocio.update({
          where: { id: "default" },
          data: { numeracionFactura: nuevoConsecutivo }
        });
      } else {
        nuevoConsecutivo = currentDeePos + 1;
        await db.configuracionNegocio.update({
          where: { id: "default" },
          data: { numeracionDeePos: nuevoConsecutivo }
        });
      }

      const prefix = tipoDoc === "FACTURA_ELECTRONICA" ? "FE-" : "POS-";
      const numeroDoc = `${prefix}${nuevoConsecutivo.toString().padStart(6, '0')}`;

      // Crear DocumentoFiscal
      await db.documentoFiscal.create({
        data: {
          ventaId: nuevaVenta.id,
          tipo: tipoDoc,
          numero: numeroDoc,
          estadoTransmision: "ACEPTADO",
          clienteNombre: nuevaVenta.cliente?.nombre || null,
          clienteDocumento: nuevaVenta.cliente?.numeroDocumento || null,
          clienteEmail: nuevaVenta.cliente?.email || null,
          respuestaProveedor: JSON.stringify({ success: true, message: "Aceptado DIAN" })
        }
      });

    } catch (billingError) {
      console.error("Fallo generando documento:", billingError);
      
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
          respuestaProveedor: JSON.stringify({ error: "No se pudo generar consecutivo" })
        }
      });
    }

    return NextResponse.json({ success: true, ventaId: nuevaVenta.id });

  } catch (error: any) {
    console.error("Error procesando venta:", error);
    return NextResponse.json({ error: error.message || "Error procesando la venta" }, { status: 400 });
  }
}

