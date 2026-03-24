import { PrismaClient } from '@prisma/client';

const DATABASE_URL = 'postgresql://postgres:wSWCAzWnAPEgHABfedSipUWlWjlkQUhp@mainline.proxy.rlwy.net:10145/railway?sslmode=no-verify';

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } }
});

async function main() {
  console.log('🚀 Starting schema wipe...');
  for (let i = 0; i < 5; i++) {
    try {
      console.log(`   - Connecting (attempt ${i + 1})...`);
      await prisma.$connect();
      console.log('   ✅ Connected.');
      
      console.log('   - Dropping public schema...');
      await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE');
      console.log('   - Re-creating public schema...');
      await prisma.$executeRawUnsafe('CREATE SCHEMA public');
      console.log('   ✅ Wipe successful.');
      return;
    } catch (e) {
      console.warn(`   ⚠️   Attempt ${i + 1} failed: ${e.message}`);
      if (i === 4) throw e;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

main()
  .catch(e => {
    console.error('❌ Wipe failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
