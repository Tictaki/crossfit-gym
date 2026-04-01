import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function checkUser() {
  const email = 'fardhany@crosstrainingym.com';
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    if (user) {
      console.log(`User found: ${user.name} (${user.email}) - Role: ${user.role}`);
    } else {
      console.log(`User ${email} NOT found in Prisma DB.`);
    }
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
