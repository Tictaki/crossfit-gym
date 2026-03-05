
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const userCount = await prisma.user.count();
    const memberCount = await prisma.member.count();
    console.log('--- DATABASE STATUS ---');
    console.log(`Users: ${userCount}`);
    console.log(`Members: ${memberCount}`);
    console.log('-----------------------');
  } catch (err) {
    console.error('Error connecting to DB:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
