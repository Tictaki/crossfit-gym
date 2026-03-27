export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import xlsx from 'xlsx';

export async function GET(request) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where = {};
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }

    const payments = await prisma.payment.findMany({
      where,
      include: { member: { select: { name: true, phone: true } }, plan: { select: { name: true } }, user: { select: { name: true } } },
      orderBy: { paymentDate: 'desc' }
    });

    const data = payments.map(p => ({
      'Data': p.paymentDate.toLocaleDateString('pt-PT'),
      'Membro': p.member.name,
      'Telefone': p.member.phone,
      'Plano': p.plan.name,
      'Valor': parseFloat(p.amount),
      'Método': p.paymentMethod,
      'Processado por': p.user.name
    }));

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Pagamentos');
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=payments.xlsx'
      }
    });
  } catch (error) {
    console.error('Error exporting payments:', error);
    return NextResponse.json({ error: 'Failed to export payments' }, { status: 500 });
  }
}
