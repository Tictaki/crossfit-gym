import prisma from './src/utils/prisma.js';

async function testRoute() {
  console.log('--- ROUTE LOGIC TEST START ---');
  try {
    const search = '';
    const status = '';
    const page = 1;
    const limit = 20;

    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { whatsapp: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // The logic in members.routes.js:
    if (status) { // if "" this is false
       where.status = status;
    }

    console.log('Query where:', JSON.stringify(where));

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('Executing findMany...');
    const members = await prisma.member.findMany({
      where,
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });
    console.log('✅ findMany success, count:', members.length);

    console.log('Executing count...');
    const total = await prisma.member.count({ where });
    console.log('✅ count success:', total);

  } catch (error) {
    console.error('❌ ROUTE LOGIC FAILED:', error);
  } finally {
    await prisma.$disconnect();
    console.log('--- ROUTE LOGIC TEST END ---');
  }
}

testRoute();
