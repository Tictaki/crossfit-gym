import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notifier';

export async function GET(request) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const paymentMethod = searchParams.get('paymentMethod');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where = {};
    if (memberId) where.memberId = memberId;
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }
    if (paymentMethod) where.paymentMethod = paymentMethod;

    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { member: { select: { name: true, phone: true } }, plan: { select: { name: true } }, user: { select: { name: true } } },
        orderBy: { paymentDate: 'desc' }, skip, take: limit
      }),
      prisma.payment.count({ where })
    ]);

    return NextResponse.json({ payments, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  try {
    const { memberId, planId, amount, paymentMethod, customDiscount } = await request.json();

    if (!memberId || !planId || !paymentMethod) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    // Duplicate check
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const existingPayment = await prisma.payment.findFirst({
      where: { memberId, planId, paymentDate: { gte: startOfDay, lte: endOfDay }, refunded: false }
    });
    if (existingPayment) return NextResponse.json({ error: 'Duplicate payment detected.', existingPaymentId: existingPayment.id }, { status: 400 });

    // Discount validation
    let finalAmount = parseFloat(plan.price);
    if (customDiscount) {
      const discount = parseFloat(customDiscount);
      const maxDiscount = parseFloat(plan.price) * 0.5;
      if (discount > maxDiscount) return NextResponse.json({ error: `Desconto máximo permitido: ${maxDiscount} MZN` }, { status: 400 });
      if (discount < 0) return NextResponse.json({ error: 'Desconto não pode ser negativo' }, { status: 400 });
      finalAmount = discount;
    }

    const MAX_SINGLE_PAYMENT = 500000;
    if (finalAmount > MAX_SINGLE_PAYMENT) return NextResponse.json({ error: `Valor máximo por transação: ${MAX_SINGLE_PAYMENT} MZN` }, { status: 400 });

    // Expiration
    const startDate = member.expirationDate && member.expirationDate > today ? member.expirationDate : today;
    const expirationDate = new Date(startDate);
    expirationDate.setDate(expirationDate.getDate() + plan.durationDays);

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: { memberId, planId, amount: finalAmount, paymentMethod, processedBy: user.id },
        include: { member: true, plan: true, user: { select: { name: true } } }
      });

      await tx.invoice.create({ data: { paymentId: payment.id, invoiceNumber: payment.receiptNumber, issuedBy: user.id, status: 'ISSUED' } });
      await tx.paymentAudit.create({ data: { paymentId: payment.id, action: 'CREATED', details: `Payment created: ${finalAmount} MZN via ${paymentMethod}`, performedBy: user.id } });
      await tx.member.update({ where: { id: memberId }, data: { planId, startDate: member.startDate || today, expirationDate, status: 'ACTIVE' } });

      return payment;
    });

    await notify({ action: 'CREATE', message: `Pagamento recebido: ${finalAmount} MZN - ${result.member.name} (${result.plan.name})`, actorId: user.id, entity: 'PAYMENT', entityId: result.id });
    return NextResponse.json({ payment: result, message: 'Payment registered successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
