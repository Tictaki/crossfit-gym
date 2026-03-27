import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notifier';

export async function GET(request, { params }) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  try {
    const member = await prisma.member.findUnique({
      where: { id: params.id },
      include: {
        plan: true,
        payments: { include: { plan: true, user: { select: { name: true } } }, orderBy: { paymentDate: 'desc' } },
        checkins: { orderBy: { checkinDatetime: 'desc' }, take: 50 }
      }
    });
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    return NextResponse.json(member);
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json({ error: 'Erro ao carregar membro', message: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  try {
    const contentType = request.headers.get('content-type') || '';
    let body, photoUrl;

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

    const { name, phone, whatsapp, email, birthDate, gender, notes, enrollmentDate, startDate, expirationDate } = body;
    const updateData = {
      name, phone, whatsapp: whatsapp || null, email: email === '' ? null : email,
      birthDate: birthDate ? new Date(birthDate) : undefined, gender, notes,
      enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      expirationDate: expirationDate ? new Date(expirationDate) : undefined
    };
    if (photoUrl !== undefined && photoUrl !== null) updateData.photo = photoUrl;

    const member = await prisma.member.update({ where: { id: params.id }, data: updateData, include: { plan: true } });
    await notify({ action: 'UPDATE', message: `Dados do membro atualizados: ${member.name}`, actorId: user.id, entity: 'MEMBER', entityId: member.id });
    return NextResponse.json(member);
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  try {
    const { id } = params;
    await prisma.$transaction(async (tx) => {
      await tx.checkin.deleteMany({ where: { memberId: id } });
      await tx.payment.deleteMany({ where: { memberId: id } });
      await tx.member.delete({ where: { id } });
    });

    await notify({ action: 'DELETE', message: `Membro eliminado permanentemente: ID #${id.substring(0, 8)}`, actorId: user.id, entity: 'MEMBER', entityId: id });
    return NextResponse.json({ message: 'Membro eliminado com sucesso' });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json({ error: 'Erro ao eliminar membro' }, { status: 500 });
  }
}
