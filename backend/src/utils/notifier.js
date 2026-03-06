import prisma from './prisma.js';

/**
 * Creates a notification for an action performed by a user.
 * 
 * @param {Object} params
 * @param {string} params.action - The type of action (CREATE, UPDATE, DELETE, INFO, WARNING)
 * @param {string} params.message - The notification message
 * @param {string} params.actorId - The ID of the user performing the action
 * @param {string} [params.entity] - The entity type (MEMBER, PLAN, PAYMENT, SALE)
 * @param {string} [params.entityId] - The ID of the entity
 * @returns {Promise<void>}
 */
export const notify = async ({ action, message, actorId, entity, entityId }) => {
  try {
    // 1. Find all active users except the actor
    // detailed notifications are for everyone except the person who did it (to avoid noise)
    const recipients = await prisma.user.findMany({
      where: {
        id: { not: actorId },
        // arguably filter by active status if we had one, for now all users
      },
      select: { id: true }
    });

    if (recipients.length === 0) return;

    // 2. Create the notification and recipients in a transaction
    await prisma.$transaction(async (tx) => {
      const notification = await tx.notification.create({
        data: {
          type: action || 'INFO',
          message,
          performedBy: actorId,
          entity,
          entityId
        }
      });

      // 3. Create recipient records
      await tx.notificationRecipient.createMany({
        data: recipients.map(user => ({
          notificationId: notification.id,
          userId: user.id,
          read: false
        }))
      });
    });

    console.log(`[Notifier] Notification '${message}' sent to ${recipients.length} users.`);
    
  } catch (error) {
    console.error('[Notifier] Failed to send notification:', error);
    // Don't throw - notification failure shouldn't block the main action
  }
};
