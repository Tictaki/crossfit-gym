import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Verificando dados no banco...\n');
    
    // Check users
    const users = await prisma.user.findMany();
    console.log(`👥 Utilizadores: ${users.length}`);
    users.forEach(u => console.log(`   - ${u.name} (${u.email}) - ${u.role}`));
    
    // Check members
    const members = await prisma.member.findMany();
    console.log(`\n👤 Membros: ${members.length}`);
    if (members.length > 0) {
      members.slice(0, 5).forEach(m => console.log(`   - ${m.name} (${m.phone})`));
      if (members.length > 5) console.log(`   ... e mais ${members.length - 5}`);
    }
    
    // Check plans
    const plans = await prisma.plan.findMany();
    console.log(`\n📋 Planos: ${plans.length}`);
    plans.forEach(p => console.log(`   - ${p.name} (${p.price} MZN)`));
    
    // Check payments
    const payments = await prisma.payment.findMany();
    console.log(`\n💰 Pagamentos: ${payments.length}`);
    
    // Check products
    const products = await prisma.product.findMany();
    console.log(`\n🛍️ Produtos: ${products.length}`);
    
    // Check sales
    const sales = await prisma.sale.findMany();
    console.log(`\n🎫 Vendas: ${sales.length}`);
    
    console.log('\n✅ Verificação completa!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
