import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the root or current directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting credential generation...');

  const users = [
    {
      name: 'Admin CrossFit',
      email: 'admin@crossfit.gym',
      password: 'CrossFitAdmin2026!',
      role: 'ADMIN',
    },
    {
      name: 'Staff CrossFit',
      email: 'staff@crossfit.gym',
      password: 'CrossFitStaff2026!',
      role: 'RECEPTIONIST',
    },
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        password: hashedPassword,
        role: user.role,
      },
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
      },
    });
    
    console.log(`✅ User ${user.role} (${user.email}) created/updated.`);
  }

  console.log('✨ All credentials generated successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error generating credentials:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
