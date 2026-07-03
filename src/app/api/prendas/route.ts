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
    const limit = 20;
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

    const [prendas, total] = await Promise.all([
      db.prenda.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          proveedor: { select: { nombre: true } }
        }
      }),
      db.prenda.count({ where })
    ]);

    return NextResponse.json({
      prendas,
      meta: {
        total,
        page,
        totalPages: Math.ceil(total / limit)
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
      costoProduccion 
    } = body;

    // Obtener la configuración para el prefijo y consecutivo
    const config = await db.configuracionNegocio.findUnique({ where: { id: "default" } });
    const prefijo = config?.prefijoCodigoPrenda || "PAR";
    
    // Incrementar consecutivo de forma segura
    const updatedConfig = await db.configuracionNegocio.update({
      where: { id: "default" },
      data: { consecutivoActual: { increment: 1 } }
    });

    const numFormat = updatedConfig.consecutivoActual.toString().padStart(5, '0');
    const anio = new Date().getFullYear();
    const codigo = `${prefijo}-${anio}-${numFormat}`;
    
    // Generar un código EAN-13 ficticio pero válido para el código de barras (12 dígitos + checksum)
    // Empezamos con "20" (uso interno), luego los 5 dígitos del consecutivo rellenados a 10.
    const eanBase = `20${numFormat.padStart(10, '0')}`;
    // Simple checksum EAN-13
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(eanBase[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkSum = (10 - (sum % 10)) % 10;
    const codigoBarras = `${eanBase}${checkSum}`;

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

    // Registrar en AuditLog
    await db.auditLog.create({
      data: {
        entidad: "Prenda",
        entidadId: nuevaPrenda.id,
        accion: "INGRESO_INVENTARIO",
        usuarioId: session.user.id,
        motivo: "Recepción de nueva prenda",
        valorNuevo: JSON.stringify({ codigo: nuevaPrenda.codigo, estado: "EN_VITRINA" })
      }
    });

    return NextResponse.json(nuevaPrenda, { status: 201 });

  } catch (error: any) {
    console.error("Error creando prenda:", error);
    return NextResponse.json({ error: error.message || "Error al crear la prenda" }, { status: 400 });
  }
}
