import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(request, { params }) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  try {
    const { name, email, role, password } = await request.json();
    const updateData = { name, email, role };
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.user.update({ where: { id: params.id }, data: updateData, select: { id: true, name: true, email: true, role: true, createdAt: true } });
    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
