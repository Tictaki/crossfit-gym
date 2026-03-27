import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const source = searchParams.get('source') || 'all';

    const where = {};
    if (startDate || endDate) { where.date = {}; if (startDate) where.date.gte = new Date(startDate); if (endDate) where.date.lte = new Date(endDate); }

    const wherePayments = {};
    if (startDate || endDate) { wherePayments.paymentDate = {}; if (startDate) wherePayments.paymentDate.gte = new Date(startDate); if (endDate) wherePayments.paymentDate.lte = new Date(endDate); }

    const whereSales = {};
    if (startDate || endDate) { whereSales.saleDate = {}; if (startDate) whereSales.saleDate.gte = new Date(startDate); if (endDate) whereSales.saleDate.lte = new Date(endDate); }

    const expensesQuery = prisma.expense.aggregate({ where, _sum: { amount: true }, _count: true });
    const fixedCostsQuery = prisma.fixedCost.aggregate({ _sum: { amount: true } });
    let paymentsQuery = Promise.resolve(null);
    let salesQuery = Promise.resolve(null);
    if (source === 'all' || source === 'gym') paymentsQuery = prisma.payment.aggregate({ where: wherePayments, _sum: { amount: true }, _count: true });
    if (source === 'all' || source === 'store') salesQuery = prisma.sale.aggregate({ where: whereSales, _sum: { totalAmount: true }, _count: true });

    const [expenses, fixedCosts, payments, sales] = await Promise.all([expensesQuery, fixedCostsQuery, paymentsQuery, salesQuery]);

    const fixedCostsTotal = parseFloat(fixedCosts?._sum?.amount || 0);
    const variableExpensesTotal = parseFloat(expenses?._sum?.amount || 0);
    const gymRevenue = payments ? parseFloat(payments._sum.amount || 0) : 0;
    const storeRevenue = sales ? parseFloat(sales._sum.totalAmount || 0) : 0;
    const totalRevenue = gymRevenue + storeRevenue;
    const totalExpenses = variableExpensesTotal + fixedCostsTotal;

    return NextResponse.json({
      revenue: { total: totalRevenue, gym: gymRevenue, store: storeRevenue, count: (payments?._count || 0) + (sales?._count || 0) },
      expenses: { total: totalExpenses, variable: variableExpensesTotal, fixed: fixedCostsTotal, count: expenses?._count ?? 0 },
      netProfit: totalRevenue - totalExpenses
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch accounting summary' }, { status: 500 });
  }
}
