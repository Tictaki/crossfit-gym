export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, send to dashboard
  if (user) {
    redirect('/dashboard');
  }

  // Otherwise, send to login
  redirect('/login');
  
  // This part will never be reached because of the redirects, 
  // but we return a fragment for valid React component structure
  return null;
}
