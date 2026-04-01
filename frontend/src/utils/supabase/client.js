import { createBrowserClient } from '@supabase/ssr'

/**
 * Mock client to prevent build-time crashes during Next.js pre-rendering
 * when environment variables are missing.
 */
const mockSupabaseClient = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithOAuth: async () => ({ 
      data: { url: '#' }, 
      error: { message: 'Configuração do Supabase ausente. Verifique as variáveis de ambiente.' } 
    }),
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

  if (!url || !key) {
    console.warn('⚠️ Supabase Browser Client: Environment variables missing. Using mock client.');
    return mockSupabaseClient;
  }

  return createBrowserClient(url, key);
}
