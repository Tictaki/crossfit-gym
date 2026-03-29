import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

// Construct direct URL with no-verify SSL for the script
const directUrl = process.env.DIRECT_URL + (process.env.DIRECT_URL.includes('?') ? '&' : '?') + 'sslmode=no-verify';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: directUrl,
    },
  },
});

async function main() {
  console.log('🚀 Starting admin user creation with direct URL...');

  const users = [
    {
      name: 'Fauzia Admin',
      email: 'fauzia@crosstraining.com',
      role: 'ADMIN',
    }
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
      },
      create: {
        name: user.name,
        email: user.email,
        password: 'SUPABASE_MANAGED',
        role: user.role,
      },
    });
    
    console.log(`✅ Admin User (${user.email}) created/updated in Prisma.`);
  }

  console.log('✨ Admin creation finished!');
}

main()
  .catch((e) => {
    console.error('❌ Error creating admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
