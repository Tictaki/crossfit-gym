import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notifier';

export async function PUT(request, { params }) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  try {
    const contentType = request.headers.get('content-type') || '';
    let body;
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = await request.json();
    }

    const { name, commercialName, description, price, stock, category, packageSize, sku, status } = body;
    const parseNum = (v, isInt = false) => { if (!v || v === 'null') return undefined; const p = isInt ? parseInt(v) : parseFloat(v); return isNaN(p) ? undefined : p; };

    const updateData = { name, commercialName, description, category, packageSize, sku, status: status === 'true' || status === true };
    if (price !== undefined) updateData.price = parseNum(price) ?? undefined;
    if (stock !== undefined) updateData.stock = parseNum(stock, true) ?? undefined;

    const product = await prisma.product.update({ where: { id: params.id }, data: updateData });
    await notify({ action: 'UPDATE', message: `Produto atualizado: ${product.name}`, actorId: user.id, entity: 'PRODUCT', entityId: product.id });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar produto', message: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  try {
    const salesCount = await prisma.sale.count({ where: { productId: params.id } });
    if (salesCount > 0) return NextResponse.json({ error: 'Cannot delete product with sales history. Deactivate it instead.' }, { status: 400 });
    await prisma.product.delete({ where: { id: params.id } });
    await notify({ action: 'DELETE', message: `Produto removido: ID #${params.id.substring(0, 8)}`, actorId: user.id, entity: 'PRODUCT', entityId: params.id });
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
