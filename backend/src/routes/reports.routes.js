import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Revenue by plan
router.get('/revenue-by-plan', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }
    
    const revenueByPlan = await prisma.payment.groupBy({
      by: ['planId'],
      where,
      _sum: {
        amount: true
      },
      _count: true
    });
    
    const plansData = await Promise.all(
      revenueByPlan.map(async (item) => {
        const plan = await prisma.plan.findUnique({
          where: { id: item.planId }
        });
        return {
          planName: plan.name,
          revenue: parseFloat(item._sum.amount),
          count: item._count
        };
      })
    );
    
    res.json(plansData);
  } catch (error) {
    console.error('Error fetching revenue by plan:', error);
    res.status(500).json({ error: 'Failed to fetch revenue report' });
  }
});

// Defaulters (members with overdue payments)
router.get('/defaulters', authenticate, async (req, res) => {
  try {
    const today = new Date();
    
    const defaulters = await prisma.member.findMany({
      where: {
        status: 'INACTIVE',
        expirationDate: {
          lt: today
        }
      },
      include: {
        plan: true
      },
      orderBy: {
        expirationDate: 'asc'
      }
    });
    
    res.json(defaulters);
  } catch (error) {
    console.error('Error fetching defaulters:', error);
    res.status(500).json({ error: 'Failed to fetch defaulters report' });
  }
});

// Member growth
router.get('/member-growth', authenticate, async (req, res) => {
  try {
    const { months = 12 } = req.query;
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    
    const growth = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as count
      FROM "Member"
      WHERE "createdAt" >= ${startDate}
      GROUP BY month
      ORDER BY month ASC
    `;
    
    res.json(growth.map(g => ({
      month: g.month,
      count: parseInt(g.count)
    })));
  } catch (error) {
    console.error('Error fetching member growth:', error);
    res.status(500).json({ error: 'Failed to fetch member growth report' });
  }
});

// Low frequency members
router.get('/low-frequency', authenticate, async (req, res) => {
  try {
    const { days = 30, maxCheckins = 5 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const activeMembers = await prisma.member.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        checkins: {
          where: {
            checkinDatetime: {
              gte: startDate
            }
          }
        },
        plan: true
      }
    });
    
    const lowFrequency = activeMembers
      .filter(m => m.checkins.length <= parseInt(maxCheckins))
      .map(m => ({
        id: m.id,
        name: m.name,
        phone: m.phone,
        plan: m.plan?.name,
        checkinCount: m.checkins.length,
        lastCheckin: m.checkins[0]?.checkinDatetime || null
      }));
    
    res.json(lowFrequency);
  } catch (error) {
    console.error('Error fetching low frequency members:', error);
    res.status(500).json({ error: 'Failed to fetch low frequency report' });
  }
});

export default router;
