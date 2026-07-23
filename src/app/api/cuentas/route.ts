import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 1. Obtener datos de HistoricoLibro (Enero - Mayo)
    const historicos = await db.historicoLibro.findMany({
      orderBy: { fecha: "asc" }
    });

    // Agrupar histórico por mes
    const mensualidades: Record<string, {
      mes: string;
      mesNombre: string;
      ventas: number;
      pagosProveedores: number;
      ingresoReal: number;
      gastos: number;
      ganancia: number;
      detallesDia: any[];
    }> = {};

    for (const h of historicos) {
      if (!mensualidades[h.mes]) {
        mensualidades[h.mes] = {
          mes: h.mes,
          mesNombre: h.mesNombre,
          ventas: 0,
          pagosProveedores: 0,
          ingresoReal: 0,
          gastos: 0,
          ganancia: 0,
          detallesDia: []
        };
      }
      mensualidades[h.mes].ventas += h.ventasBrutas;
      mensualidades[h.mes].pagosProveedores += h.pagosTerceros;
      mensualidades[h.mes].ingresoReal += h.ingresoReal;
      mensualidades[h.mes].gastos += h.gastos;
      mensualidades[h.mes].ganancia += h.saldoDia;
      mensualidades[h.mes].detallesDia.push({
        fecha: h.fecha,
        ventasBrutas: h.ventasBrutas,
        pagosTerceros: h.pagosTerceros,
        ingresoReal: h.ingresoReal,
        gastos: h.gastos,
        saldoDia: h.saldoDia
      });
    }

    // 2. Obtener datos reales de Ventas (para meses nuevos como Junio, Julio)
    // Buscamos todas las ventas que no estén anuladas
    const ventasReales = await db.venta.findMany({
      where: { anulada: false },
      include: {
        items: true
      },
      orderBy: { fechaHora: "asc" }
    });

    // Obtener gastos de CostoNegocio
    const costosNegocio = await db.costoNegocio.findMany();

    // Procesar ventas reales y agrupar por mes
    for (const venta of ventasReales) {
      const fecha = new Date(venta.fechaHora);
      const mesNum = (fecha.getMonth() + 1).toString().padStart(2, "0");
      const mes = `${fecha.getFullYear()}-${mesNum}`;
      
      // Si el mes ya está en el histórico, no lo duplicamos con ventas reales
      // (asumimos que el histórico es la fuente de verdad de Enero-Mayo)
      if (mensualidades[mes]) continue;

      const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      const mesNombre = nombresMeses[fecha.getMonth()];

      if (!mensualidades[mes]) {
        mensualidades[mes] = {
          mes,
          mesNombre,
          ventas: 0,
          pagosProveedores: 0,
          ingresoReal: 0,
          gastos: 0,
          ganancia: 0,
          detallesDia: []
        };
      }

      // Sumar al mes
      const ventasBrutas = venta.total;
      let pagosTerceros = 0;
      let costoPrendasPropias = 0;

      for (const item of venta.items) {
        if (item.esProduccionPropia) {
          costoPrendasPropias += item.costoProduccion || 0;
        } else {
          pagosTerceros += item.paraProveedor;
        }
      }

      const ingresoReal = ventasBrutas - pagosTerceros - costoPrendasPropias;

      mensualidades[mes].ventas += ventasBrutas;
      mensualidades[mes].pagosProveedores += pagosTerceros;
      mensualidades[mes].ingresoReal += ingresoReal;
      // La ganancia se ajustará al final restando gastos

      // Agregar detalle del día
      const fechaStr = fecha.toISOString().split("T")[0];
      let detalleExistente = mensualidades[mes].detallesDia.find(d => d.fecha === fechaStr);
      if (!detalleExistente) {
        detalleExistente = {
          fecha: fechaStr,
          ventasBrutas: 0,
          pagosTerceros: 0,
          ingresoReal: 0,
          gastos: 0,
          saldoDia: 0
        };
        mensualidades[mes].detallesDia.push(detalleExistente);
      }
      detalleExistente.ventasBrutas += ventasBrutas;
      detalleExistente.pagosTerceros += pagosTerceros;
      detalleExistente.ingresoReal += ingresoReal;
    }

    // Agregar costos de negocio a los meses correspondientes
    for (const costo of costosNegocio) {
      const mes = costo.mes; // Formato "2026-06"
      if (mensualidades[mes]) {
        mensualidades[mes].gastos += costo.valor;
      }
    }

    // Calcular ganancia real (ingresoReal - gastos) para meses no históricos
    // (el histórico ya tiene la ganancia/saldoDia calculada y cargada)
    for (const mes in mensualidades) {
      const m = mensualidades[mes];
      // Si no es parte del histórico estático, calculamos
      const esHistoricoStatic = historicos.some((h: any) => h.mes === mes);
      if (!esHistoricoStatic) {
        m.ganancia = m.ingresoReal - m.gastos;
        
        // Distribuir gastos diarios de forma proporcional en detallesDia si existen
        const totalDias = m.detallesDia.length;
        if (totalDias > 0 && m.gastos > 0) {
          const gastoPorDia = Math.round(m.gastos / totalDias);
          for (const d of m.detallesDia) {
            d.gastos = gastoPorDia;
            d.saldoDia = d.ingresoReal - d.gastos;
          }
        }
      }
    }

    // Ordenar meses cronológicamente
    const resultadoOrdenado = Object.values(mensualidades).sort((a, b) => a.mes.localeCompare(b.mes));

    return NextResponse.json(resultadoOrdenado, { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } });

  } catch (error) {
    console.error("Error en API de cuentas:", error);
    return NextResponse.json({ error: "Error obteniendo las cuentas" }, { status: 500 });
  }
}
