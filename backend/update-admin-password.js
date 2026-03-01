import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updatePasswords() {
  try {
    const adminHash = await bcrypt.hash('Gym@93203397', 10);
    const staffHash = await bcrypt.hash('Staff@Gym2026', 10);

    await prisma.user.update({
      where: { email: 'gerente@crosstraininggym.com' },
      data: { password: adminHash }
    });
    console.log('✅ Admin password updated: gerente@crosstraininggym.com → Gym@93203397');

    await prisma.user.update({
      where: { email: 'equipa@crosstraininggym.com' },
      data: { password: staffHash }
    });
    console.log('✅ Staff password updated: equipa@crosstraininggym.com → Staff@Gym2026');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

updatePasswords();
