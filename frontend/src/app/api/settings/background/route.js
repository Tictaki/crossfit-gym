export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { uploadFile, replaceFile, deleteFile } from '@/lib/storage';

// Helper to get current setting value for replacement
async function getSettingValue(key) {
  const s = await prisma.setting.findUnique({ where: { key }, select: { value: true } });
  return s?.value;
}

export async function POST(request) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  try {
    const contentType = request.headers.get('content-type') || '';
    let body, photoUrl = null, key = 'background_image';
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
      const imageFile = formData.get('background') || formData.get('photo');
      if (imageFile && imageFile.size > 0) {
        try {
          const oldUrl = await getSettingValue(key);
          photoUrl = await replaceFile(oldUrl, imageFile, 'settings', imageFile.name);
        } catch (uploadError) {
          console.error('Background upload failed:', uploadError);
          throw new Error('Erro ao fazer upload da imagem de fundo.');
        }
      }
    } else {
      body = await request.json();
    }
    
    const value = photoUrl || body.value;
    if (!value) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
    return NextResponse.json({ backgroundImage: value, key });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update background image' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  try {
    const { searchParams } = request.nextUrl;
    const key = searchParams.get('key') || 'background_image';
    const setting = await prisma.setting.findUnique({ where: { key }, select: { value: true } });
    await prisma.setting.delete({ where: { key } });
    if (setting?.value) {
      await deleteFile(setting.value, 'settings');
    }
    return NextResponse.json({ message: 'Background image removed', key });
  } catch (error) {
    if (error.code === 'P2025') return NextResponse.json({ message: 'Background image already removed' });
    return NextResponse.json({ error: 'Failed to remove background image' }, { status: 500 });
  }
}
