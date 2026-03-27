import prisma from '@/lib/prisma';

/**
 * Creates a notification for an action performed by a user.
 */
export const notify = async ({ action, message, actorId, entity, entityId }) => {
  try {
    const recipients = await prisma.user.findMany({
      where: { NOT: { id: actorId } },
      select: { id: true }
    });

    if (recipients.length === 0) return;

    await prisma.$transaction(async (tx) => {
      const notification = await tx.notification.create({
        data: { type: action || 'INFO', message, performedBy: actorId, entity, entityId }
      });

      await tx.notificationRecipient.createMany({
        data: recipients.map(user => ({
          notificationId: notification.id,
          userId: user.id,
          read: false
        }))
      });
    });
  } catch (error) {
    console.error('[Notifier] Failed to send notification:', error);
  }
};
