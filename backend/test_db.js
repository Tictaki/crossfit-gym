
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDB() {
  try {
    const memberCount = await prisma.member.count();
    console.log('Member count:', memberCount);
    process.exit(0);
  } catch (error) {
    console.error('DB Connection Error:', error);
    process.exit(1);
  }
}

testDB();
