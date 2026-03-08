import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking migration history...');
  try {
    const migrations = await prisma.$queryRawUnsafe('SELECT id, migration_name, finished_at FROM "_prisma_migrations" ORDER BY finished_at DESC');
    console.log(migrations);
  } catch (err) {
    console.error('Failed to query migrations:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
