import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Buscamos proveedores activos
    const proveedores = await db.proveedor.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      include: {
        prendas: {
          where: { deletedAt: null },
          include: {
            itemVenta: {
              where: {
                itemLiquidacion: null // Solo ventas no liquidadas aún
              }
            }
          }
        }
      }
    });

    // Calcular métricas para cada proveedor
    const resultado = proveedores.map(prov => {
      let prendasEnVitrina = 0;
      let prendasVendidasSinLiquidar = 0;
      let saldoPorPagar = 0;

      for (const prenda of prov.prendas) {
        if (prenda.estado === "EN_VITRINA") {
          prendasEnVitrina++;
        } else if (prenda.estado === "VENDIDA" && prenda.itemVenta && !prenda.itemVenta.liquidacionId) {
          prendasVendidasSinLiquidar++;
          saldoPorPagar += prenda.itemVenta.paraProveedor;
        }
      }

      return {
        id: prov.id,
        nombre: prov.nombre,
        tipoDocumento: prov.tipoDocumento,
        numeroDocumento: prov.numeroDocumento,
        telefono: prov.telefono,
        email: prov.email,
        datosBancarios: prov.datosBancarios,
        comisionDefaultPct: prov.comisionDefaultPct,
        modoComisionDefault: prov.modoComisionDefault,
        plazoMaxVitrinaDias: prov.plazoMaxVitrinaDias,
        responsableIva: prov.responsableIva,
        emiteFactura: prov.emiteFactura,
        notas: prov.notas,
        activo: prov.activo,
        prendasEnVitrina,
        prendasVendidasSinLiquidar,
        saldoPorPagar
      };
    });

    return NextResponse.json(resultado);

  } catch (error) {
    console.error("Error obteniendo proveedores:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      nombre, 
      tipoDocumento, 
      numeroDocumento, 
      telefono, 
      email, 
      datosBancarios,
      comisionDefaultPct,
      modoComisionDefault,
      plazoMaxVitrinaDias,
      responsableIva,
      emiteFactura,
      notas
    } = body;

    if (!nombre || !numeroDocumento) {
      return NextResponse.json({ error: "Nombre y Documento son requeridos" }, { status: 400 });
    }

    const nuevoProveedor = await db.proveedor.create({
      data: {
        nombre,
        tipoDocumento: tipoDocumento || "CC",
        numeroDocumento,
        telefono: telefono || null,
        email: email || null,
        datosBancarios: datosBancarios || null,
        comisionDefaultPct: parseFloat(comisionDefaultPct || "30"),
        modoComisionDefault: modoComisionDefault || "PORCENTAJE",
        plazoMaxVitrinaDias: parseInt(plazoMaxVitrinaDias || "90"),
        responsableIva: !!responsableIva,
        emiteFactura: !!emiteFactura,
        notas: notas || null
      }
    });

    return NextResponse.json(nuevoProveedor, { status: 201 });

  } catch (error) {
    console.error("Error creando proveedor:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

