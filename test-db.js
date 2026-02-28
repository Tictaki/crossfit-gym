import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing connection...');
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('Connection successful:', result);
  } catch (error) {
    console.error('Connection failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
