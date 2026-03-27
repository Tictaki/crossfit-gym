export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const where = { memberId: params.memberId };
    if (startDate || endDate) {
      where.checkinDatetime = {};
      if (startDate) where.checkinDatetime.gte = new Date(startDate);
      if (endDate) where.checkinDatetime.lte = new Date(endDate);
    }
    const checkins = await prisma.checkin.findMany({ where, orderBy: { checkinDatetime: 'desc' } });
    const byDate = {};
    checkins.forEach(c => { const d = c.checkinDatetime.toISOString().split('T')[0]; byDate[d] = (byDate[d] || 0) + 1; });
    return NextResponse.json({ total: checkins.length, byDate, checkins });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch frequency report' }, { status: 500 });
  }
}
