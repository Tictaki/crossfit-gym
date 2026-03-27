import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notifier';

export async function PUT(request, { params }) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  try {
    const member = await prisma.member.update({
      where: { id: params.id },
      data: { status: 'SUSPENDED' },
      include: { plan: true }
    });

    await notify({ action: 'WARNING', message: `Membro suspenso: ${member.name}`, actorId: user.id, entity: 'MEMBER', entityId: member.id });
    return NextResponse.json(member);
  } catch (error) {
    console.error('Error suspending member:', error);
    return NextResponse.json({ error: 'Failed to suspend member' }, { status: 500 });
  }
}
