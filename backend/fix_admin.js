import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAndCreateAdmin() {
  try {
    console.log('🔍 Checking for admin user...');
    
    // Check if admin exists
    const adminEmail = 'gerente@crosstraininggym.com';
    let admin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (admin) {
      console.log('✅ Admin user found:', admin.email);
      console.log('   Name:', admin.name);
      console.log('   Role:', admin.role);
      
      // Update password to ensure it matches
      const hashedPassword = await bcrypt.hash('Admin#Master2026', 10);
      await prisma.user.update({
        where: { email: adminEmail },
        data: { password: hashedPassword }
      });
      console.log('✅ Admin password updated');
    } else {
      console.log('❌ Admin user not found. Creating...');
      
      const hashedPassword = await bcrypt.hash('Admin#Master2026', 10);
      admin = await prisma.user.create({
        data: {
          name: 'Gerente',
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      console.log('✅ Admin user created:', admin.email);
    }

    // Check receptionist
    const receptionistEmail = 'equipa@crosstraininggym.com';
    let receptionist = await prisma.user.findUnique({
      where: { email: receptionistEmail }
    });

    if (receptionist) {
      console.log('✅ Receptionist user found:', receptionist.email);
      
      // Update password
      const hashedPassword = await bcrypt.hash('Staff@Gym2026', 10);
      await prisma.user.update({
        where: { email: receptionistEmail },
        data: { password: hashedPassword }
      });
      console.log('✅ Receptionist password updated');
    } else {
      console.log('❌ Receptionist user not found. Creating...');
      
      const hashedPassword = await bcrypt.hash('Staff@Gym2026', 10);
      receptionist = await prisma.user.create({
        data: {
          name: 'Equipa',
          email: receptionistEmail,
          password: hashedPassword,
          role: 'RECEPTIONIST'
        }
      });
      console.log('✅ Receptionist user created:', receptionist.email);
    }

    console.log('\n📋 Login Credentials:');
    console.log('Admin: gerente@crosstraininggym.com / Admin#Master2026');
    console.log('Receção: equipa@crosstraininggym.com / Staff@Gym2026');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateAdmin();
