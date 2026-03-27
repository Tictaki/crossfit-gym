export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notifier';

// Record a sale
export async function POST(request) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  try {
    const { productId, quantity, totalAmount, paymentMethod } = await request.json();

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error('Product not found');
      if (product.stock < quantity) throw new Error(`Insufficient stock. Available: ${product.stock}`);

      const sale = await tx.sale.create({
        data: { productId, quantity: parseInt(quantity), totalAmount, paymentMethod, processedBy: user.id },
        include: { product: true, seller: { select: { name: true } } }
      });

      await tx.product.update({ where: { id: productId }, data: { stock: product.stock - parseInt(quantity) } });
      return sale;
    });

    await notify({ action: 'CREATE', message: `Venda: ${quantity}x ${result.product.name} (${totalAmount} MZN)`, actorId: user.id, entity: 'PRODUCT', entityId: result.productId });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to record sale' }, { status: 400 });
  }
}

// List sales
export async function GET() {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  try {
    const sales = await prisma.sale.findMany({ include: { product: true, seller: { select: { name: true } } }, orderBy: { saleDate: 'desc' }, take: 100 });
    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}
