import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Financial summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, source = 'all' } = req.query;
    
    // Expenses query (Always use global expenses)
    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // Payments date filter (Gym)
    const wherePayments = {};
    if (startDate || endDate) {
      wherePayments.paymentDate = {};
      if (startDate) wherePayments.paymentDate.gte = new Date(startDate);
      if (endDate) wherePayments.paymentDate.lte = new Date(endDate);
    }
    
    // Sales date filter (Store)
    const whereSales = {};
    if (startDate || endDate) {
      whereSales.saleDate = {};
      if (startDate) whereSales.saleDate.gte = new Date(startDate);
      if (endDate) whereSales.saleDate.lte = new Date(endDate);
    }
    
    // Start queries based on source
    const queries = [];
    
    // Base expenses query (always runs)
    const expensesQuery = prisma.expense.aggregate({ where, _sum: { amount: true }, _count: true });
    const fixedCostsQuery = prisma.fixedCost.aggregate({ _sum: { amount: true } });
    
    let paymentsQuery = Promise.resolve(null);
    let salesQuery = Promise.resolve(null);

    if (source === 'all' || source === 'gym') {
      paymentsQuery = prisma.payment.aggregate({ where: wherePayments, _sum: { amount: true }, _count: true });
    }
    if (source === 'all' || source === 'store') {
      salesQuery = prisma.sale.aggregate({ where: whereSales, _sum: { totalAmount: true }, _count: true });
    }

    const [expenses, fixedCosts, payments, sales] = await Promise.all([expensesQuery, fixedCostsQuery, paymentsQuery, salesQuery]);
    
    // Safely parse decimals (Prisma returns null for sum if no records match)
    const fixedCostsTotal = parseFloat(fixedCosts?._sum?.amount || 0);
    const variableExpensesTotal = parseFloat(expenses?._sum?.amount || 0);
    
    const gymRevenue = payments ? parseFloat(payments._sum.amount || 0) : 0;
    const storeRevenue = sales ? parseFloat(sales._sum.totalAmount || 0) : 0;
    const totalRevenue = gymRevenue + storeRevenue;
    
    const gymCount = payments ? payments._count : 0;
    const storeCount = sales ? sales._count : 0;
    const totalCount = gymCount + storeCount;
    
    const totalExpenses = variableExpensesTotal + fixedCostsTotal;
    const netProfit = totalRevenue - totalExpenses;
    
    res.json({
      revenue: {
        total: totalRevenue,
        gym: gymRevenue,
        store: storeRevenue,
        count: totalCount
      },
      expenses: {
        total: totalExpenses,
        variable: variableExpensesTotal,
        fixed: fixedCostsTotal,
        count: expenses._count
      },
      netProfit
    });
  } catch (error) {
    console.error('Error fetching accounting summary:', error);
    res.status(500).json({ error: 'Failed to fetch accounting summary' });
  }
});

// Financial trends (monthly revenue vs expenses)
router.get('/trends', authenticate, async (req, res) => {
  try {
    const { months = 6, source = 'all' } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months) + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Fetch fixed costs monthly total first
    const fixedCostsAgg = await prisma.fixedCost.aggregate({
      _sum: { amount: true }
    });
    const fixedCostsMonthly = parseFloat(fixedCostsAgg._sum?.amount || 0);

    let revenueTrends = [];
    if (source === 'all' || source === 'gym') {
      const gymTrends = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "paymentDate") as month,
          SUM(amount) as revenue
        FROM "Payment"
        WHERE "paymentDate" >= ${startDate}
        GROUP BY month
        ORDER BY month ASC
      `;
      revenueTrends = [...gymTrends];
    }
    
    if (source === 'all' || source === 'store') {
      const storeTrends = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "saleDate") as month,
          SUM("totalAmount") as revenue
        FROM "Sale"
        WHERE "saleDate" >= ${startDate}
        GROUP BY month
        ORDER BY month ASC
      `;
      // Merge with existing revenueTrends
      storeTrends.forEach(st => {
        const existing = revenueTrends.find(rt => rt.month.toISOString() === st.month.toISOString());
        if (existing) {
          existing.revenue = (parseFloat(existing.revenue) + parseFloat(st.revenue)).toString();
        } else {
          revenueTrends.push(st);
        }
      });
    }

    const expenseTrends = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "date") as month,
        SUM(amount) as expenses
      FROM "Expense"
      WHERE "date" >= ${startDate}
      GROUP BY month
      ORDER BY month ASC
    `;

    const trendsMap = {};
    
    revenueTrends.forEach(r => {
      const m = new Date(r.month).toISOString();
      trendsMap[m] = { month: m, revenue: parseFloat(r.revenue), expenses: fixedCostsMonthly };
    });

    expenseTrends.forEach(e => {
      const m = new Date(e.month).toISOString();
      if (!trendsMap[m]) {
        trendsMap[m] = { month: m, revenue: 0, expenses: parseFloat(e.expenses) + fixedCostsMonthly };
      } else {
        trendsMap[m].expenses = parseFloat(e.expenses) + fixedCostsMonthly;
      }
    });

    const trends = Object.values(trendsMap).sort((a, b) => new Date(a.month) - new Date(b.month));

    res.json(trends);
  } catch (error) {
    console.error('Error fetching accounting trends:', error);
    res.status(500).json({ error: 'Failed to fetch accounting trends' });
  }
});

export default router;
