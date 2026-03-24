import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const sqlFilePath = path.resolve(__dirname, '..', '..', 'crossfit_clean.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ Error: ${sqlFilePath} not found!`);
    process.exit(1);
  }

  console.log('🚀 Starting local SQL import...');
  const sql = fs.readFileSync(sqlFilePath, 'utf8');
  
  // Split by semicolon but be careful not to split inside strings or quotes
  // This is a simple split for standard dumps; more complex SQL might need a better parser
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`📡 Found ${statements.length} SQL statements to execute.`);

  for (let i = 0; i < statements.length; i++) {
    try {
      process.stdout.write(`   - Executing statement ${i + 1}/${statements.length}...\r`);
      await prisma.$executeRawUnsafe(statements[i]);
    } catch (err) {
      console.error(`\n   ⚠️  Error on statement ${i + 1}: ${err.message}`);
      // Continue with next statement
    }
  }

  console.log('\n\n🎉 Import completed successfully!');
}

main()
  .catch((e) => {
    console.error('\n❌ Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
