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
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);
    
    // Total members by status
    const [activeMembers, inactiveMembers, totalMembers] = await Promise.all([
      prisma.member.count({ where: { status: 'ACTIVE' } }),
      prisma.member.count({ where: { status: 'INACTIVE' } }),
      prisma.member.count()
    ]);
    
    // Revenue this month
    const paymentsThisMonth = await prisma.payment.aggregate({
      where: {
        paymentDate: {
          gte: firstDayOfMonth
        }
      },
      _sum: {
        amount: true
      },
      _count: true
    });
    
    // Overdue payments
    const overdueMembers = await prisma.member.count({
      where: {
        status: 'INACTIVE',
        expirationDate: {
          lt: today
        }
      }
    });
    
    // New members this month
    const newMembersCount = await prisma.member.count({
      where: {
        createdAt: {
          gte: firstDayOfMonth
        }
      }
    });
    
    // Members expiring soon
    const expiringSoon = await prisma.member.findMany({
      where: {
        status: 'ACTIVE',
        expirationDate: {
          gte: today,
          lte: sevenDaysLater
        }
      },
      include: {
        plan: true
      },
      orderBy: {
        expirationDate: 'asc'
      }
    });
    
    // Sales revenue this month
    const salesThisMonth = await prisma.sale.aggregate({
      where: {
        saleDate: {
          gte: firstDayOfMonth
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: true
    });

    // Low stock products
    const lowStockCount = await prisma.product.count({
      where: {
        stock: {
          lte: 5
        },
        status: true
      }
    });

    // Top selling products this month
    const topProductsRaw = await prisma.sale.groupBy({
      by: ['productId'],
      where: {
        saleDate: {
          gte: firstDayOfMonth
        }
      },
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    });

    // Get product details for top products
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
    
    // Monthly revenue chart (last 6 months) - Combined Payments + Sales
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    sixMonthsAgo.setDate(1); // Start from beginning of month
    
    // Get monthly payments
    const monthlyPayments = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "paymentDate") as month,
        SUM(amount) as total
      FROM "Payment"
      WHERE "paymentDate" >= ${sixMonthsAgo}
      GROUP BY month
      ORDER BY month ASC
    `;

    // Get monthly sales
    const monthlySales = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "saleDate") as month,
        SUM("totalAmount") as total
      FROM "Sale"
      WHERE "saleDate" >= ${sixMonthsAgo}
      GROUP BY month
      ORDER BY month ASC
    `;

    // Merge and format revenue data
    const revenueMap = new Map();

    // Process payments
    monthlyPayments.forEach(r => {
      const monthKey = new Date(r.month).toISOString().substring(0, 7); // YYYY-MM
      const amount = parseFloat(r.total) || 0;
      if (!revenueMap.has(monthKey)) {
        revenueMap.set(monthKey, { month: r.month, payments: 0, sales: 0, total: 0 });
      }
      const entry = revenueMap.get(monthKey);
      entry.payments += amount;
      entry.total += amount;
    });

    // Process sales
    monthlySales.forEach(r => {
      const monthKey = new Date(r.month).toISOString().substring(0, 7); // YYYY-MM
      const amount = parseFloat(r.total) || 0;
      if (!revenueMap.has(monthKey)) {
        revenueMap.set(monthKey, { month: r.month, payments: 0, sales: 0, total: 0 });
      }
      const entry = revenueMap.get(monthKey);
      entry.sales += amount;
      entry.total += amount;
    });

    // Plan distribution for Pie Chart
    const planDistributionRaw = await prisma.member.groupBy({
      by: ['planId'],
      _count: {
        id: true
      },
      where: {
        planId: { not: null },
        status: 'ACTIVE'
      }
    });

    const planDistribution = await Promise.all(planDistributionRaw.map(async (item) => {
      const plan = await prisma.plan.findUnique({
        where: { id: item.planId },
        select: { name: true }
      });
      return {
        name: plan?.name || 'Sem Plano',
        value: item._count.id
      };
    }));

    // Convert map to sorted array and format for frontend
    const chartData = Array.from(revenueMap.values())
      .sort((a, b) => new Date(a.month) - new Date(b.month))
      .map(entry => ({
        name: new Date(entry.month).toLocaleDateString('pt-PT', { month: 'short' }),
        revenue: entry.total,
        payments: entry.payments,
        sales: entry.sales
      }));
    
    // Daily activity (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(today.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const dailyCheckinsRaw = await prisma.$queryRaw`
      SELECT 
        DATE("checkinDatetime") as date,
        COUNT(*) as count
      FROM "Checkin"
      WHERE "checkinDatetime" >= ${fourteenDaysAgo}
      GROUP BY DATE("checkinDatetime")
      ORDER BY date ASC
    `;

    const dailyActiveMembers = await prisma.$queryRaw`
      SELECT 
        DATE(c."checkinDatetime") as date,
        COUNT(DISTINCT c."memberId") as count
      FROM "Checkin" c
      WHERE c."checkinDatetime" >= ${fourteenDaysAgo}
      GROUP BY DATE(c."checkinDatetime")
      ORDER BY date ASC
    `;

    // Merge daily check-ins and active members data
    const dailyActivityMap = new Map();
    
    // Create entries for all days in the range
    for (let i = 0; i <= 14; i++) {
      const date = new Date(fourteenDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyActivityMap.set(dateStr, {
        date: dateStr,
        checkIns: 0,
        activeMembersCount: 0
      });
    }

    // Add check-ins data
    dailyCheckinsRaw.forEach(r => {
      const dateStr = new Date(r.date).toISOString().split('T')[0];
      if (dailyActivityMap.has(dateStr)) {
        const entry = dailyActivityMap.get(dateStr);
        entry.checkIns = Number(r.count);
      }
    });

    // Add active members data
    dailyActiveMembers.forEach(r => {
      const dateStr = new Date(r.date).toISOString().split('T')[0];
      if (dailyActivityMap.has(dateStr)) {
        const entry = dailyActivityMap.get(dateStr);
        entry.activeMembersCount = Number(r.count);
      }
    });

    const dailyActivity = Array.from(dailyActivityMap.values());
    
    // Calculate pending payments (monetary value of expired plans)
    const overdueMembersWithPlans = await prisma.member.findMany({
      where: {
        status: 'INACTIVE',
        expirationDate: { lt: today },
        planId: { not: null }
      },
      include: { plan: true }
    });

    const pendingPayments = overdueMembersWithPlans.reduce((sum, m) => {
      return sum + parseFloat(m.plan?.price || 0);
    }, 0);

    res.json({
      activeMembers,
      inactiveMembers,
      totalMembers: activeMembers, // UI shows "Membros Ativos" for this card
      monthlyRevenue: parseFloat(paymentsThisMonth._sum.amount || 0) + parseFloat(salesThisMonth._sum.totalAmount || 0),
      paymentsCount: paymentsThisMonth._count,
      salesRevenueThisMonth: parseFloat(salesThisMonth._sum.totalAmount || 0),
      salesCount: salesThisMonth._count,
      lowStockCount,
      topProducts,
      overdueMembers, // Keep count just in case
      pendingPayments, // Monetary value for UI
      newMembersThisMonth: newMembersCount,
      expiringSoon,
      chartData,
      planDistribution,
      dailyActivity
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

export default router;
