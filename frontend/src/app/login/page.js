'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { UserIcon, LockClosedIcon, ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuickLogin = async (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(quickEmail, quickPassword);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    handleQuickLogin(email, password);
  };

  return (
    <div className="min-h-dvh flex w-full relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 right-1/3 w-64 h-64 bg-primary-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="relative z-10 max-w-lg">
          {/* Logo with Glow */}
          <div className="mb-12 flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-red-500 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative h-32 w-32 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl transform group-hover:scale-110 transition-transform duration-500">
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain brightness-0 invert" 
                />
              </div>
            </div>
          </div>

          {/* Title with Gradient */}
          <h1 className="text-5xl font-black mb-6 text-center bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent animate-gradient">
            Crosstraining Gym
          </h1>
          
          <p className="text-xl text-gray-300 text-center leading-relaxed mb-8 font-light">
            Sistema de gestão premium para controlo total do seu ginásio
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 justify-center">
            {['Membros', 'Pagamentos', 'Relatórios', 'Produtos'].map((feature) => (
              <div key={feature} className="px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-sm text-gray-300 font-medium hover:bg-white/10 transition-colors cursor-default">
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-md relative z-10">
          {/* Glass Card */}
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 md:p-10 border border-white/20 shadow-2xl">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 rounded-full border border-primary-500/20 mb-4">
                <SparklesIcon className="h-4 w-4 text-primary-400" />
                <span className="text-xs font-bold text-primary-300 uppercase tracking-wider">Acesso Seguro</span>
              </div>
              <h2 className="text-3xl font-black text-white mb-2">Bem-vindo! 👋</h2>
              <p className="text-gray-400 font-medium">Inicie sessão para continuar</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-2xl flex items-center gap-3 animate-shake">
                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">⚠️</span>
                </div>
                <p className="text-red-200 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider ml-1">E-mail</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-red-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center">
                    <UserIcon className="absolute left-4 h-5 w-5 text-gray-400 group-hover:text-primary-400 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:bg-white/10 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider ml-1">Palavra-passe</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-red-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center">
                    <LockClosedIcon className="absolute left-4 h-5 w-5 text-gray-400 group-hover:text-primary-400 transition-colors" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:bg-white/10 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full mt-8 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-red-500 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-gradient-to-r from-primary-600 to-red-500 rounded-2xl py-4 px-6 font-bold text-white shadow-xl transform group-hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Acedendo...</span>
                    </>
                  ) : (
                    <>
                      <span>Iniciar Sessão</span>
                      <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Quick Access */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center mb-3">Acesso Rápido</p>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => handleQuickLogin('gerente@crosstraininggym.com', 'Admin#Master2026')}
                  className="flex-1 py-2.5 px-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-300 text-xs font-bold uppercase tracking-wider transition-all hover:scale-105"
                >
                  Admin
                </button>
                <button 
                  type="button"
                  onClick={() => handleQuickLogin('equipa@crosstraininggym.com', 'Staff@Gym2026')}
                  className="flex-1 py-2.5 px-4 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-yellow-300 text-xs font-bold uppercase tracking-wider transition-all hover:scale-105"
                >
                  Receção
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-500 text-xs mt-6 font-medium">
            © 2026 Crosstraining Gym. Powered by <span className="text-primary-400 font-bold">IDesignmoz</span>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
          50% { opacity: 0.3; }
          100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-float {
          animation: float linear infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-shake {
          animation: shake 0.5s ease;
        }
      `}</style>
    </div>
  );
}
