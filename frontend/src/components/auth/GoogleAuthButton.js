'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { SparklesIcon } from '@heroicons/react/24/outline'; // Or use an SVG for Google logo

export default function GoogleAuthButton({ isSignup = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      // get the current origin to build the robust callback URL
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // This must match your authorized redirect URI in Google Console exactly
          redirectTo: `${origin}/api/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }
      
      // We don't change loading state back to false here, as the page will redirect to Google!

    } catch (err) {
      console.error('Google Auth Error:', err);
      setError(err.message || 'Erro ao comunicar com a Google.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-xl flex items-center gap-2">
          <span className="text-red-200 text-xs font-medium">{error}</span>
        </div>
      )}
      
      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl transition-all duration-300 group"
      >
        {loading ? (
          <div className="h-5 w-5 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-gray-200 font-semibold group-hover:text-white transition-colors">
              {isSignup ? 'Criar conta com Google' : 'Continuar com Google'}
            </span>
          </>
        )}
      </button>
    </div>
  );
}
