import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET — Search clients
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    if (!q.trim()) {
      return NextResponse.json({ clientes: [] }, { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } });
    }

    const clientes = await db.cliente.findMany({
      where: {
        OR: [
          { nombre: { contains: q, mode: "insensitive" } },
          { numeroDocumento: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(clientes, { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } });
  } catch (error: any) {
    console.error("Error buscando clientes:", error);
    return NextResponse.json(
      { error: error.message || "Error buscando clientes" },
      { status: 500 }
    );
  }
}

// POST — Create a new client
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { nombre, tipoDocumento, numeroDocumento, email, telefono } = body;

    if (!nombre || !tipoDocumento || !numeroDocumento) {
      return NextResponse.json(
        { error: "nombre, tipoDocumento y numeroDocumento son requeridos" },
        { status: 400 }
      );
    }

    const cliente = await db.cliente.create({
      data: {
        nombre,
        tipoDocumento,
        numeroDocumento,
        email: email || null,
        telefono: telefono || null,
        instagram: body.instagram || null,
        facebook: body.facebook || null,
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error: any) {
    console.error("Error creando cliente:", error);
    return NextResponse.json(
      { error: error.message || "Error creando cliente" },
      { status: 500 }
    );
  }
}
