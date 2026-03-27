import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Update own profile
export async function PUT(request) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  try {
    const contentType = request.headers.get('content-type') || '';
    let body;
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = await request.json();
    }

    const { name, email, password } = body;
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, photo: true }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Erro ao atualizar perfil', message: error.message }, { status: 500 });
  }
}
