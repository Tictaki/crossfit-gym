export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notifier';

export async function DELETE(request, { params }) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  try {
    const fixedCost = await prisma.fixedCost.findUnique({ where: { id: params.id } });
    if (!fixedCost) return NextResponse.json({ error: 'Fixed cost not found' }, { status: 404 });
    await prisma.fixedCost.delete({ where: { id: params.id } });
    await notify({ action: 'DELETE', message: `Custo fixo removido: ${fixedCost.description}`, actorId: user.id, entity: 'FIXED_COST', entityId: params.id });
    return NextResponse.json({ message: 'Fixed cost deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete fixed cost' }, { status: 500 });
  }
}
