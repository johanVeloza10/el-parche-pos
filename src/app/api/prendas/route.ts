import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/prendas - Listar inventario
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado") || undefined;
    const categoria = searchParams.get("categoria") || undefined;
    const proveedorId = searchParams.get("proveedorId") || undefined;
    const q = searchParams.get("q") || undefined;
    
    // Paginación
    const page = parseInt(searchParams.get("page") || "1");
    const reqLimit = parseInt(searchParams.get("limit") || "20");
    const limit = Math.min(Math.max(reqLimit, 1), 1000);
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(estado ? { estado } : {}),
      ...(categoria ? { categoria } : {}),
      ...(proveedorId ? { proveedorId } : {}),
      ...(q ? {
        OR: [
          { codigo: { contains: q } },
          { descripcion: { contains: q } },
        ]
      } : {}),
    };

    const [prendas, total, totalVitrinaAgg] = await Promise.all([
      db.prenda.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          proveedor: { select: { nombre: true } }
        }
      }),
      db.prenda.count({ where }),
      db.prenda.aggregate({
        where: { ...where, estado: 'EN_VITRINA' },
        _sum: { precioVenta: true },
        _count: true
      })
    ]);

    return NextResponse.json({
      prendas,
      meta: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        valorTotalVitrina: totalVitrinaAgg._sum.precioVenta || 0,
        totalVitrinaCount: totalVitrinaAgg._count || 0,
      }
    });

  } catch (error) {
    console.error("Error obteniendo prendas:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST /api/prendas - Crear nueva prenda (Recepción)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      origen, // 'CONSIGNACION' | 'PRODUCCION_PROPIA'
      proveedorId, 
      descripcion, 
      categoria, 
      talla, 
      color, 
      precioVenta, 
      valorProveedor, 
      comisionPct, 
      costoProduccion,
      codigoPropio,
      cantidad
    } = body;

    const qty = cantidad ? parseInt(cantidad) : 1;
    if (isNaN(qty) || qty < 1 || qty > 100) {
      return NextResponse.json({ error: "Cantidad inválida (1-100)" }, { status: 400 });
    }

    const prendasCreadas = [];

    // Fetch config once
    const config = await db.configuracionNegocio.findUnique({ where: { id: "default" } });
    const prefijo = config?.prefijoCodigoPrenda || "PAR";
    
    // We increment consecutivo once by qty
    const updatedConfig = await db.configuracionNegocio.update({
      where: { id: "default" },
      data: { consecutivoActual: { increment: qty } }
    });

    const startConsecutivo = updatedConfig.consecutivoActual - qty + 1;
    const anio = new Date().getFullYear();

    for (let i = 0; i < qty; i++) {
      let codigo = codigoPropio;
      let codigoBarras = codigoPropio;

      if (codigoPropio && qty > 1) {
        codigo = `${codigoPropio}-${i+1}`;
        codigoBarras = `${codigoPropio}-${i+1}`;
      }

      if (!codigo) {
        const numFormat = (startConsecutivo + i).toString().padStart(5, '0');
        codigo = `${prefijo}-${anio}-${numFormat}`;
        
        const eanBase = `20${numFormat.padStart(10, '0')}`;
        let sum = 0;
        for (let j = 0; j < 12; j++) {
          sum += parseInt(eanBase[j]) * (j % 2 === 0 ? 1 : 3);
        }
        const checkSum = (10 - (sum % 10)) % 10;
        codigoBarras = `${eanBase}${checkSum}`;
      }

      const nuevaPrenda = await db.prenda.create({
        data: {
          codigo,
          codigoBarras,
          origen,
          proveedorId: origen === "CONSIGNACION" ? proveedorId : null,
          descripcion,
          categoria,
          talla: talla || "UNICA",
          color: color || "VARIOS",
          precioVenta: parseInt(precioVenta),
          valorProveedor: valorProveedor ? parseInt(valorProveedor) : null,
          comisionPct: comisionPct ? parseFloat(comisionPct) : null,
          modoComision: valorProveedor ? "VALOR_FIJO" : "PORCENTAJE",
          costoProduccion: costoProduccion ? parseInt(costoProduccion) : null,
          estado: "EN_VITRINA"
        }
      });

      await db.auditLog.create({
        data: {
          entidad: "Prenda",
          entidadId: nuevaPrenda.id,
          accion: "INGRESO_INVENTARIO",
          usuarioId: session.user.id,
          motivo: "Recepción de nueva prenda (Lote)",
          valorNuevo: JSON.stringify({ codigo: nuevaPrenda.codigo, estado: "EN_VITRINA" })
        }
      });

      prendasCreadas.push(nuevaPrenda);
    }

    return NextResponse.json(prendasCreadas, { status: 201 });

  } catch (error: any) {
    console.error("Error creando prenda:", error);
    return NextResponse.json({ error: error.message || "Error al crear la prenda" }, { status: 400 });
  }
}
