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

  // Split by semicolon + newline (most reliable for pg_dump)
  const rawStatements = sql
    .split(/;\n/)
    .map(s => s.trim())
    .filter(s => {
      if (s.length === 0) return false;
      const firstLine = s.split('\n')[0].trim();
      const metadataKeywords = ['Owner:', 'Type:', 'Schema:', 'Name:', '--'];
      if (metadataKeywords.some(keyword => firstLine.startsWith(keyword))) return false;
      if (firstLine.startsWith('\\')) return false;
      return true;
    });

  const statements = [
    'DROP SCHEMA public CASCADE',
    'CREATE SCHEMA public',
    ...rawStatements
  ];

  console.log(`📡 Found ${statements.length} SQL statements to execute.`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt) continue;
    
    // Ensure the statement ends with a semicolon if it's not the manual DROP/CREATE
    const finalStmt = (i < 2) ? stmt : (stmt.endsWith(';') ? stmt : stmt + ';');

    try {
      process.stdout.write(`   - Executing statement ${i + 1}/${statements.length}...\r`);
      await prisma.$executeRawUnsafe(finalStmt);
    } catch (err) {
      // Don't log full error for common "already exists" during creation if it happens
      console.error(`\n   ⚠️  Error on statement ${i + 1}: ${err.message.split('\n')[0]}`);
    }
  }

  console.log('\n🎉 Import process finished!');
}

main()
  .catch((e) => {
    console.error('\n❌ Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
