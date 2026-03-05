import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Dashboard statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);
    
    // Total members by status (Current)
    const [activeMembers, inactiveMembers, totalMembers] = await Promise.all([
      prisma.member.count({ where: { status: 'ACTIVE' } }),
      prisma.member.count({ where: { status: 'INACTIVE' } }),
      prisma.member.count()
    ]);

    // Active members at start of month (approximate for trend)
    const activeAtStartOfMonth = await prisma.member.count({
      where: {
        status: 'ACTIVE',
        createdAt: { lt: firstDayOfMonth }
      }
    });
    
    // Revenue this month (Current)
    const paymentsThisMonth = await prisma.payment.aggregate({
      where: { paymentDate: { gte: firstDayOfMonth } },
      _sum: { amount: true },
      _count: true
    });
    
    // Revenue last month (For trend)
    const paymentsLastMonth = await prisma.payment.aggregate({
      where: { 
        paymentDate: { 
          gte: firstDayOfLastMonth,
          lt: firstDayOfMonth 
        } 
      },
      _sum: { amount: true }
    });

    const salesThisMonth = await prisma.sale.aggregate({
      where: { saleDate: { gte: firstDayOfMonth } },
      _sum: { totalAmount: true }
    });

    const salesLastMonth = await prisma.sale.aggregate({
      where: { 
        saleDate: { 
          gte: firstDayOfLastMonth,
          lt: firstDayOfMonth 
        } 
      },
      _sum: { totalAmount: true }
    });

    const revenueThisMonth = parseFloat(paymentsThisMonth._sum.amount || 0) + parseFloat(salesThisMonth._sum.totalAmount || 0);
    const revenueLastMonth = parseFloat(paymentsLastMonth._sum.amount || 0) + parseFloat(salesLastMonth._sum.totalAmount || 0);
    
    // New members this month vs last month
    const [newMembersCount, newMembersLastMonth] = await Promise.all([
      prisma.member.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
      prisma.member.count({ where: { createdAt: { gte: firstDayOfLastMonth, lt: firstDayOfMonth } } })
    ]);
    
    // Trends calculation
    const calculateTrend = (current, previous) => {
      if (!previous) return current > 0 ? 100 : 0;
      return parseFloat(((current - previous) / previous * 100).toFixed(1));
    };

    const membersTrend = calculateTrend(activeMembers, activeAtStartOfMonth);
    const revenueTrend = calculateTrend(revenueThisMonth, revenueLastMonth);
    const newMembersTrend = calculateTrend(newMembersCount, newMembersLastMonth);

    // Overdue payments (Monetary)
    const overdueMembersWithPlans = await prisma.member.findMany({
      where: {
        status: 'INACTIVE',
        expirationDate: { lt: today },
        planId: { not: null }
      },
      include: { plan: true }
    });

    const pendingPayments = overdueMembersWithPlans.reduce((sum, m) => sum + parseFloat(m.plan?.price || 0), 0);
    
    // Members expiring soon
    const expiringSoon = await prisma.member.findMany({
      where: {
        status: 'ACTIVE',
        expirationDate: { gte: today, lte: sevenDaysLater }
      },
      include: { plan: true },
      orderBy: { expirationDate: 'asc' },
      take: 5
    });

    // Recent activity (Last 5 payments)
    const recentActivity = await prisma.payment.findMany({
      orderBy: { paymentDate: 'desc' },
      take: 5,
      include: { 
        member: { select: { name: true } },
        plan: { select: { name: true } }
      }
    });
    
    // Low stock products
    const lowStockCount = await prisma.product.count({
      where: { stock: { lte: 5 }, status: true }
    });

    // Top selling products this month
    const topProductsRaw = await prisma.sale.groupBy({
      by: ['productId'],
      where: { saleDate: { gte: firstDayOfMonth } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    });

    const topProducts = await Promise.all(topProductsRaw.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true }
      });
      return {
        name: product?.name || 'Produto Desconhecido',
        quantity: item._sum.quantity
      };
    }));
    
    // Yearly revenue comparison (Current vs Previous Year)
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

    // Initialize map
    monthNames.forEach((name, index) => {
      comparisonMap.set(index, { month: name, current: 0, previous: 0 });
    });

    // Process payments
    yearPayments.forEach(p => {
      const pDate = new Date(p.paymentDate);
      const m = pDate.getMonth();
      const y = pDate.getFullYear();
      const amount = parseFloat(p.amount) || 0;
      const entry = comparisonMap.get(m);
      if (y === currentYear) entry.current += amount;
      else if (y === lastYear) entry.previous += amount;
    });

    // Process sales
    yearSales.forEach(s => {
      const sDate = new Date(s.saleDate);
      const m = sDate.getMonth();
      const y = sDate.getFullYear();
      const amount = parseFloat(s.totalAmount) || 0;
      const entry = comparisonMap.get(m);
      if (y === currentYear) entry.current += amount;
      else if (y === lastYear) entry.previous += amount;
    });

    const revenueComparison = Array.from(comparisonMap.values());

    // Monthly revenue chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    
    const monthlyPayments = await prisma.$queryRaw`
      SELECT DATE_TRUNC('month', "paymentDate") as month, SUM(amount) as total
      FROM "Payment" WHERE "paymentDate" >= ${sixMonthsAgo} GROUP BY month ORDER BY month ASC
    `;

    const monthlySales = await prisma.$queryRaw`
      SELECT DATE_TRUNC('month', "saleDate") as month, SUM("totalAmount") as total
      FROM "Sale" WHERE "saleDate" >= ${sixMonthsAgo} GROUP BY month ORDER BY month ASC
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

    // Daily activity
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(today.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const [dailyCheckinsRaw, dailyActiveMembers] = await Promise.all([
      prisma.$queryRaw`SELECT DATE("checkinDatetime") as date, COUNT(*) as count FROM "Checkin" WHERE "checkinDatetime" >= ${fourteenDaysAgo} GROUP BY DATE("checkinDatetime") ORDER BY date ASC`,
      prisma.$queryRaw`SELECT DATE(c."checkinDatetime") as date, COUNT(DISTINCT c."memberId") as count FROM "Checkin" c WHERE c."checkinDatetime" >= ${fourteenDaysAgo} GROUP BY DATE(c."checkinDatetime") ORDER BY date ASC`
    ]);

    const dailyActivityMap = new Map();
    for (let i = 0; i <= 14; i++) {
      const date = new Date(fourteenDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyActivityMap.set(dateStr, { date: dateStr, checkIns: 0, activeMembersCount: 0 });
    }

    dailyCheckinsRaw.forEach(r => {
      const dateStr = new Date(r.date).toISOString().split('T')[0];
      if (dailyActivityMap.has(dateStr)) dailyActivityMap.get(dateStr).checkIns = Number(r.count);
    });

    dailyActiveMembers.forEach(r => {
      const dateStr = new Date(r.date).toISOString().split('T')[0];
      if (dailyActivityMap.has(dateStr)) dailyActivityMap.get(dateStr).activeMembersCount = Number(r.count);
    });

    res.json({
      totalMembers: activeMembers,
      activeMembers,
      inactiveMembers,
      monthlyRevenue,
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
      dailyActivity: Array.from(dailyActivityMap.values())
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

export default router;
