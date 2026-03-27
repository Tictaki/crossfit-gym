import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

/**
 * Authenticate a request using Supabase session cookies.
 * Returns the Prisma User object or null.
 */
export async function getAuthenticatedUser() {
  const supabase = createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser) return null;

  const dbUser = await prisma.user.findUnique({
    where: { email: supabaseUser.email },
    select: { id: true, name: true, email: true, role: true, photo: true }
  });

  return dbUser;
}

/**
 * Guard helper — returns user or throws a 401 NextResponse.
 */
export async function requireAuth() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}
