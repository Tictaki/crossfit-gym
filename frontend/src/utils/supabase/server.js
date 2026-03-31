import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Mock client to prevent build-time crashes during Next.js pre-rendering
 * when environment variables are missing.
 */
const mockSupabaseClient = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  storage: { from: () => ({ upload: async () => ({ error: new Error('Mock client') }) }) },
  from: () => ({
    select: () => ({
      eq: () => ({ single: async () => ({ data: null, error: null }), maybeSingle: async () => ({ data: null, error: null }) }),
      order: () => ({ limit: async () => ({ data: [], error: null }) }),
    }),
  }),
};

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Next.js 14 Build-time Guard
  if (!url || !key) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Supabase Server Client: Environment variables missing. Using mock client for build.');
    }
    return mockSupabaseClient;
  }

  // Handle the cookies store safely
  let cookieStore;
  try {
    cookieStore = cookies();
  } catch (e) {
    // If cookies() is called outside of a request context, use the mock
    return mockSupabaseClient;
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
