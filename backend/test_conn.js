import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing DB connection...');
  try {
    await prisma.$connect();
    console.log('✅ Connection successful!');
    
    // Quick query to be sure
    const count = await prisma.user.count();
    console.log(`✅ Queried DB successfully. Total users: ${count}`);
    
  } catch (err) {
    console.error('❌ Connection failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
