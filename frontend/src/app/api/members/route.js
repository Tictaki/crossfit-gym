import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notifier';
import { updateMemberStatuses } from '@/lib/autoUpdateStatus';

export async function GET(request) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  try {
    try { await updateMemberStatuses(); } catch {}

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { whatsapp: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [members, total] = await Promise.all([
      prisma.member.findMany({ where, include: { plan: true }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.member.count({ where })
    ]);

    return NextResponse.json({ members, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Failed to fetch members', message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  try {
    const contentType = request.headers.get('content-type') || '';
    let body, photoUrl = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
      const photoFile = formData.get('photo');
      if (photoFile && photoFile.size > 0) {
        // TODO: Phase 4 — upload to Supabase Storage
        photoUrl = null;
      }
    } else {
      body = await request.json();
    }

    const { name, phone, whatsapp, email, birthDate, gender, notes, planId, paymentMethod, enrollmentDate, startDate } = body;

    const existingMember = await prisma.member.findUnique({ where: { phone } });
    if (existingMember) return NextResponse.json({ error: 'Este número de telefone já está registado' }, { status: 400 });

    if (!name || !phone || !gender) return NextResponse.json({ error: 'Nome, telefone e sexo são obrigatórios' }, { status: 400 });
    if (!birthDate) return NextResponse.json({ error: 'Data de nascimento é obrigatória' }, { status: 400 });

    const today = new Date();
    let memberData = {
      name, phone, whatsapp: whatsapp || null, email: email || null,
      birthDate: birthDate ? new Date(birthDate) : null, gender, photo: photoUrl, notes,
      enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : today, status: 'INACTIVE'
    };

    if (planId) {
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });

      const result = await prisma.$transaction(async (tx) => {
        const actualStartDate = startDate ? new Date(startDate) : today;
        const expirationDate = new Date(actualStartDate);
        expirationDate.setDate(expirationDate.getDate() + plan.durationDays);

        const newMember = await tx.member.create({
          data: { ...memberData, planId, startDate: actualStartDate, expirationDate, status: 'ACTIVE' },
          include: { plan: true }
        });

        const payment = await tx.payment.create({
          data: { memberId: newMember.id, planId, amount: plan.price, paymentMethod: paymentMethod || 'CASH', processedBy: user.id }
        });

        await tx.invoice.create({ data: { paymentId: payment.id, invoiceNumber: payment.receiptNumber, issuedBy: user.id, status: 'ISSUED' } });
        await tx.paymentAudit.create({ data: { paymentId: payment.id, action: 'CREATED', details: `Registo inicial com plano ${plan.name}`, performedBy: user.id } });

        return newMember;
      });

      await notify({ action: 'CREATE', message: `Novo membro registado com plano: ${result.name}`, actorId: user.id, entity: 'MEMBER', entityId: result.id });
      return NextResponse.json(result, { status: 201 });
    }

    const member = await prisma.member.create({ data: memberData, include: { plan: true } });
    await notify({ action: 'CREATE', message: `Novo membro registado: ${member.name}`, actorId: user.id, entity: 'MEMBER', entityId: member.id });
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json({
      error: error.message?.includes('Unique constraint') ? 'Este número de telefone já está registado' : 'Erro ao criar membro',
      message: error.message
    }, { status: 500 });
  }
}
