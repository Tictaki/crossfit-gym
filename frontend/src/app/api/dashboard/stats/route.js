export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { updateMemberStatuses } from '@/lib/autoUpdateStatus';

export async function GET(request) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    // 1. Sync member statuses
    try { await updateMemberStatuses(); } catch {}

    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);

    // Optional month filter (e.g. ?month=2026-03)
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    let firstDayOfMonth, firstDayOfLastMonth;
    if (monthParam) {
      const [y, m] = monthParam.split('-').map(Number);
      firstDayOfMonth = new Date(y, m - 1, 1);
      firstDayOfLastMonth = new Date(y, m - 2, 1);
    } else {
      firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    }
    const firstDayOfNextMonth = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth() + 1, 1);

    // Total members by status
    const [activeMembers, inactiveMembers, totalMembers] = await Promise.all([
      prisma.member.count({ where: { status: 'ACTIVE' } }),
      prisma.member.count({ where: { status: 'INACTIVE' } }),
      prisma.member.count()
    ]);

    const activeAtStartOfMonth = await prisma.member.count({
      where: { status: 'ACTIVE', createdAt: { lt: firstDayOfMonth } }
    });

    // Revenue this month
    const paymentsThisMonth = await prisma.payment.aggregate({
      where: { paymentDate: { gte: firstDayOfMonth, lt: firstDayOfNextMonth } },
      _sum: { amount: true }, _count: true
    });

    const paymentsLastMonth = await prisma.payment.aggregate({
      where: { paymentDate: { gte: firstDayOfLastMonth, lt: firstDayOfMonth } },
      _sum: { amount: true }
    });

    const salesThisMonth = await prisma.sale.aggregate({
      where: { saleDate: { gte: firstDayOfMonth, lt: firstDayOfNextMonth } },
      _sum: { totalAmount: true }
    });

    const salesLastMonth = await prisma.sale.aggregate({
      where: { saleDate: { gte: firstDayOfLastMonth, lt: firstDayOfMonth } },
      _sum: { totalAmount: true }
    });

    const revenueThisMonth = parseFloat(paymentsThisMonth._sum.amount || 0) + parseFloat(salesThisMonth._sum.totalAmount || 0);
    const revenueLastMonth = parseFloat(paymentsLastMonth._sum.amount || 0) + parseFloat(salesLastMonth._sum.totalAmount || 0);

    // New members this month vs last
    const [newMembersCount, newMembersLastMonth] = await Promise.all([
      prisma.member.count({ where: { createdAt: { gte: firstDayOfMonth, lt: firstDayOfNextMonth } } }),
      prisma.member.count({ where: { createdAt: { gte: firstDayOfLastMonth, lt: firstDayOfMonth } } })
    ]);

    const calculateTrend = (current, previous) => {
      if (!previous) return current > 0 ? 100 : 0;
      return parseFloat(((current - previous) / previous * 100).toFixed(1));
    };

    const membersTrend = calculateTrend(activeMembers, activeAtStartOfMonth);
    const revenueTrend = calculateTrend(revenueThisMonth, revenueLastMonth);
    const newMembersTrend = calculateTrend(newMembersCount, newMembersLastMonth);

    // Overdue payments
    const overdueMembersWithPlans = await prisma.member.findMany({
      where: { status: 'INACTIVE', expirationDate: { lt: today }, planId: { not: null } },
      include: { plan: true }
    });
    const pendingPayments = overdueMembersWithPlans.reduce((sum, m) => sum + parseFloat(m.plan?.price || 0), 0);

    // Expiring soon
    const expiringSoon = await prisma.member.findMany({
      where: { status: 'ACTIVE', expirationDate: { gte: today, lte: sevenDaysLater } },
      include: { plan: true },
      orderBy: { expirationDate: 'asc' },
      take: 5
    });

    // Recent activity
    const recentActivity = await prisma.payment.findMany({
      orderBy: { paymentDate: 'desc' },
      take: 5,
      include: {
        member: { select: { name: true } },
        plan: { select: { name: true } }
      }
    });

    // Low stock
    const lowStockCount = await prisma.product.count({
      where: { stock: { lte: 5 }, status: true }
    });

    // Top products
    const topProductsRaw = await prisma.sale.groupBy({
      by: ['productId'],
      where: { saleDate: { gte: firstDayOfMonth, lt: firstDayOfNextMonth } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    });

    const topProducts = await Promise.all(topProductsRaw.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true }
      });
      return { name: product?.name || 'Produto Desconhecido', quantity: item._sum.quantity };
    }));

    // Yearly comparison
    const currentYear = today.getFullYear();
    const lastYear = currentYear - 1;
    const firstDayOfLastYear = new Date(lastYear, 0, 1);

    const yearPayments = await prisma.payment.findMany({
      where: { paymentDate: { gte: firstDayOfLastYear } },
      select: { amount: true, paymentDate: true }
    });

    const yearSales = await prisma.sale.findMany({
      where: { saleDate: { gte: firstDayOfLastYear } },
      select: { totalAmount: true, saleDate: true }
    });

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const comparisonMap = new Map();
    monthNames.forEach((name, index) => {
      comparisonMap.set(index, { month: name, current: 0, previous: 0, currentSales: 0, currentPayments: 0 });
    });

    yearPayments.forEach(p => {
      const d = new Date(p.paymentDate);
      const m = d.getMonth();
      const y = d.getFullYear();
      const amount = parseFloat(p.amount) || 0;
      const entry = comparisonMap.get(m);
      if (y === currentYear) { entry.current += amount; entry.currentPayments += amount; }
      else if (y === lastYear) { entry.previous += amount; }
    });

    yearSales.forEach(s => {
      const d = new Date(s.saleDate);
      const m = d.getMonth();
      const y = d.getFullYear();
      const amount = parseFloat(s.totalAmount) || 0;
      const entry = comparisonMap.get(m);
      if (y === currentYear) { entry.current += amount; entry.currentSales += amount; }
      else if (y === lastYear) { entry.previous += amount; }
    });

    const revenueComparison = Array.from(comparisonMap.values());

    // Monthly chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    sixMonthsAgo.setDate(1);

    const monthlyPayments = await prisma.$queryRaw`
      SELECT DATE_TRUNC('month', "paymentDate") as month, SUM(amount) as total
      FROM "Payment" WHERE "paymentDate" >= ${sixMonthsAgo}::timestamp GROUP BY month ORDER BY month ASC
    `;

    const monthlySales = await prisma.$queryRaw`
      SELECT DATE_TRUNC('month', "saleDate") as month, SUM("totalAmount") as total
      FROM "Sale" WHERE "saleDate" >= ${sixMonthsAgo}::timestamp GROUP BY month ORDER BY month ASC
    `;

    const revenueMap = new Map();
    monthlyPayments.forEach(r => {
      const monthKey = new Date(r.month).toISOString().substring(0, 7);
      const amount = parseFloat(r.total) || 0;
      if (!revenueMap.has(monthKey)) revenueMap.set(monthKey, { month: r.month, payments: 0, sales: 0, total: 0 });
      const entry = revenueMap.get(monthKey);
      entry.payments += amount;
      entry.total += amount;
    });

    monthlySales.forEach(r => {
      const monthKey = new Date(r.month).toISOString().substring(0, 7);
      const amount = parseFloat(r.total) || 0;
      if (!revenueMap.has(monthKey)) revenueMap.set(monthKey, { month: r.month, payments: 0, sales: 0, total: 0 });
      const entry = revenueMap.get(monthKey);
      entry.sales += amount;
      entry.total += amount;
    });

    const chartData = Array.from(revenueMap.values())
      .sort((a, b) => new Date(a.month) - new Date(b.month))
      .map(entry => ({
        name: new Date(entry.month).toLocaleDateString('pt-PT', { month: 'short' }),
        revenue: entry.total,
        payments: entry.payments,
        sales: entry.sales
      }));

    // Plan distribution
    const planDistributionRaw = await prisma.member.groupBy({
      by: ['planId'], _count: { id: true },
      where: { planId: { not: null }, status: 'ACTIVE' }
    });

    const planDistribution = await Promise.all(planDistributionRaw.map(async (item) => {
      const plan = await prisma.plan.findUnique({ where: { id: item.planId }, select: { name: true } });
      return { name: plan?.name || 'Sem Plano', value: Number(item._count.id) };
    }));

    // Daily activity (14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(today.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    let dailyCheckinsRaw = [];
    let dailyActiveMembers = [];
    let hourlyActivityRaw = [];

    try {
      [dailyCheckinsRaw, dailyActiveMembers, hourlyActivityRaw] = await Promise.all([
        prisma.$queryRaw`SELECT DATE("checkinDatetime") as date, COUNT(*) as count FROM "Checkin" WHERE "checkinDatetime" >= ${fourteenDaysAgo}::timestamp GROUP BY DATE("checkinDatetime") ORDER BY date ASC`,
        prisma.$queryRaw`SELECT DATE(c."checkinDatetime") as date, COUNT(DISTINCT c."memberId") as count FROM "Checkin" c WHERE c."checkinDatetime" >= ${fourteenDaysAgo}::timestamp GROUP BY DATE(c."checkinDatetime") ORDER BY date ASC`,
        prisma.$queryRaw`SELECT EXTRACT(HOUR FROM "checkinDatetime") as hour, COUNT(*) as count FROM "Checkin" WHERE "checkinDatetime" >= ${sevenDaysAgo}::timestamp GROUP BY hour ORDER BY hour ASC`
      ]);
    } catch (rawError) {
      console.error('CRITICAL: Dashboard raw SQL queries failed:', rawError.message);
      // Fallback to empty results to avoid crashing the whole dashboard
    }

    const dailyActivityMap = new Map();
    for (let i = 0; i <= 14; i++) {
      const date = new Date(fourteenDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyActivityMap.set(dateStr, { date: dateStr, checkIns: 0, activeMembersCount: 0, revenue: 0, payments: 0, sales: 0 });
    }

    dailyCheckinsRaw.forEach(r => {
      const dateStr = new Date(r.date).toISOString().split('T')[0];
      if (dailyActivityMap.has(dateStr)) dailyActivityMap.get(dateStr).checkIns = Number(r.count);
    });

    dailyActiveMembers.forEach(r => {
      const dateStr = new Date(r.date).toISOString().split('T')[0];
      if (dailyActivityMap.has(dateStr)) dailyActivityMap.get(dateStr).activeMembersCount = Number(r.count);
    });

    const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, '0')}:00`, count: 0 }));
    hourlyActivityRaw.forEach(r => {
      const h = Number(r.hour);
      if (hourlyActivity[h]) hourlyActivity[h].count = Number(r.count);
    });

    // Daily financial data
    let dailyPaymentsRaw = [];
    let dailySalesRaw = [];
    try {
      [dailyPaymentsRaw, dailySalesRaw] = await Promise.all([
        prisma.$queryRaw`SELECT DATE("paymentDate") as date, SUM(amount) as total FROM "Payment" WHERE "paymentDate" >= ${fourteenDaysAgo}::timestamp GROUP BY DATE("paymentDate")`,
        prisma.$queryRaw`SELECT DATE("saleDate") as date, SUM("totalAmount") as total FROM "Sale" WHERE "saleDate" >= ${fourteenDaysAgo}::timestamp GROUP BY DATE("saleDate")`
      ]);
    } catch (finError) {
      console.error('Dashboard financial raw SQL queries failed:', finError.message);
    }

    dailyPaymentsRaw.forEach(r => {
      const dateStr = new Date(r.date).toISOString().split('T')[0];
      if (dailyActivityMap.has(dateStr)) {
        const amount = parseFloat(r.total) || 0;
        dailyActivityMap.get(dateStr).payments = amount;
        dailyActivityMap.get(dateStr).revenue += amount;
      }
    });

    dailySalesRaw.forEach(r => {
      const dateStr = new Date(r.date).toISOString().split('T')[0];
      if (dailyActivityMap.has(dateStr)) {
        const amount = parseFloat(r.total) || 0;
        dailyActivityMap.get(dateStr).sales = amount;
        dailyActivityMap.get(dateStr).revenue += amount;
      }
    });

    return NextResponse.json({
      totalMembers,
      activeMembers,
      inactiveMembers,
      monthlyRevenue: revenueThisMonth,
      revenueTrend,
      membersTrend,
      newMembersThisMonth: newMembersCount,
      newMembersTrend,
      pendingPayments,
      lowStockCount,
      topProducts,
      expiringSoon,
      recentActivity,
      chartData,
      revenueComparison,
      planDistribution,
      dailyActivity: Array.from(dailyActivityMap.values()),
      hourlyActivity
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({
      error: 'Failed to fetch dashboard statistics',
      message: error.message
    }, { status: 500 });
  }
}
