import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users', message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  let user;
  try { user = await requireAuth(); } catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  try {
    const { name, email, password, role } = await request.json();
    if (!name || !email || !password || !role) return NextResponse.json({ error: 'Missing required fields', required: ['name', 'email', 'password', 'role'] }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({ data: { name, email, password: hashedPassword, role }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Email already exists', field: error.meta?.target?.[0] }, { status: 409 });
    return NextResponse.json({ error: 'Failed to create user', message: error.message }, { status: 500 });
  }
}
