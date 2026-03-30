export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        member: { select: { name: true, phone: true, email: true, photo: true } },
        plan: { select: { name: true, price: true, durationDays: true } },
        user: { select: { name: true } },
        invoice: true,
        audits: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error fetching payment details:', error);
    return NextResponse.json({ error: 'Failed to fetch payment details' }, { status: 500 });
  }
}
