
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const userCount = await prisma.user.count();
    const memberCount = await prisma.member.count();
    console.log(`Connection successful. Users: ${userCount}, Members: ${memberCount}`);
  } catch (err) {
    console.error('Error connecting to DB or missing tables:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
