import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Financial summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate || endDate) {
      where.date = {}; // For expenses
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const wherePayments = {};
    if (startDate || endDate) {
      wherePayments.paymentDate = {}; // For payments
      if (startDate) wherePayments.paymentDate.gte = new Date(startDate);
      if (endDate) wherePayments.paymentDate.lte = new Date(endDate);
    }
    
    const [payments, expenses, fixedCosts] = await Promise.all([
      prisma.payment.aggregate({
        where: wherePayments,
        _sum: { amount: true },
        _count: true
      }),
      prisma.expense.aggregate({
        where: where,
        _sum: { amount: true },
        _count: true
      }),
      prisma.fixedCost.aggregate({
        _sum: { amount: true }
      })
    ]);
    
    const fixedCostsTotal = parseFloat(fixedCosts?._sum?.amount || 0);
    const variableExpensesTotal = parseFloat(expenses._sum.amount || 0);
    const totalRevenue = parseFloat(payments._sum.amount || 0);
    const totalExpenses = variableExpensesTotal + fixedCostsTotal;
    const netProfit = totalRevenue - totalExpenses;
    
    res.json({
      revenue: {
        total: totalRevenue,
        count: payments._count
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
    const { months = 6 } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months) + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    
    // Calculate total monthly fixed costs for trends
    const fixedCostsAgg = await prisma.fixedCost.aggregate({
      _sum: { amount: true }
    });
    const fixedCostsMonthly = parseFloat(fixedCostsAgg._sum?.amount || 0);

    const revenueTrends = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "paymentDate") as month,
        SUM(amount) as revenue
      FROM "Payment"
      WHERE "paymentDate" >= ${startDate}
      GROUP BY month
      ORDER BY month ASC
    `;

    const expenseTrends = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "date") as month,
        SUM(amount) as expenses
      FROM "Expense"
      WHERE "date" >= ${startDate}
      GROUP BY month
      ORDER BY month ASC
    `;

    // Merge trends
    const trendsMap = {};
    
    revenueTrends.forEach(r => {
      const m = r.month.toISOString();
      trendsMap[m] = { month: m, revenue: parseFloat(r.revenue), expenses: 0 };
    });

    expenseTrends.forEach(e => {
      const m = e.month.toISOString();
      if (!trendsMap[m]) {
        trendsMap[m] = { month: m, revenue: 0, expenses: parseFloat(e.expenses) + fixedCostsMonthly };
      } else {
        trendsMap[m].expenses = parseFloat(e.expenses) + fixedCostsMonthly;
      }
    });

    // Ensure all months have at least fixed costs even if no transactions
    Object.keys(trendsMap).forEach(m => {
      if (trendsMap[m].expenses === 0) {
        trendsMap[m].expenses = fixedCostsMonthly;
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
