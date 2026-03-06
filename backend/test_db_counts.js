
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testDB() {
  try {
    const counts = await Promise.all([
      prisma.member.count(),
      prisma.payment.count(),
      prisma.sale.count(),
      prisma.checkin.count()
    ]);
    console.log('Counts:', {
      members: counts[0],
      payments: counts[1],
      sales: counts[2],
      checkins: counts[3]
    });
    
    const revenue = await prisma.payment.aggregate({ _sum: { amount: true } });
    console.log('Total Revenue (Payments):', revenue._sum.amount);

    process.exit(0);
  } catch (error) {
    console.error('DB Connection Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();
