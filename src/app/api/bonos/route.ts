import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.rol !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const bonos = await db.bono.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bonos);
  } catch (error) {
    console.error('[BONOS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.rol !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { codigo, nombre, tipo, valor, fechaFin, usoMaximo } = body;

    if (!codigo || !nombre || !tipo || valor <= 0) {
      return new NextResponse('Bad Request', { status: 400 });
    }

    const existingBono = await db.bono.findUnique({
      where: { codigo },
    });

    if (existingBono) {
      return new NextResponse('El código ya existe', { status: 400 });
    }

    const bono = await db.bono.create({
      data: {
        codigo,
        nombre,
        tipo,
        valor: parseFloat(valor),
        fechaFin: new Date(fechaFin),
        usoMaximo: usoMaximo ? parseInt(usoMaximo, 10) : 1,
      },
    });

    return NextResponse.json(bono);
  } catch (error) {
    console.error('[BONOS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
