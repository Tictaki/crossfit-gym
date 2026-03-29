export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  try {
    const { searchParams } = request.nextUrl;
    const months = parseInt(searchParams.get('months') || '6');
    const source = searchParams.get('source') || 'all';
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1); startDate.setDate(1); startDate.setHours(0,0,0,0);

    const fixedCostsAgg = await prisma.fixedCost.aggregate({ _sum: { amount: true } });
    const fixedCostsMonthly = parseFloat(fixedCostsAgg._sum?.amount || 0);

    let revenueTrends = [];
    if (source === 'all' || source === 'gym') {
      const gymTrends = await prisma.$queryRaw`SELECT DATE_TRUNC('month', "paymentDate") as month, SUM(amount) as revenue FROM "Payment" WHERE "paymentDate" >= ${startDate} GROUP BY month ORDER BY month ASC`;
      revenueTrends = [...gymTrends];
    }
    if (source === 'all' || source === 'store') {
      const storeTrends = await prisma.$queryRaw`SELECT DATE_TRUNC('month', "saleDate") as month, SUM("totalAmount") as revenue FROM "Sale" WHERE "saleDate" >= ${startDate} GROUP BY month ORDER BY month ASC`;
      storeTrends.forEach(st => {
        const existing = revenueTrends.find(rt => rt.month.toISOString() === st.month.toISOString());
        if (existing) existing.revenue = (parseFloat(existing.revenue) + parseFloat(st.revenue)).toString();
        else revenueTrends.push(st);
      });
    }

    const expenseTrends = await prisma.$queryRaw`SELECT DATE_TRUNC('month', "date") as month, SUM(amount) as expenses FROM "Expense" WHERE "date" >= ${startDate} GROUP BY month ORDER BY month ASC`;
    const trendsMap = {};
    revenueTrends.forEach(r => { const m = new Date(r.month).toISOString(); trendsMap[m] = { month: m, revenue: parseFloat(r.revenue), expenses: fixedCostsMonthly }; });
    expenseTrends.forEach(e => { const m = new Date(e.month).toISOString(); if (!trendsMap[m]) trendsMap[m] = { month: m, revenue: 0, expenses: parseFloat(e.expenses) + fixedCostsMonthly }; else trendsMap[m].expenses = parseFloat(e.expenses) + fixedCostsMonthly; });

    return NextResponse.json(Object.values(trendsMap).sort((a, b) => new Date(a.month) - new Date(b.month)));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch accounting trends' }, { status: 500 });
  }
}
