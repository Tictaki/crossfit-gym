import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { notify } from '../utils/notifier.js';

const router = express.Router();

// List all fixed costs
router.get('/', authenticate, async (req, res) => {
  try {
    const fixedCosts = await prisma.fixedCost.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(fixedCosts);
  } catch (error) {
    console.error('Error fetching fixed costs:', error);
    res.status(500).json({ error: 'Failed to fetch fixed costs' });
  }
});

// Create a new fixed cost
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { description, amount, category } = req.body;
    
    if (!description || !amount || !category) {
      return res.status(400).json({ error: 'Description, amount, and category are required' });
    }

    const fixedCost = await prisma.fixedCost.create({
      data: {
        description,
        amount: parseFloat(amount),
        category
      }
    });

    res.status(201).json(fixedCost);

    await notify({
      action: 'CREATE',
      message: `Novo custo fixo registado: ${fixedCost.description} (${fixedCost.amount} MZN)`,
      actorId: req.user.id,
      entity: 'FIXED_COST',
      entityId: fixedCost.id
    });
  } catch (error) {
    console.error('Error creating fixed cost:', error);
    res.status(500).json({ error: 'Failed to create fixed cost' });
  }
});

// Delete a fixed cost
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const fixedCost = await prisma.fixedCost.findUnique({ where: { id } });
    if (!fixedCost) {
      return res.status(404).json({ error: 'Fixed cost not found' });
    }

    await prisma.fixedCost.delete({ where: { id } });

    res.json({ message: 'Fixed cost deleted successfully' });

    await notify({
      action: 'DELETE',
      message: `Custo fixo removido: ${fixedCost.description}`,
      actorId: req.user.id,
      entity: 'FIXED_COST',
      entityId: id
    });
  } catch (error) {
    console.error('Error deleting fixed cost:', error);
    res.status(500).json({ error: 'Failed to delete fixed cost' });
  }
});

export default router;
