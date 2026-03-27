export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  try {
    const today = new Date();
    const defaulters = await prisma.member.findMany({
      where: { status: 'INACTIVE', expirationDate: { lt: today } },
      include: { plan: true },
      orderBy: { expirationDate: 'asc' }
    });
    return NextResponse.json(defaulters);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch defaulters report' }, { status: 500 });
  }
}
