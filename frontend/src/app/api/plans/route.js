import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notifier';

export async function GET(request) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive');
    const where = includeInactive === 'true' ? {} : { status: true };

    const plans = await prisma.plan.findMany({
      where,
      orderBy: { durationDays: 'asc' },
      include: { _count: { select: { members: true } } }
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

export async function POST(request) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  try {
    const { name, price, durationDays, description } = await request.json();

    const plan = await prisma.plan.create({
      data: {
        name,
        price: (price !== undefined && price !== '') ? parseFloat(price) : 0,
        durationDays: (durationDays !== undefined && durationDays !== '') ? parseInt(durationDays) : 30,
        description,
        status: true
      }
    });

    await notify({ action: 'CREATE', message: `Novo plano criado: ${plan.name}`, actorId: user.id, entity: 'PLAN', entityId: plan.id });
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}
