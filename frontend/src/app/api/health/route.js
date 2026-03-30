import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    env: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'missing',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL
    },
    database: { status: 'testing', error: null },
    auth: { status: 'testing', error: null }
  };

  // 1. Test Database
  try {
    const userCount = await prisma.user.count();
    diagnostics.database.status = 'connected';
    diagnostics.database.userCount = userCount;
  } catch (err) {
    diagnostics.database.status = 'error';
    diagnostics.database.error = err.message;
    diagnostics.database.code = err.code;
  }

  // 2. Test Supabase Client
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    diagnostics.auth.status = user ? 'authenticated' : 'not_authenticated';
    if (authError) diagnostics.auth.error = authError.message;
  } catch (err) {
    diagnostics.auth.status = 'error';
    diagnostics.auth.error = err.message;
  }

  const overallStatus = (diagnostics.database.status === 'connected' && diagnostics.auth.status !== 'error') ? 200 : 500;
  
  return NextResponse.json(diagnostics, { status: overallStatus });
}
