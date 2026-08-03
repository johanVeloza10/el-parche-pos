import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { codigo } = body;

    if (!codigo) {
      return new NextResponse('Bad Request', { status: 400 });
    }

    const bono = await db.bono.findUnique({
      where: { codigo },
    });

    if (!bono) {
      return NextResponse.json({ error: 'Bono no encontrado' }, { status: 404 });
    }

    if (!bono.activo) {
      return NextResponse.json({ error: 'Bono inactivo' }, { status: 400 });
    }

    const now = new Date();
    if (bono.fechaInicio && now < bono.fechaInicio) {
      return NextResponse.json({ error: 'Bono aún no válido' }, { status: 400 });
    }

    if (bono.fechaFin && now > bono.fechaFin) {
      return NextResponse.json({ error: 'Bono vencido' }, { status: 400 });
    }

    if (bono.usoMaximo !== null && bono.usosActuales >= bono.usoMaximo) {
      return NextResponse.json({ error: 'Límite de usos alcanzado' }, { status: 400 });
    }

    // Increment usosActuales
    const updatedBono = await db.bono.update({
      where: { id: bono.id },
      data: { usosActuales: { increment: 1 } },
    });

    return NextResponse.json({
      tipo: updatedBono.tipo,
      valor: updatedBono.valor,
      mensaje: 'Bono aplicado exitosamente',
    });
  } catch (error) {
    console.error('[BONO_VALIDAR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
