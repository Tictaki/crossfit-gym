export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notifier';

// Receipt PDF
export async function GET(request, { params }) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: { member: true, plan: true, user: { select: { name: true } }, invoice: true }
    });

    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    if (payment.invoice?.status === 'CANCELLED') return NextResponse.json({ error: 'This invoice has been cancelled', reason: payment.invoice.cancelReason }, { status: 400 });

    // Return payment data for client-side PDF generation
    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json({ error: 'Failed to fetch receipt' }, { status: 500 });
  }
}
