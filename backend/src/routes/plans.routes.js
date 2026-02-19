import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { notify } from '../utils/notifier.js';

const router = express.Router();
const prisma = new PrismaClient();

// List all plans
router.get('/', authenticate, async (req, res) => {
  try {
    const { includeInactive } = req.query;
    
    const where = includeInactive === 'true' ? {} : { status: true };
    
    const plans = await prisma.plan.findMany({
      where,
      orderBy: { durationDays: 'asc' },
      include: {
        _count: {
          select: { members: true }
        }
      }
    });
    
    res.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Create plan (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, price, durationDays, description } = req.body;
    
    const plan = await prisma.plan.create({
      data: {
        name,
        price: parseFloat(price),
        durationDays: parseInt(durationDays),
        description,
        status: true
      }
    });
    
    res.status(201).json(plan);

    await notify({
      action: 'CREATE',
      message: `Novo plano criado: ${plan.name}`,
      actorId: req.user.id,
      entity: 'PLAN',
      entityId: plan.id
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// Update plan (admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, price, durationDays, description, status } = req.body;
    
    const plan = await prisma.plan.update({
      where: { id: req.params.id },
      data: {
        name,
        price: price ? parseFloat(price) : undefined,
        durationDays: durationDays ? parseInt(durationDays) : undefined,
        description,
        status: status !== undefined ? status : undefined
      }
    });
    
    res.json(plan);

    await notify({
      action: 'UPDATE',
      message: `Plano atualizado: ${plan.name}`,
      actorId: req.user.id,
      entity: 'PLAN',
      entityId: plan.id
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// Delete plan (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if there are any members associated with this plan
    const memberCount = await prisma.member.count({
      where: { planId: id }
    });

    if (memberCount > 0) {
      return res.status(400).json({ 
        error: `Não é possível apagar este plano porque existem ${memberCount} membros associados a ele. Recomenda-se desativar o plano em vez de apagá-lo.` 
      });
    }

    // Perform hard delete if no members are associated
    await prisma.plan.delete({
      where: { id }
    });
    
    res.json({ message: 'Plano apagado permanentemente com sucesso' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: 'Falha ao apagar o plano' });
  }
});

export default router;
