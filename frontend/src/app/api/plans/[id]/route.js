export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notifier';

export async function PUT(request, { params }) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  try {
    const { id } = params;
    const { name, price, durationDays, description, status } = await request.json();

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        name,
        price: (price !== undefined && price !== '') ? parseFloat(price) : undefined,
        durationDays: (durationDays !== undefined && durationDays !== '') ? parseInt(durationDays) : undefined,
        description,
        status: status !== undefined ? status : undefined
      }
    });

    await notify({ action: 'UPDATE', message: `Plano atualizado: ${plan.name}`, actorId: user.id, entity: 'PLAN', entityId: plan.id });
    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  try {
    const { id } = params;
    const memberCount = await prisma.member.count({ where: { planId: id } });

    if (memberCount > 0) {
      return NextResponse.json({ error: `Não é possível apagar este plano porque existem ${memberCount} membros associados a ele.` }, { status: 400 });
    }

    await prisma.plan.delete({ where: { id } });
    await notify({ action: 'DELETE', message: `Plano eliminado: ID #${id.substring(0, 8)}`, actorId: user.id, entity: 'PLAN', entityId: id });
    return NextResponse.json({ message: 'Plano apagado permanentemente com sucesso' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Falha ao apagar o plano' }, { status: 500 });
  }
}
