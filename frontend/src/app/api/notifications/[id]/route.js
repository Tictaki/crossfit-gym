import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// Mark single as read
export async function PUT(request, { params }) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  try {
    const recipient = await prisma.notificationRecipient.findUnique({ where: { id: params.id } });
    if (!recipient || recipient.userId !== user.id) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    await prisma.notificationRecipient.update({ where: { id: params.id }, data: { read: true } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

// Delete single
export async function DELETE(request, { params }) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  try {
    const recipient = await prisma.notificationRecipient.findUnique({ where: { id: params.id } });
    if (!recipient || recipient.userId !== user.id) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    await prisma.notificationRecipient.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
