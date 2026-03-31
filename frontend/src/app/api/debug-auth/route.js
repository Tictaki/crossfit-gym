import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    cookies: allCookies.map(c => ({ name: c.name, value: c.name.includes('sb-') ? '[REDACTED]' : c.value })),
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING',
    }
  };

  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    debugInfo.auth = {
      authenticated: !!user,
      email: user?.email,
      error: error?.message || null,
    };
  } catch (err) {
    debugInfo.auth = {
      error: 'Crashed: ' + err.message
    };
  }

  return NextResponse.json(debugInfo);
}
