import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
  console.log('--- DB DEBUG START ---');
  try {
    console.log('Testing connection...');
    await prisma.$connect();
    console.log('✅ Connected');

    console.log('Checking Member count...');
    const count = await prisma.member.count();
    console.log(`✅ Member count: ${count}`);

    console.log('Checking Plan count...');
    const plans = await prisma.plan.count();
    console.log(`✅ Plan count: ${plans}`);

    console.log('Checking recent payments...');
    const payments = await prisma.payment.findMany({ take: 1 });
    console.log(`✅ Payments: ${payments.length}`);

    console.log('Listing tables for raw SQL verification...');
    const tables = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
    console.log('✅ Tables:', tables.map(t => t.tablename).join(', '));

  } catch (error) {
    console.error('❌ DB DEBUG FAILED:', error);
  } finally {
    await prisma.$disconnect();
    console.log('--- DB DEBUG END ---');
  }
}

debug();
