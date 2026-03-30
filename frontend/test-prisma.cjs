const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing Prisma connection...');
    const count = await prisma.member.count();
    console.log('Member count:', count);
  } catch (error) {
    console.error('Prisma test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
