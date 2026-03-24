import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const OLD_DATABASE_URL = "postgresql://postgres:WgOIoFmUjORDypfnjtfKBHBESKSqTJRE@gondola.proxy.rlwy.net:22762/railway";
const NEW_DATABASE_URL = process.env.DATABASE_URL;

if (!NEW_DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not found in .env');
  process.exit(1);
}

const oldPrisma = new PrismaClient({
  datasources: { db: { url: OLD_DATABASE_URL } },
});

const newPrisma = new PrismaClient({
  datasources: { db: { url: NEW_DATABASE_URL } },
});

async function connectWithRetry(prisma, name, retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`   - Connecting to ${name} (attempt ${i + 1})...`);
      await prisma.$connect();
      console.log(`   ✅ Connected to ${name}.`);
      return;
    } catch (err) {
      console.warn(`   ⚠️   Connection to ${name} failed: ${err.message}`);
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function migrate() {
  try {
    console.log('🚀 Starting data migration...');
    console.log(`Source: ${OLD_DATABASE_URL.split('@')[1]}`);
    console.log(`Target: ${NEW_DATABASE_URL.split('@')[1]}`);

    // 1. Explicitly connect
    console.log('\n🔌 Connecting to databases...');
    await connectWithRetry(oldPrisma, 'Source DB');
    await connectWithRetry(newPrisma, 'Target DB');

    const deleteOrder = [
      'notificationRecipient', 'notification', 'paymentAudit', 'invoice', 
      'payment', 'checkin', 'expense', 'fixedCost', 'sale', 'member', 
      'plan', 'product', 'setting', 'user'
    ];

    const insertOrder = [...deleteOrder].reverse();

    // 2. Clear existing data in NEW database
    console.log('\n🧹 Clearing new database...');
    for (const model of deleteOrder) {
      try {
        console.log(`   - Clearing ${model}...`);
        await newPrisma[model].deleteMany({});
      } catch (err) {
        console.warn(`   ⚠️ Warning: Could not clear ${model}: ${err.message}`);
      }
    }
    console.log('✅ New database cleared.');

    // 3. Copy data from OLD to NEW
    console.log('\n📥 Copying data...');
    for (const model of insertOrder) {
      try {
        const count = await oldPrisma[model].count();
        console.log(`   - Found ${count} records in ${model}.`);
        
        if (count > 0) {
          const data = await oldPrisma[model].findMany();
          console.log(`   - Inserting ${data.length} records into ${model}...`);
          
          await newPrisma[model].createMany({
            data: data,
            skipDuplicates: true,
          });
          console.log(`   ✅ Migrated ${model}.`);
        }
      } catch (err) {
        console.error(`   ❌ CRITICAL Error migrating ${model}:`, err.message);
      }
    }

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    await oldPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}

migrate();
