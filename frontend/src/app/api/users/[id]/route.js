export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { replaceFile, deleteFile } from '@/lib/storage';

// Helper to get current user photo URL for replacement
async function getUserPhotoUrl(id) {
  const u = await prisma.user.findUnique({ where: { id }, select: { photo: true } });
  return u?.photo;
}

export async function GET(request, { params }) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        photo: true,
        createdAt: true,
        lastLogin: true,
        status: true,
        processedPayments: { take: 5, orderBy: { paymentDate: 'desc' }, include: { member: { select: { name: true } } } },
        sales: { take: 5, orderBy: { saleDate: 'desc' }, include: { product: { select: { name: true } } } }
      }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Erro ao carregar utilizador' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  try {
    const contentType = request.headers.get('content-type') || '';
    let body, photoUrl;
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
      const photoFile = formData.get('photo');
      if (photoFile && photoFile.size > 0) {
        try {
          const oldUrl = await getUserPhotoUrl(params.id);
          photoUrl = await replaceFile(oldUrl, photoFile, 'users', photoFile.name);
        } catch (uploadError) {
          console.error('User photo replacement failed:', uploadError);
          throw new Error('Erro ao atualizar a foto do utilizador.');
        }
      }
    } else {
      body = await request.json();
    }

    const { name, email, role, password, status } = body;
    const updateData = { name, email, role };
    if (status) updateData.status = status;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (photoUrl) updateData.photo = photoUrl;

    const updatedUser = await prisma.user.update({ where: { id: params.id }, data: updateData, select: { id: true, name: true, email: true, role: true, photo: true, createdAt: true, status: true } });
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
    const userToDelete = await prisma.user.findUnique({ where: { id: params.id }, select: { photo: true } });
    await prisma.user.delete({ where: { id: params.id } });
    
    if (userToDelete?.photo) {
      await deleteFile(userToDelete.photo, 'users');
    }
    
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
