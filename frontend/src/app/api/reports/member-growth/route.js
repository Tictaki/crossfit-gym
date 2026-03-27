export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  try {
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12');
    const startDate = new Date(); startDate.setMonth(startDate.getMonth() - months);

    const growth = await prisma.$queryRaw`SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*) as count FROM "Member" WHERE "createdAt" >= ${startDate} GROUP BY month ORDER BY month ASC`;
    return NextResponse.json(growth.map(g => ({ month: g.month, count: parseInt(g.count) })));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch member growth report' }, { status: 500 });
  }
}
