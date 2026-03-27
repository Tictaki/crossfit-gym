export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import QRCode from 'qrcode';

export async function GET(request, { params }) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  try {
    const member = await prisma.member.findUnique({ where: { id: params.id }, select: { id: true, name: true } });
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const qrCodeDataURL = await QRCode.toDataURL(member.id);
    return NextResponse.json({ qrCode: qrCodeDataURL, memberId: member.id, memberName: member.name });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}
