import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard';

    if (code) {
      const supabase = createClient();
      
      // Exchange code for session
      const { error: authError, data: authData } = await supabase.auth.exchangeCodeForSession(code);

      if (authError || !authData.user) {
        console.error('OAuth Code Exchange Error:', authError);
        return NextResponse.redirect(`${origin}/login?error=auth_exchange_failed`);
      }

      const { user } = authData;
      const isAdminEmail = user.email.includes('gerente') || user.email === 'fauzia@crosstraining.com';

      // Verify or Sync User to Prisma
      let dbUser = await prisma.user.findUnique({
        where: { email: user.email }
      });

      if (!dbUser) {
        // Sign-up flow automatically handled
        console.log(`Creating new Prisma user from OAuth: ${user.email}`);
        
        dbUser = await prisma.user.create({
          data: {
            id: user.id, // match Supabase user UUID
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0],
            photo: user.user_metadata?.avatar_url || null,
            password: '', // Password not used for OAuth
            role: isAdminEmail ? 'ADMIN' : 'RECEPTIONIST',
            status: isAdminEmail ? 'ACTIVE' : 'PENDING'
          }
        });
      } else {
        // Update Admin role if it was a legacy regular user
        if (isAdminEmail && dbUser.role !== 'ADMIN') {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: { role: 'ADMIN', status: 'ACTIVE' }
          });
        }
        // Update photo if we have it from Google and we didn't have one
        if (!dbUser.photo && user.user_metadata?.avatar_url) {
           await prisma.user.update({
            where: { id: dbUser.id },
            data: { photo: user.user_metadata?.avatar_url }
           });
        }
      }

      // Check if user is approved
      if (dbUser.status === 'PENDING') {
        console.log(`User ${user.email} is pending approval.`);
        return NextResponse.redirect(`${origin}/login?error=pending_approval`);
      }

      if (dbUser.status === 'BANNED') {
        return NextResponse.redirect(`${origin}/login?error=account_banned`);
      }

      // Successful OAuth flow and Sync
      // Forward to next route which will be /dashboard
      return NextResponse.redirect(`${origin}${next}`);
    }

    // No code provided
    return NextResponse.redirect(`${origin}/login?error=no_code_provided`);

  } catch (error) {
    console.error('OAuth Callback Error:', error);
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/login?error=server_callback_error`);
  }
}
