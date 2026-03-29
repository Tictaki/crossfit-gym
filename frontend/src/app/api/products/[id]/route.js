export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notifier';
import { replaceFile, deleteFile } from '@/lib/storage';

// Helper to get current product photo URL for replacement
async function getProductPhotoUrl(id) {
  const p = await prisma.product.findUnique({ where: { id }, select: { photo: true } });
  return p?.photo;
}

export async function PUT(request, { params }) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  try {
    const contentType = request.headers.get('content-type') || '';
    let body, photoUrl;
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
      const imageFile = formData.get('photo');
      if (imageFile && imageFile.size > 0) {
        try {
          const oldPhotoUrl = await getProductPhotoUrl(params.id);
          photoUrl = await replaceFile(oldPhotoUrl, imageFile, 'products', imageFile.name);
        } catch (uploadError) {
          console.error('Product image replacement failed:', uploadError);
          throw new Error('Erro ao atualizar a imagem do produto.');
        }
      }
    } else {
      body = await request.json();
    }

    const { name, commercialName, description, price, stock, category, packageSize, sku, status } = body;
    const parseNum = (v, isInt = false) => { if (!v || v === 'null') return undefined; const p = isInt ? parseInt(v) : parseFloat(v); return isNaN(p) ? undefined : p; };

    const updateData = { name, commercialName, description, category, packageSize, sku, status: status === 'true' || status === true };
    if (price !== undefined) updateData.price = parseNum(price) ?? undefined;
    if (stock !== undefined) updateData.stock = parseNum(stock, true) ?? undefined;
    if (photoUrl) updateData.photo = photoUrl;

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
    
    const product = await prisma.product.findUnique({ where: { id: params.id }, select: { photo: true } });
    await prisma.product.delete({ where: { id: params.id } });
    
    if (product?.photo) {
      await deleteFile(product.photo, 'products');
    }
    await notify({ action: 'DELETE', message: `Produto removido: ID #${params.id.substring(0, 8)}`, actorId: user.id, entity: 'PRODUCT', entityId: params.id });
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
