import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(request) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  try {
    const contentType = request.headers.get('content-type') || '';
    let body;
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
      // TODO: Phase 4 — upload background to Supabase Storage
    } else {
      body = await request.json();
    }
    const { key = 'background_image', value } = body;
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
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || 'background_image';
    await prisma.setting.delete({ where: { key } });
    return NextResponse.json({ message: 'Background image removed', key });
  } catch (error) {
    if (error.code === 'P2025') return NextResponse.json({ message: 'Background image already removed' });
    return NextResponse.json({ error: 'Failed to remove background image' }, { status: 500 });
  }
}
