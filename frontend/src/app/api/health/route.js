import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    database: { status: 'unknown', error: null, userCount: 0 },
    auth: { status: 'unknown', error: null, authenticated: false },
    env: {
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING',
      supabase_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING',
      database_url: process.env.DATABASE_URL ? (process.env.DATABASE_URL.includes('pooler') ? 'POOLER_DETECTED' : 'DIRECT_DETECTED') : 'MISSING',
      api_url: process.env.NEXT_PUBLIC_API_URL || 'RELATIVE_DEFAULT',
    }
  };

  try {
    // 1. Test Prisma Database Connection
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }
    const userCount = await prisma.user.count();
    diagnostics.database.status = 'connected';
    diagnostics.database.userCount = userCount;
  } catch (error) {
    diagnostics.database.status = 'failed';
    diagnostics.database.error = error.message;
  }

  try {
    // 2. Test Supabase SSR Presence
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      diagnostics.auth.status = 'auth_error';
      diagnostics.auth.error = authError.message;
    } else {
      diagnostics.auth.status = user ? 'authenticated' : 'not_authenticated';
      diagnostics.auth.authenticated = !!user;
      if (!user) diagnostics.auth.error = 'Auth session missing!';
    }
  } catch (error) {
    diagnostics.auth.status = 'failed';
    diagnostics.auth.error = error.message;
  }

  const status = (diagnostics.database.status === 'connected') ? 200 : 503;
  return NextResponse.json(diagnostics, { status });
}
