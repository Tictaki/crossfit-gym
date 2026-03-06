
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testDB() {
  try {
    const memberCount = await prisma.member.count();
    console.log('Member count:', memberCount);
    const lastMember = await prisma.member.findFirst({ orderBy: { createdAt: 'desc' } });
    console.log('Last member added:', lastMember?.name);
    process.exit(0);
  } catch (error) {
    console.error('DB Connection Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();
