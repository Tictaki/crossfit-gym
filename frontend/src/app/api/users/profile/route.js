export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { replaceFile } from '@/lib/storage';

// Helper to get current user photo URL for replacement
async function getUserPhotoUrl(id) {
  const u = await prisma.user.findUnique({ where: { id }, select: { photo: true } });
  return u?.photo;
}

// Update own profile
export async function PUT(request) {
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
        try {
          const oldUrl = await getUserPhotoUrl(user.id);
          photoUrl = await replaceFile(oldUrl, photoFile, 'users', photoFile.name);
        } catch (uploadError) {
          console.error('Profile photo upload failed:', uploadError);
          throw new Error('Erro ao fazer upload da foto de perfil.');
        }
      }
    } else {
      body = await request.json();
    }
    const { name, email, password } = body;
    const value = photoUrl || body.photo; // Use photoUrl if uploaded, or body.photo if provided as string (rare here)
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (photoUrl) updateData.photo = photoUrl;

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
