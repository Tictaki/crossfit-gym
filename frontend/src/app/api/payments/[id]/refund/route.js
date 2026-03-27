import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notifier';

export async function POST(request, { params }) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  try {
    const { reason } = await request.json();
    if (!reason || reason.trim().length === 0) return NextResponse.json({ error: 'Reason for refund is required' }, { status: 400 });

    const payment = await prisma.payment.findUnique({ where: { id: params.id }, include: { invoice: true, member: true } });
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    if (payment.refunded) return NextResponse.json({ error: 'Payment already refunded' }, { status: 400 });

    const refund = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({ where: { id: params.id }, data: { refunded: true, refundedAt: new Date(), refundReason: reason } });
      if (payment.invoice) await tx.invoice.update({ where: { id: payment.invoice.id }, data: { status: 'REFUNDED' } });
      await tx.paymentAudit.create({ data: { paymentId: params.id, action: 'REFUNDED', details: `Refund processed: ${reason}`, performedBy: user.id } });
      return updatedPayment;
    });

    await notify({ action: 'WARNING', message: `Reembolso processado: ${payment.amount} MZN - ${payment.member?.name}`, actorId: user.id, entity: 'PAYMENT', entityId: params.id });
    return NextResponse.json({ refund, message: 'Refund processed successfully' });
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 });
  }
}
