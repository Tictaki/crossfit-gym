'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserIcon, 
  ArrowLeftOnRectangleIcon, 
  ChevronDownIcon,
  Cog6ToothIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { UPLOAD_URL } from '@/lib/api';
import NotificationBell from './NotificationBell';

export default function Header({ user, setSidebarOpen }) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-transparent px-3 md:px-8 py-3 md:py-6 z-10 relative">
      <div className="flex items-center justify-between bg-white/60 dark:bg-dark-900/60 backdrop-blur-xl px-3 md:px-6 py-2.5 md:py-3 rounded-2xl shadow-glass border border-white/40 dark:border-dark-700/50">
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2.5 rounded-xl bg-white/50 dark:bg-dark-800/50 text-dark-600 dark:text-dark-300 hover:bg-white dark:hover:bg-dark-700 transition-all shadow-sm active:scale-90"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex flex-col">
            <h2 className="text-xs md:text-xl font-bold text-dark-900 dark:text-white tracking-tight leading-tight">
              Olá, <span className="text-primary-600 dark:text-primary-500">{user?.name?.split(' ')[0] || 'Utilizador'}</span> 👋
            </h2>
            <p className="text-[10px] md:text-xs font-semibold text-dark-400 dark:text-dark-200 uppercase tracking-widest opacity-80">{user?.role?.toLowerCase()}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 relative" ref={dropdownRef}>
          <NotificationBell />
          
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 p-1 rounded-2xl hover:bg-white/40 dark:hover:bg-dark-800/40 transition-all duration-300 group"
          >
            <div className="h-10 w-10 rounded-full bg-gradient-primary p-[2px] shadow-glow-sm">
              <div className="h-full w-full rounded-full bg-white dark:bg-dark-800 flex items-center justify-center overflow-hidden">
                {user?.photo ? (
                  <img 
                    src={`${UPLOAD_URL}${user.photo}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="font-bold text-primary-600 dark:text-primary-500 text-lg">
                    {user?.name?.[0] || 'U'}
                  </span>
                )}
              </div>
            </div>
            <ChevronDownIcon className={`h-4 w-4 text-dark-400 dark:text-dark-300 dark:text-dark-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Glass Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-3 w-56 dropdown-glass animate-fade-in z-50 overflow-hidden">
              <div className="p-4 border-b border-white/20 dark:border-dark-700/50 bg-white/20 dark:bg-dark-800/20">
                <p className="text-sm font-bold text-dark-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-dark-500 dark:text-dark-200 dark:text-dark-400 truncate">{user?.email}</p>
              </div>
              <div className="p-2">
                <button 
                  onClick={() => { router.push('/dashboard/settings'); setIsDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-dark-700 dark:text-dark-300 hover:bg-primary-500 hover:text-white rounded-xl transition-all duration-200 group"
                >
                  <Cog6ToothIcon className="h-5 w-5 text-dark-400 dark:text-dark-300 dark:text-dark-500 group-hover:text-white transition-colors" />
                  Configurações
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-200 group"
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 text-red-500 dark:text-red-400 group-hover:text-white transition-colors" />
                  Sair do Sistema
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
