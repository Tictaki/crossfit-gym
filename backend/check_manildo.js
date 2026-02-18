import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkManildoPayments() {
  try {
    // Buscar membro com nome contendo "manildo"
    const member = await prisma.member.findMany({
      where: {
        name: {
          contains: 'manildo',
          mode: 'insensitive'
        }
      },
      include: {
        payments: {
          include: {
            plan: true,
            invoice: true
          }
        }
      }
    });

    if (member.length === 0) {
      console.log('❌ Nenhum membro encontrado com nome "manildo"');
      console.log('\nListando todos os membros:');
      const allMembers = await prisma.member.findMany({
        select: { id: true, name: true, status: true }
      });
      allMembers.forEach(m => {
        console.log(`- ID: ${m.id} | Nome: "${m.name.trim()}" | Status: ${m.status}`);
      });
      return;
    }

    console.log('✅ Membro encontrado:');
    member.forEach(m => {
      console.log(`\n📋 Nome: ${m.name.trim()}`);
      console.log(`   ID: ${m.id}`);
      console.log(`   Status: ${m.status}`);
      console.log(`   Pagamentos: ${m.payments.length}`);
      
      if (m.payments.length > 0) {
        console.log('\n   📄 Detalhes dos pagamentos:');
        m.payments.forEach((p, idx) => {
          console.log(`   ${idx + 1}. ID: ${p.id}`);
          console.log(`      Valor: ${p.amount} MZN`);
          console.log(`      Plano: ${p.plan?.name || 'N/A'}`);
          console.log(`      Data: ${new Date(p.paymentDate).toLocaleDateString('pt-PT')}`);
          console.log(`      Método: ${p.paymentMethod}`);
          console.log(`      Recibo: ${p.receiptNumber || 'N/A'}`);
          console.log(`      Invoice Status: ${p.invoice?.status || 'N/A'}`);
          console.log(`      URL Acesso: /api/payments/${p.id}/receipt?token=SEU_TOKEN`);
        });
      } else {
        console.log('\n   ⚠️  Nenhum pagamento registrado');
      }
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkManildoPayments();
