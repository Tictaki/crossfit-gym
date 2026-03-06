import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get unread notifications for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = 'false' } = req.query;
    const userId = req.user.id;
    
    const where = {
      userId
    };

    if (unreadOnly === 'true') {
      where.read = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total, unreadCount] = await Promise.all([
      prisma.notificationRecipient.findMany({
        where,
        include: {
          notification: {
            include: {
              user: {
                select: { name: true, photo: true }
              }
            }
          }
        },
        orderBy: {
          notification: {
            createdAt: 'desc'
          }
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.notificationRecipient.count({ where }),
      prisma.notificationRecipient.count({ 
        where: { userId, read: false } 
      })
    ]);

    // Flatten structure for easier frontend consumption
    const notifications = items.map(item => ({
      id: item.id, // Recipient ID (to mark as read)
      notificationId: item.notification.id,
      message: item.notification.message,
      type: item.notification.type,
      entity: item.notification.entity,
      entityId: item.notification.entityId,
      createdAt: item.notification.createdAt,
      read: item.read,
      actor: item.notification.user?.name || 'Sistema',
      actorPhoto: item.notification.user?.photo
    }));

    res.json({
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark single notification as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Ensure user owns this recipient record
    const recipient = await prisma.notificationRecipient.findUnique({
      where: { id }
    });

    if (!recipient || recipient.userId !== userId) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notificationRecipient.update({
      where: { id },
      data: { read: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all as read
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notificationRecipient.updateMany({
      where: { 
        userId,
        read: false
      },
      data: { read: true }
    });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

export default router;
