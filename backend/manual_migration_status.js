import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function runManualMigration() {
  try {
    console.log('Starting manual migration...');
    
    // 1. Create Enum Type if not exists
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'BANNED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('Enum UserStatus ensured.');

    // 2. Add column to User table if not exists
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" "UserStatus" NOT NULL DEFAULT 'PENDING';
    `);
    console.log('Column status added to User table.');

    // 3. Mark all current users as ACTIVE
    const result = await prisma.$executeRawUnsafe(`
      UPDATE "User" SET "status" = 'ACTIVE' WHERE "status" = 'PENDING';
    `);
    console.log(`Updated ${result} users to ACTIVE status.`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runManualMigration();
