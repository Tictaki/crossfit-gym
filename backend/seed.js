import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...\n');

    // 1. Create Users
    console.log('👥 Criando utilizadores...');
    const adminPassword = await bcrypt.hash('Admin#Master2026', 10);
    const receptionistPassword = await bcrypt.hash('Staff@Gym2026', 10);

    const admin = await prisma.user.upsert({
      where: { email: 'gerente@crosstraininggym.com' },
      update: {},
      create: {
        name: 'Gerente',
        email: 'gerente@crosstraininggym.com',
        password: adminPassword,
        role: 'ADMIN'
      }
    });

    const receptionist = await prisma.user.upsert({
      where: { email: 'equipa@crosstraininggym.com' },
      update: {},
      create: {
        name: 'Equipa',
        email: 'equipa@crosstraininggym.com',
        password: receptionistPassword,
        role: 'RECEPTIONIST'
      }
    });

    console.log('✅ Utilizadores criados');

    // 2. Create Plans
    console.log('\n📋 Criando planos...');
    const plans = await Promise.all([
      prisma.plan.create({
        data: {
          name: 'Mensal',
          price: 2500,
          durationDays: 30,
          description: 'Acesso completo ao ginásio por 1 mês',
          status: true
        }
      }),
      prisma.plan.create({
        data: {
          name: 'Trimestral',
          price: 6500,
          durationDays: 90,
          description: 'Acesso completo ao ginásio por 3 meses',
          status: true
        }
      }),
      prisma.plan.create({
        data: {
          name: 'Semestral',
          price: 12000,
          durationDays: 180,
          description: 'Acesso completo ao ginásio por 6 meses',
          status: true
        }
      }),
      prisma.plan.create({
        data: {
          name: 'Anual',
          price: 20000,
          durationDays: 365,
          description: 'Acesso completo ao ginásio por 1 ano',
          status: true
        }
      })
    ]);

    console.log(`✅ ${plans.length} planos criados`);

    // 3. Create Sample Members
    console.log('\n👤 Criando membros de exemplo...');
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);

    const members = await Promise.all([
      prisma.member.create({
        data: {
          name: 'João Silva',
          phone: '84 123 4567',
          birthDate: new Date('1990-05-15'),
          gender: 'MALE',
          planId: plans[0].id,
          startDate: today,
          expirationDate: futureDate,
          status: 'ACTIVE'
        }
      }),
      prisma.member.create({
        data: {
          name: 'Maria Santos',
          phone: '85 234 5678',
          birthDate: new Date('1995-08-22'),
          gender: 'FEMALE',
          planId: plans[1].id,
          startDate: today,
          expirationDate: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE'
        }
      }),
      prisma.member.create({
        data: {
          name: 'Carlos Mendes',
          phone: '86 345 6789',
          birthDate: new Date('1988-03-10'),
          gender: 'MALE',
          status: 'INACTIVE'
        }
      })
    ]);

    console.log(`✅ ${members.length} membros criados`);

    // 4. Create Sample Products
    console.log('\n🛍️ Criando produtos de exemplo...');
    const products = await Promise.all([
      prisma.product.create({
        data: {
          name: 'Água Mineral 500ml',
          description: 'Água fresca para hidratação',
          price: 50,
          stock: 100,
          category: 'Bebidas',
          status: true
        }
      }),
      prisma.product.create({
        data: {
          name: 'Proteína Whey 1kg',
          description: 'Suplemento proteico de alta qualidade',
          price: 2500,
          stock: 20,
          category: 'Suplementos',
          status: true
        }
      }),
      prisma.product.create({
        data: {
          name: 'Toalha Gym',
          description: 'Toalha de treino absorvente',
          price: 350,
          stock: 15,
          category: 'Acessórios',
          status: true
        }
      })
    ]);

    console.log(`✅ ${products.length} produtos criados`);

    console.log('\n🎉 Seed completo! Dados restaurados com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`   - ${2} utilizadores`);
    console.log(`   - ${plans.length} planos`);
    console.log(`   - ${members.length} membros`);
    console.log(`   - ${products.length} produtos`);

  } catch (error) {
    console.error('❌ Erro durante seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
