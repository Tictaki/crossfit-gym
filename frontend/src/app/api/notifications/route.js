import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly');
    const userId = user.id;

    const where = { userId };
    if (unreadOnly === 'true') where.read = false;
    const skip = (page - 1) * limit;

    const [items, total, unreadCount] = await Promise.all([
      prisma.notificationRecipient.findMany({
        where,
        include: { notification: { include: { user: { select: { name: true, photo: true } } } } },
        orderBy: { notification: { createdAt: 'desc' } },
        skip, take: limit
      }),
      prisma.notificationRecipient.count({ where }),
      prisma.notificationRecipient.count({ where: { userId, read: false } })
    ]);

    const notifications = items.map(item => ({
      id: item.id, notificationId: item.notification.id, message: item.notification.message,
      type: item.notification.type, entity: item.notification.entity, entityId: item.notification.entityId,
      createdAt: item.notification.createdAt, read: item.read,
      actor: item.notification.user?.name || 'Sistema', actorPhoto: item.notification.user?.photo
    }));

    return NextResponse.json({ notifications, pagination: { total, page, limit, pages: Math.ceil(total / limit) }, unreadCount });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
