export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  try {
    const { searchParams } = request.nextUrl;
    const date = searchParams.get('date');
    const targetDate = date ? new Date(date) : new Date();

    const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);

    const payments = await prisma.payment.findMany({
      where: { paymentDate: { gte: startOfDay, lte: endOfDay } },
      include: { member: { select: { name: true } }, plan: { select: { name: true } }, user: { select: { name: true } } },
      orderBy: { paymentDate: 'asc' }
    });

    const summary = { total: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0), count: payments.length, byMethod: {} };
    payments.forEach(p => {
      if (!summary.byMethod[p.paymentMethod]) summary.byMethod[p.paymentMethod] = { count: 0, total: 0 };
      summary.byMethod[p.paymentMethod].count++;
      summary.byMethod[p.paymentMethod].total += parseFloat(p.amount);
    });

    return NextResponse.json({ payments, summary });
  } catch (error) {
    console.error('Error generating daily report:', error);
    return NextResponse.json({ error: 'Failed to generate daily report' }, { status: 500 });
  }
}
