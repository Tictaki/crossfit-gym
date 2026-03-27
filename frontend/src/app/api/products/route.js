import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notifier';
import { networkInterfaces } from 'os';

// List products
export async function GET(request) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const where = {};
    if (category) where.category = category;
    if (search) where.name = { contains: search, mode: 'insensitive' };
    const products = await prisma.product.findMany({ where, orderBy: { name: 'asc' } });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// Create product
export async function POST(request) {
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

    const { name, commercialName, description, price, stock, category, packageSize, sku } = body;
    const parseNum = (v, isInt = false) => { if (!v || v === 'null' || v === 'undefined') return isInt ? 0 : 0.0; const p = isInt ? parseInt(v) : parseFloat(v); return isNaN(p) ? 0 : p; };

    const product = await prisma.product.create({ data: { name, commercialName, description, price: parseNum(price), stock: parseNum(stock, true), category, packageSize, sku, photo: null } });
    await notify({ action: 'CREATE', message: `Novo produto adicionado: ${product.name}`, actorId: user.id, entity: 'PRODUCT', entityId: product.id });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar produto', message: error.message }, { status: 500 });
  }
}
