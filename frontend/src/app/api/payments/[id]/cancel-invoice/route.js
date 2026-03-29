export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notifier';

export async function POST(request, { params }) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Only administrators can cancel invoices' }, { status: 403 });

  try {
    const { reason } = await request.json();
    if (!reason || reason.trim().length === 0) return NextResponse.json({ error: 'Reason for cancellation is required' }, { status: 400 });

    const payment = await prisma.payment.findUnique({ where: { id: params.id }, include: { invoice: true, member: true } });
    if (!payment || !payment.invoice) return NextResponse.json({ error: 'Payment or invoice not found' }, { status: 404 });
    if (payment.invoice.status === 'CANCELLED') return NextResponse.json({ error: 'Invoice already cancelled' }, { status: 400 });

    const cancelled = await prisma.$transaction(async (tx) => {
      const updatedInvoice = await tx.invoice.update({ where: { id: payment.invoice.id }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason } });
      await tx.paymentAudit.create({ data: { paymentId: params.id, action: 'CANCELLED', details: `Invoice cancelled: ${reason}`, performedBy: user.id } });
      return updatedInvoice;
    });

    await notify({ action: 'WARNING', message: `Fatura cancelada: #${payment.receiptNumber} - ${payment.member?.name}`, actorId: user.id, entity: 'PAYMENT', entityId: params.id });
    return NextResponse.json({ invoice: cancelled, message: 'Invoice cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling invoice:', error);
    return NextResponse.json({ error: 'Failed to cancel invoice' }, { status: 500 });
  }
}
