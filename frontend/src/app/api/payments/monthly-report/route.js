export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  try {
    const { searchParams } = request.nextUrl;
    const year = parseInt(searchParams.get('year') || new Date().getFullYear());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1));

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const payments = await prisma.payment.findMany({
      where: { paymentDate: { gte: startOfMonth, lte: endOfMonth } },
      include: { member: { select: { name: true } }, plan: { select: { name: true } } }
    });

    const summary = { total: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0), count: payments.length, byPlan: {}, byMethod: {} };
    payments.forEach(p => {
      if (!summary.byPlan[p.plan.name]) summary.byPlan[p.plan.name] = { count: 0, total: 0 };
      summary.byPlan[p.plan.name].count++;
      summary.byPlan[p.plan.name].total += parseFloat(p.amount);
      if (!summary.byMethod[p.paymentMethod]) summary.byMethod[p.paymentMethod] = { count: 0, total: 0 };
      summary.byMethod[p.paymentMethod].count++;
      summary.byMethod[p.paymentMethod].total += parseFloat(p.amount);
    });

    return NextResponse.json({ summary, totalPayments: payments.length });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    return NextResponse.json({ error: 'Failed to generate monthly report' }, { status: 500 });
  }
}
