export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  try {
    const { searchParams } = request.nextUrl;
    const formatType = searchParams.get('format') || 'json';

    // Revenue by plan
    const revenueByPlan = await prisma.payment.groupBy({ by: ['planId'], _sum: { amount: true }, _count: true });
    const plansData = await Promise.all(revenueByPlan.map(async (item) => {
      const plan = await prisma.plan.findUnique({ where: { id: item.planId } });
      return { Plano: plan?.name || 'Desconhecido', 'Receita (MZN)': parseFloat(item._sum.amount), 'Qtd. Pagamentos': item._count };
    }));

    // Defaulters
    const today = new Date();
    const defaultersData = await prisma.member.findMany({ where: { status: 'INACTIVE', expirationDate: { lt: today } }, include: { plan: true }, orderBy: { expirationDate: 'asc' } });
    const defaultersMapped = defaultersData.map(m => ({ Nome: m.name, Telefone: m.phone, Plano: m.plan?.name || 'N/A', 'Expirou em': new Date(m.expirationDate).toLocaleDateString('pt-PT') }));

    // Stats
    const [activeMembers, inactiveMembers, totalProducts] = await Promise.all([
      prisma.member.count({ where: { status: 'ACTIVE' } }),
      prisma.member.count({ where: { status: 'INACTIVE' } }),
      prisma.product.count({ where: { status: true } })
    ]);

    return NextResponse.json({ plansData, defaulters: defaultersMapped, stats: { activeMembers, inactiveMembers, totalProducts } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate exported report' }, { status: 500 });
  }
}
