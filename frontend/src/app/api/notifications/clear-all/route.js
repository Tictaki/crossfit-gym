export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function DELETE() {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  try {
    await prisma.notificationRecipient.deleteMany({ where: { userId: user.id } });
    return NextResponse.json({ success: true, message: 'All notifications deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 });
  }
}
