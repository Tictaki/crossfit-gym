import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const maxCheckins = parseInt(searchParams.get('maxCheckins') || '5');
    const startDate = new Date(); startDate.setDate(startDate.getDate() - days);

    const activeMembers = await prisma.member.findMany({
      where: { status: 'ACTIVE' },
      include: { checkins: { where: { checkinDatetime: { gte: startDate } } }, plan: true }
    });

    const lowFrequency = activeMembers
      .filter(m => m.checkins.length <= maxCheckins)
      .map(m => ({ id: m.id, name: m.name, phone: m.phone, plan: m.plan?.name, checkinCount: m.checkins.length, lastCheckin: m.checkins[0]?.checkinDatetime || null }));

    return NextResponse.json(lowFrequency);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch low frequency report' }, { status: 500 });
  }
}
