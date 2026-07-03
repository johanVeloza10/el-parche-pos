import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.rol !== "ADMIN" && session.user.rol !== "CONTADOR")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { manoDeObra, costosIndirectos } = body;

    const op = await db.ordenProduccion.findUnique({
      where: { id },
      include: {
        consumos: true
      }
    });

    if (!op) {
      return NextResponse.json({ error: "La orden de producción no existe" }, { status: 404 });
    }

    if (op.estado === "CERRADA") {
      return NextResponse.json({ error: "La orden de producción ya está cerrada" }, { status: 400 });
    }

    // Calcular costos
    const costoMateriales = op.consumos.reduce((sum, c) => sum + c.costoTotal, 0);
    
    // Sumar mano de obra (asumimos formato JSON [{concepto, valor}])
    const manoDeObraArray = typeof manoDeObra === "string" ? JSON.parse(manoDeObra) : (manoDeObra || []);
    const costoManoDeObra = manoDeObraArray.reduce((sum: number, m: any) => sum + parseInt(m.valor || "0"), 0);

    const cIndirectos = parseInt(costosIndirectos || "0");
    const costoTotal = costoMateriales + costoManoDeObra + cIndirectos;
    const costoPorPrenda = Math.round(costoTotal / op.cantidadPrendas);

    // Calcular precio sugerido usando margen de venta: PVP = Costo / (1 - Margen / 100)
    // Evitar división por cero
    const margen = op.margenObjetivo;
    const factorMargen = 1 - (margen / 100);
    const precioSugerido = factorMargen > 0 ? Math.round(costoPorPrenda / factorMargen) : costoPorPrenda * 2;

    const resultado = await db.$transaction(async (tx) => {
      // 1. Crear las prendas automáticamente
      const prendasCreadas = [];
      const config = await tx.configuracionNegocio.findUnique({ where: { id: "default" } });
      const prefijo = config?.prefijoCodigoPrenda || "PAR";
      
      let consecutivo = config?.consecutivoActual || 0;

      for (let i = 0; i < op.cantidadPrendas; i++) {
        consecutivo++;
        const numFormat = consecutivo.toString().padStart(5, '0');
        const anio = new Date().getFullYear();
        const codigo = `${prefijo}-${anio}-${numFormat}`;
        
        // EAN-13 ficticio
        const eanBase = `20${numFormat.padStart(10, '0')}`;
        let sum = 0;
        for (let j = 0; j < 12; j++) {
          sum += parseInt(eanBase[j]) * (j % 2 === 0 ? 1 : 3);
        }
        const checkSum = (10 - (sum % 10)) % 10;
        const codigoBarras = `${eanBase}${checkSum}`;

        const prenda = await tx.prenda.create({
          data: {
            codigo,
            codigoBarras,
            origen: "PRODUCCION_PROPIA",
            ordenProduccionId: op.id,
            descripcion: `Diseño El Parche Original - ${op.nombreDiseno}`,
            categoria: "Chaquetas", // Categoría por defecto para las de producción propia
            talla: "UNICA",
            color: "MULTICOLOR",
            precioVenta: precioSugerido,
            costoProduccion: costoPorPrenda,
            estado: "EN_VITRINA"
          }
        });
        prendasCreadas.push(prenda);
      }

      // 2. Actualizar el consecutivo en configuracion
      await tx.configuracionNegocio.update({
        where: { id: "default" },
        data: { consecutivoActual: consecutivo }
      });

      // 3. Cerrar la orden de producción
      const ordenCerrada = await tx.ordenProduccion.update({
        where: { id },
        data: {
          estado: "CERRADA",
          fechaCierre: new Date(),
          manoDeObra: JSON.stringify(manoDeObraArray),
          costosIndirectos: cIndirectos,
          costoTotal,
          costoPorPrenda,
          precioSugerido
        }
      });

      return { ordenCerrada, prendasCreadas };
    });

    return NextResponse.json(resultado);

  } catch (error: any) {
    console.error("Error al cerrar orden de producción:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}
