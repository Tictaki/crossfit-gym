import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notifier';

export async function GET(request) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const where = {};
    if (startDate || endDate) { where.date = {}; if (startDate) where.date.gte = new Date(startDate); if (endDate) where.date.lte = new Date(endDate); }
    if (category) where.category = category;
    const skip = (page - 1) * limit;
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({ where, include: { user: { select: { name: true } } }, orderBy: { date: 'desc' }, skip, take: limit }),
      prisma.expense.count({ where })
    ]);
    return NextResponse.json({ expenses, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  try {
    const { description, amount, category, date, invoiceNumber, dueDate } = await request.json();
    const expense = await prisma.expense.create({
      data: { description, amount: parseFloat(amount), category, date: date ? new Date(date) : new Date(), dueDate: dueDate ? new Date(dueDate) : null, invoiceNumber: invoiceNumber || null, processedBy: user.id },
      include: { user: { select: { name: true } } }
    });
    await notify({ action: 'CREATE', message: `Nova despesa registada: ${expense.description} (${expense.amount} MZN)`, actorId: user.id, entity: 'EXPENSE', entityId: expense.id });
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create expense', details: error.message }, { status: 500 });
  }
}
