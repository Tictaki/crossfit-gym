export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notifier';

export async function PUT(request, { params }) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  try {
    const member = await prisma.member.findUnique({ where: { id: params.id } });
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const today = new Date();
    const newStatus = member.expirationDate && member.expirationDate > today ? 'ACTIVE' : 'INACTIVE';

    const updatedMember = await prisma.member.update({
      where: { id: params.id },
      data: { status: newStatus },
      include: { plan: true }
    });

    await notify({ action: 'UPDATE', message: `Membro reativado: ${updatedMember.name}`, actorId: user.id, entity: 'MEMBER', entityId: updatedMember.id });
    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error activating member:', error);
    return NextResponse.json({ error: 'Failed to activate member' }, { status: 500 });
  }
}
