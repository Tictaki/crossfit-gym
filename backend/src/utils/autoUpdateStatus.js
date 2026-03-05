import prisma from './prisma.js';

/**
 * Auto-update member statuses based on expiration date
 * Sets status to INACTIVE if expiration date has passed
 */
export async function updateMemberStatuses() {
  try {
    const today = new Date();
    
    const result = await prisma.member.updateMany({
      where: {
        status: 'ACTIVE',
        expirationDate: {
          lt: today
        }
      },
      data: {
        status: 'INACTIVE'
      }
    });
    
    if (result.count > 0) {
      console.log(`✅ Auto-updated ${result.count} member(s) to INACTIVE status`);
    }
    
    return result;
  } catch (error) {
    console.error('Error auto-updating member statuses:', error);
    throw error;
  }
}
