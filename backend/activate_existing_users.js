import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function activateUsers() {
  try {
    const result = await prisma.user.updateMany({
      where: {
        status: { not: 'ACTIVE' }
      },
      data: {
        status: 'ACTIVE'
      }
    });
    console.log(`Updated ${result.count} users to ACTIVE status.`);
  } catch (error) {
    console.error('Error activating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateUsers();
