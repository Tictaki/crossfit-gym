export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notifier';

export async function GET() {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  try {
    const fixedCosts = await prisma.fixedCost.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(fixedCosts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fixed costs' }, { status: 500 });
  }
}

export async function POST(request) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  try {
    const { description, amount, category, invoiceNumber, dueDate } = await request.json();
    if (!description || !amount || !category) return NextResponse.json({ error: 'Description, amount, and category are required' }, { status: 400 });
    const fixedCost = await prisma.fixedCost.create({ data: { description, amount: parseFloat(amount), category, invoiceNumber, dueDate: dueDate ? new Date(dueDate) : null } });
    await notify({ action: 'CREATE', message: `Novo custo fixo: ${fixedCost.description} (${fixedCost.amount} MZN)`, actorId: user.id, entity: 'FIXED_COST', entityId: fixedCost.id });
    return NextResponse.json(fixedCost, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create fixed cost' }, { status: 500 });
  }
}
