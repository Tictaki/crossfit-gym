export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const where = {};
    if (startDate || endDate) { where.paymentDate = {}; if (startDate) where.paymentDate.gte = new Date(startDate); if (endDate) where.paymentDate.lte = new Date(endDate); }

    const revenueByPlan = await prisma.payment.groupBy({ by: ['planId'], where, _sum: { amount: true }, _count: true });
    const plansData = await Promise.all(revenueByPlan.map(async (item) => {
      const plan = await prisma.plan.findUnique({ where: { id: item.planId } });
      return { planName: plan?.name || 'Desconhecido', revenue: parseFloat(item._sum.amount), count: item._count };
    }));
    return NextResponse.json(plansData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch revenue report' }, { status: 500 });
  }
}
