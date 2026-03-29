import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const supabase = createClient();

    // 1. Attempt to sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      // NOTE: For migration purposes, if the user doesn't exist in Supabase yet,
      // they MUST be created in the Supabase Dashboard or via a signup route.
      return NextResponse.json({ error: 'Invalid credentials. If this is your first login after migrating, please create your account in the Supabase Auth Dashboard with the same email.' }, { status: 401 });
    }

    // 2. Sync with Prisma User table
    let dbUser = await prisma.user.findUnique({
      where: { email: authData.user.email }
    });

    if (!dbUser) {
      // Automatically create the user in Prisma if they exist in Supabase Auth but not in our DB
      dbUser = await prisma.user.create({
        data: {
          id: authData.user.id, // Match Supabase Auth ID
          email: authData.user.email,
          name: authData.user.user_metadata?.name || email.split('@')[0],
          password: '', // We don't store passwords anymore
          role: email.includes('gerente') ? 'ADMIN' : 'RECEPTIONIST'
        }
      });
    }

    return NextResponse.json({
      token: authData.session.access_token, // Map Supabase token to the expected token field
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        photo: dbUser.photo
      }
    });

  } catch (error) {
    console.error('Login error detail:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
