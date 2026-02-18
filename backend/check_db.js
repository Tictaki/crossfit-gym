import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMemberDetails() {
  try {
    const today = new Date();
    console.log('Current system date:', today.toISOString());
    
    const members = await prisma.member.findMany({
      select: { 
        name: true, 
        status: true, 
        expirationDate: true 
      }
    });
    
    console.log('--- Member Status Audit ---');
    members.forEach(m => {
      const expired = m.expirationDate && new Date(m.expirationDate) < today;
      console.log(`Member: ${m.name.trim()}`);
      console.log(`  Status: ${m.status}`);
      console.log(`  Expiration: ${m.expirationDate ? new Date(m.expirationDate).toISOString() : 'N/A'}`);
      console.log(`  Expired? ${expired ? 'YES' : 'NO'}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMemberDetails();
