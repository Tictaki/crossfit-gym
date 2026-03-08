import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting forceful database migration...');
  
  try {
    console.log('Adding dueDate and invoiceNumber to Expense table...');
    await prisma.$executeRawUnsafe('ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);');
    await prisma.$executeRawUnsafe('ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;');
    console.log('Expense table updated.');
  } catch (err) {
    console.log('Expense Update Error (might already exist):', err.message);
  }

  try {
    console.log('Creating FixedCost table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FixedCost" (
        "id" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "category" TEXT NOT NULL,
        "invoiceNumber" TEXT,
        "dueDate" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "FixedCost_pkey" PRIMARY KEY ("id")
      );
    `);
    
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "FixedCost_category_idx" ON "FixedCost"("category");');
    console.log('FixedCost table created successfully.');
  } catch (err) {
    console.error('FixedCost Creation Error:', err.message);
  }

  console.log('Force migration complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
