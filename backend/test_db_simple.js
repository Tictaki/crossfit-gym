import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function testConnection() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('Connection test successful:', result);
  } catch (error) {
    console.error('Connection test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
