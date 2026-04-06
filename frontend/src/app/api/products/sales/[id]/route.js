export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notifier';

// Reverse (revert) a sale — restores stock and deletes the sale record
export async function DELETE(request, { params }) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  // Only ADMIN can reverse sales
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only administrators can reverse sales' }, { status: 403 });
  }

  try {
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: { product: true },
      });

      if (!sale) throw new Error('Sale not found');

      // Restore stock
      await tx.product.update({
        where: { id: sale.productId },
        data: { stock: sale.product.stock + sale.quantity },
      });

      // Delete the sale record
      await tx.sale.delete({ where: { id } });

      return sale;
    });

    await notify({
      action: 'CREATE',
      message: `Venda revertida: ${result.quantity}x ${result.product.name} (${result.totalAmount} MZN) — stock reposto`,
      actorId: user.id,
      entity: 'PRODUCT',
      entityId: result.productId,
    });

    return NextResponse.json({ message: 'Sale reversed successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to reverse sale' }, { status: 400 });
  }
}
