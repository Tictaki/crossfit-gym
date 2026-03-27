export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { updateMemberStatuses } from '@/lib/autoUpdateStatus';

export async function GET(request) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const where = {};
    if (memberId) where.memberId = memberId;
    if (date) {
      const targetDate = new Date(date);
      where.checkinDatetime = { gte: new Date(targetDate.setHours(0,0,0,0)), lte: new Date(targetDate.setHours(23,59,59,999)) };
    }
    const skip = (page - 1) * limit;
    const [checkins, total] = await Promise.all([
      prisma.checkin.findMany({ where, include: { member: { select: { name: true, photo: true, status: true } } }, orderBy: { checkinDatetime: 'desc' }, skip, take: limit }),
      prisma.checkin.count({ where })
    ]);
    return NextResponse.json({ checkins, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 });
  }
}

export async function POST(request) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  try {
    const { memberId } = await request.json();
    await updateMemberStatuses();
    const member = await prisma.member.findUnique({ where: { id: memberId }, include: { plan: true } });
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    if (member.status === 'INACTIVE') return NextResponse.json({ error: 'Check-in denied', message: 'Membro com pagamento em atraso.', member: { name: member.name, status: member.status, expirationDate: member.expirationDate } }, { status: 403 });
    if (member.status === 'SUSPENDED') return NextResponse.json({ error: 'Check-in denied', message: 'Membro suspenso.', member: { name: member.name, status: member.status } }, { status: 403 });

    const checkin = await prisma.checkin.create({ data: { memberId }, include: { member: { select: { name: true, photo: true, plan: true, expirationDate: true } } } });
    return NextResponse.json({ checkin, message: `Bem-vindo, ${member.name}!` }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create check-in' }, { status: 500 });
  }
}
