import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { notify } from '../utils/notifier.js';

const router = express.Router();

// List expenses with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, category, page = 1, limit = 50 } = req.query;
    
    const where = {};
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    
    if (category) {
      where.category = category;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          user: { select: { name: true } }
        },
        orderBy: { date: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.expense.count({ where })
    ]);
    
    res.json({
      expenses,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Register expense
router.post('/', authenticate, async (req, res) => {
  try {
    const { description, amount, category, date, invoiceNumber, dueDate } = req.body;
    
    const expense = await prisma.expense.create({
      data: {
        description,
        amount: parseFloat(amount),
        category,
        date: date ? new Date(date) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        invoiceNumber,
        processedBy: req.user.id
      },
      include: {
        user: { select: { name: true } }
      }
    });
    
    res.status(201).json(expense);

    await notify({
      action: 'CREATE',
      message: `Nova despesa registada: ${expense.description} (${expense.amount} MZN)`,
      actorId: req.user.id,
      entity: 'EXPENSE',
      entityId: expense.id
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Delete expense
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.expense.delete({
      where: { id: req.params.id }
    });

    await notify({
      action: 'DELETE',
      message: `Despesa removida: ID #${req.params.id.substring(0, 8)}`,
      actorId: req.user.id,
      entity: 'EXPENSE',
      entityId: req.params.id
    });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
