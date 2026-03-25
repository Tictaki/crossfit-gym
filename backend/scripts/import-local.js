import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function main() {
  const sqlPath = path.resolve(__dirname, '../../crossfit_clean.sql');
  
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Error: ${sqlPath} not found!`);
    process.exit(1);
  }

  console.log('🚀 Starting robust local SQL import...');
  
  try {
    // 1. Clean the database first
    console.log('🧹 Wiping public schema...');
    await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
    
    const content = fs.readFileSync(sqlPath, 'utf8');
    const lines = content.split(/\r?\n/);
    
    let buffer = '';
    let inCopyBlock = false;
    let statementCount = 0;
    let successCount = 0;
    let failCount = 0;

    console.log('📑 Processing SQL file line by line...');

    for (let line of lines) {
      const trimmed = line.trim();
      
      // Handle COPY FROM stdin blocks - we skip these as they require interactive stream or psql
      if (trimmed.toUpperCase().startsWith('COPY ') && trimmed.toUpperCase().endsWith('FROM STDIN;')) {
        inCopyBlock = true;
        continue;
      }
      if (inCopyBlock) {
        if (trimmed === '\\.') inCopyBlock = false;
        continue;
      }

      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('/*')) continue;
      
      // Skip pg_dump metadata that Prisma can't handle
      if (trimmed.startsWith('Owner:') || trimmed.startsWith('Type:') || trimmed.startsWith('Schema:') || trimmed.startsWith('Name:')) continue;

      buffer += line + '\n';

      // If line ends with semicolon, it's a complete statement
      if (trimmed.endsWith(';')) {
        const stmt = buffer.trim();
        buffer = '';
        
        if (!stmt) continue;
        
        statementCount++;
        try {
          // Log progress every 50 statements
          if (statementCount % 50 === 0) {
            process.stdout.write(`   Executed ${statementCount} statements...\r`);
          }
          await prisma.$executeRawUnsafe(stmt);
          successCount++;
        } catch (err) {
          failCount++;
          // Only show error if it's not "already exists" related
          if (!err.message.includes('already exists') && !err.message.includes('standard public schema')) {
             console.warn(`\n   ⚠️  Error on statement ${statementCount}: ${err.message.split('\n')[0]}`);
          }
        }
      }
    }

    console.log(`\n🎉 Import process finished!`);
    console.log(`📊 Stats: ${successCount} succeeded, ${failCount} failed.`);
    console.log(`✅ Database schema restored. Please check if your data (users/members) is present.`);

  } catch (error) {
    console.error('❌ Critical error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
