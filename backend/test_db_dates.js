
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testDB() {
  try {
    const payment = await prisma.payment.findFirst();
    const sale = await prisma.sale.findFirst();
    
    console.log('Payment:', payment ? { date: payment.paymentDate, amount: payment.amount } : 'None');
    console.log('Sale:', sale ? { date: sale.saleDate, amount: sale.totalAmount } : 'None');

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    console.log('Today:', today.toISOString());
    console.log('First day of month:', firstDayOfMonth.toISOString());

    process.exit(0);
  } catch (error) {
    console.error('DB Connection Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();
