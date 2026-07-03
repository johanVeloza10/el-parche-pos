import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.rol !== "ADMIN" && session.user.rol !== "CONTADOR")) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mes = searchParams.get("mes"); // Ej: "2026-05"

    if (!mes) {
      return new NextResponse("El parámetro mes es requerido", { status: 400 });
    }

    const [anioStr, mesStr] = mes.split("-");
    const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const mesNombre = nombresMeses[parseInt(mesStr) - 1] || "Mes";

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "El Parche POS";
    workbook.lastModifiedBy = "El Parche POS";
    workbook.created = new Date();

    // ─── OBTENER DATOS DEL MES ──────────────────────────────────────────────────
    // 1. Verificar si hay histórico en HistoricoLibro
    const historicos = await db.historicoLibro.findMany({
      where: { mes },
      orderBy: { dia: "asc" }
    });

    let resumenDiarioData: any[] = [];
    let costosData: any[] = [];

    if (historicos.length > 0) {
      resumenDiarioData = historicos.map(h => ({
        fecha: h.fecha,
        ventasBrutas: h.ventasBrutas,
        pagosProveedores: h.pagosTerceros,
        ingresoReal: h.ingresoReal,
        gastos: h.gastos,
        saldo: h.saldoDia
      }));
    } else {
      // Mes dinámico (Junio en adelante)
      const fechaInicio = new Date(`${mes}-01T00:00:00.000Z`);
      const fechaFin = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 1, 0, 23, 59, 59, 999);

      const ventas = await db.venta.findMany({
        where: {
          fechaHora: { gte: fechaInicio, lte: fechaFin },
          anulada: false
        },
        include: { items: true },
        orderBy: { fechaHora: "asc" }
      });

      const gastos = await db.costoNegocio.findMany({
        where: { mes }
      });

      costosData = gastos.map(g => ({
        concepto: g.concepto,
        tipo: g.tipo,
        valor: g.valor
      }));

      // Agrupar ventas por día
      const ventasPorDia: Record<string, { ventasBrutas: number; pagos: number; ingreso: number }> = {};
      
      for (const v of ventas) {
        const diaStr = v.fechaHora.toISOString().split("T")[0];
        if (!ventasPorDia[diaStr]) {
          ventasPorDia[diaStr] = { ventasBrutas: 0, pagos: 0, ingreso: 0 };
        }
        
        ventasPorDia[diaStr].ventasBrutas += v.total;
        
        let pagosTerceros = 0;
        for (const item of v.items) {
          if (!item.esProduccionPropia) {
            pagosTerceros += item.paraProveedor;
          }
        }
        
        ventasPorDia[diaStr].pagos += pagosTerceros;
        ventasPorDia[diaStr].ingreso += (v.total - pagosTerceros);
      }

      // Distribución proporcional de gastos del mes para los saldos diarios
      const totalDias = Object.keys(ventasPorDia).length;
      const totalGastos = gastos.reduce((sum, g) => sum + g.valor, 0);
      const gastoDiarioProp = totalDias > 0 ? Math.round(totalGastos / totalDias) : 0;

      resumenDiarioData = Object.entries(ventasPorDia).map(([fecha, info]) => ({
        fecha,
        ventasBrutas: info.ventasBrutas,
        pagosProveedores: info.pagos,
        ingresoReal: info.ingreso,
        gastos: gastoDiarioProp,
        saldo: info.ingreso - gastoDiarioProp
      })).sort((a, b) => a.fecha.localeCompare(b.fecha));
    }

    // ─── HOJA 1: RESUMEN DIARIO ────────────────────────────────────────────────
    const sheet1 = workbook.addWorksheet("Resumen Diario");
    sheet1.columns = [
      { header: "Fecha / Día", key: "fecha", width: 15 },
      { header: "Ventas Brutas", key: "ventasBrutas", width: 18 },
      { header: "Pagos a Diseñadores", key: "pagosProveedores", width: 22 },
      { header: "Ingreso Tienda", key: "ingresoReal", width: 18 },
      { header: "Gastos Operativos", key: "gastos", width: 18 },
      { header: "Saldo Neto", key: "saldo", width: 18 }
    ];

    // Estilos de cabecera
    sheet1.getRow(1).font = { name: "Helvetica Neue", family: 4, size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    sheet1.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7A1F3D" } }; // Vinotinto

    for (const r of resumenDiarioData) {
      sheet1.addRow(r);
    }

    // Formatear columnas numéricas
    ["B", "C", "D", "E", "F"].forEach(col => {
      sheet1.getColumn(col).numFmt = '"$"#,##0';
    });

    // Agregar Fila de Totales
    const lastRow1 = sheet1.rowCount + 1;
    sheet1.getCell(`A${lastRow1}`).value = "TOTALES";
    sheet1.getCell(`A${lastRow1}`).font = { bold: true };
    
    ["B", "C", "D", "E", "F"].forEach((col, idx) => {
      const colLetter = String.fromCharCode(66 + idx); // B, C, D...
      sheet1.getCell(`${colLetter}${lastRow1}`).value = {
        formula: `SUM(${colLetter}2:${colLetter}${lastRow1 - 1})`,
        date1904: false
      };
      sheet1.getCell(`${colLetter}${lastRow1}`).font = { bold: true };
    });

    // ─── HOJA 2: DETALLE DE VENTAS (SI HAY VENTAS REALES) ──────────────────────
    const sheet2 = workbook.addWorksheet("Detalle Ventas");
    sheet2.columns = [
      { header: "Fecha/Hora", key: "fechaHora", width: 20 },
      { header: "Prenda Código", key: "prendaCodigo", width: 18 },
      { header: "Prenda Descripción", key: "prendaDesc", width: 30 },
      { header: "PVP Cobrado", key: "precioCobrado", width: 15 },
      { header: "Comisión Tienda", key: "comision", width: 15 },
      { header: "Neto Diseñador", key: "netoProv", width: 15 }
    ];

    sheet2.getRow(1).font = { name: "Helvetica Neue", family: 4, size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    sheet2.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7A1F3D" } };

    // Si es mes dinámico sacamos las ventas reales. 
    // Si es histórico, simulamos a partir del desglose registrado en ItemLiquidacion si hay alguno, o lo indicamos
    const itemsLiquidacion = await db.itemLiquidacion.findMany({
      where: {
        liquidacion: {
          periodoInicio: {
            gte: new Date(`${mes}-01T00:00:00.000Z`)
          },
          periodoFin: {
            lte: new Date(new Date(`${mes}-01T00:00:00.000Z`).getFullYear(), new Date(`${mes}-01T00:00:00.000Z`).getMonth() + 1, 0, 23, 59, 59, 999)
          }
        }
      }
    });

    if (itemsLiquidacion.length > 0) {
      for (const item of itemsLiquidacion) {
        sheet2.addRow({
          fechaHora: mesNombre,
          prendaCodigo: item.prendaCodigo,
          prendaDesc: item.prendaDescripcion,
          precioCobrado: item.precioVenta,
          comision: item.comision,
          netoProv: item.valorProveedor
        });
      }
    } else {
      // Buscar ventas del mes
      const fechaInicio = new Date(`${mes}-01T00:00:00.000Z`);
      const fechaFin = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 1, 0, 23, 59, 59, 999);
      const ventasReales = await db.venta.findMany({
        where: { fechaHora: { gte: fechaInicio, lte: fechaFin }, anulada: false },
        include: { items: { include: { prenda: true } } }
      });

      for (const v of ventasReales) {
        for (const item of v.items) {
          sheet2.addRow({
            fechaHora: v.fechaHora.toISOString().replace("T", " ").substring(0, 19),
            prendaCodigo: item.prenda.codigo,
            prendaDesc: item.prenda.descripcion,
            precioCobrado: item.precioVenta - item.descuentoItem,
            comision: item.comisionBoutique,
            netoProv: item.paraProveedor
          });
        }
      }
    }

    ["D", "E", "F"].forEach(col => {
      sheet2.getColumn(col).numFmt = '"$"#,##0';
    });

    // ─── HOJA 3: GASTOS DETALLADOS ─────────────────────────────────────────────
    const sheet3 = workbook.addWorksheet("Costos y Gastos");
    sheet3.columns = [
      { header: "Concepto / Descripción", key: "concepto", width: 35 },
      { header: "Tipo de Costo", key: "tipo", width: 18 },
      { header: "Valor Total", key: "valor", width: 18 }
    ];

    sheet3.getRow(1).font = { name: "Helvetica Neue", family: 4, size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    sheet3.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7A1F3D" } };

    if (costosData.length > 0) {
      for (const c of costosData) {
        sheet3.addRow(c);
      }
    } else {
      // Para meses históricos, los gastos están agrupados diarios. Insertamos el consolidado
      const totalGastosHist = resumenDiarioData.reduce((sum, r) => sum + r.gastos, 0);
      if (totalGastosHist > 0) {
        sheet3.addRow({
          concepto: `Gastos consolidados del mes (${mesNombre})`,
          tipo: "FIJO",
          valor: totalGastosHist
        });
      }
    }

    sheet3.getColumn("C").numFmt = '"$"#,##0';

    // Generar buffer del Excel
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="libro-fiscal-${mes}.xlsx"`
      }
    });

  } catch (error) {
    console.error("Error exportando excel contable:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
