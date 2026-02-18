import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { updateMemberStatuses } from '../utils/autoUpdateStatus.js';

const router = express.Router();
const prisma = new PrismaClient();

// List check-ins
router.get('/', authenticate, async (req, res) => {
  try {
    const { memberId, date, page = 1, limit = 50 } = req.query;
    
    const where = {};
    
    if (memberId) {
      where.memberId = memberId;
    }
    
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      
      where.checkinDatetime = {
        gte: startOfDay,
        lte: endOfDay
      };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [checkins, total] = await Promise.all([
      prisma.checkin.findMany({
        where,
        include: {
          member: {
            select: {
              name: true,
              photo: true,
              status: true
            }
          }
        },
        orderBy: { checkinDatetime: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.checkin.count({ where })
    ]);
    
    res.json({
      checkins,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
});

// Register check-in
router.post('/', authenticate, async (req, res) => {
  try {
    const { memberId } = req.body;
    
    await updateMemberStatuses(); // Auto-update statuses
    
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { plan: true }
    });
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    // Block check-in for inactive or suspended members
    if (member.status === 'INACTIVE') {
      return res.status(403).json({ 
        error: 'Check-in denied',
        message: 'Membro com pagamento em atraso. Por favor, regularize o pagamento.',
        member: {
          name: member.name,
          status: member.status,
          expirationDate: member.expirationDate
        }
      });
    }
    
    if (member.status === 'SUSPENDED') {
      return res.status(403).json({ 
        error: 'Check-in denied',
        message: 'Membro suspenso. Contacte a administração.',
        member: {
          name: member.name,
          status: member.status
        }
      });
    }
    
    const checkin = await prisma.checkin.create({
      data: {
        memberId
      },
      include: {
        member: {
          select: {
            name: true,
            photo: true,
            plan: true,
            expirationDate: true
          }
        }
      }
    });
    
    res.status(201).json({
      checkin,
      message: `Bem-vindo, ${member.name}!`
    });
  } catch (error) {
    console.error('Error creating check-in:', error);
    res.status(500).json({ error: 'Failed to create check-in' });
  }
});

// Get member frequency report
router.get('/frequency/:memberId', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {
      memberId: req.params.memberId
    };
    
    if (startDate || endDate) {
      where.checkinDatetime = {};
      if (startDate) where.checkinDatetime.gte = new Date(startDate);
      if (endDate) where.checkinDatetime.lte = new Date(endDate);
    }
    
    const checkins = await prisma.checkin.findMany({
      where,
      orderBy: { checkinDatetime: 'desc' }
    });
    
    // Group by date
    const byDate = {};
    checkins.forEach(c => {
      const date = c.checkinDatetime.toISOString().split('T')[0];
      byDate[date] = (byDate[date] || 0) + 1;
    });
    
    res.json({
      total: checkins.length,
      byDate,
      checkins
    });
  } catch (error) {
    console.error('Error fetching frequency:', error);
    res.status(500).json({ error: 'Failed to fetch frequency report' });
  }
});

export default router;
