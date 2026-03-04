'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserIcon, 
  ArrowLeftOnRectangleIcon, 
  ChevronDownIcon,
  Cog6ToothIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { UPLOAD_URL, getImageUrl } from '@/lib/api';
import NotificationBell from './NotificationBell';

const Header = ({ user, setSidebarOpen }) => {
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
    <header className="bg-transparent z-40 relative">
      <div className="flex items-center justify-between glass-panel !rounded-2xl !p-3 shadow-glass-premium transition-all duration-300">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2.5 rounded-xl glass-button text-dark-800 dark:text-gray-200 active:scale-90"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex flex-col pl-2 lg:pl-0">
            <h2 className="text-sm md:text-base font-bold text-dark-900 dark:text-white tracking-tight leading-tight">
              Olá, <span className="text-primary-600 dark:text-primary-500">{user?.name?.split(' ')[0] || 'Utilizador'}</span> 👋
            </h2>
            <p className="text-[10px] sm:text-xs font-semibold text-dark-500 dark:text-dark-300 uppercase tracking-widest">{user?.role?.toLowerCase()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <NotificationBell />
          
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 md:gap-3 p-1 rounded-2xl glass-button hover:bg-white/50 dark:hover:bg-dark-800/70 transition-all duration-300 group"
          >
            <div className="h-9 w-9 md:h-11 md:w-11 rounded-full p-[2px] bg-gradient-to-br from-primary-400 to-primary-600 shadow-premium overflow-hidden transition-transform duration-300 group-active:scale-90">
              <div className="h-full w-full rounded-full bg-white dark:bg-dark-800 flex items-center justify-center overflow-hidden">
                {user?.photo ? (
                  <img 
                    src={getImageUrl(user.photo)} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      // On error, show initials instead
                      e.target.style.display = 'none';
                      if (e.target.nextElement) e.target.nextElement.style.display = 'block';
                      else {
                        e.target.parentElement.innerHTML = `<span class="font-bold text-primary-600 dark:text-primary-500 text-lg">${user?.name?.[0] || 'U'}</span>`;
                      }
                    }}
                  />
                ) : null}
                <span className="font-bold text-primary-600 dark:text-primary-500 text-base md:text-lg">
                  {user?.name?.[0] || 'U'}
                </span>
              </div>
            </div>
            <ChevronDownIcon className={`h-4 w-4 text-dark-400 dark:text-dark-300 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Glass Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-3 w-56 glass-strong rounded-2xl animate-fade-in z-50 overflow-hidden border border-white/40 dark:border-white/10">
              <div className="p-4 border-b border-white/30 dark:border-white/10">
                <p className="text-sm font-bold text-dark-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-dark-500 dark:text-dark-400 truncate">{user?.email}</p>
              </div>
              <div className="p-2">
                <button 
                  onClick={() => { router.push('/dashboard/settings'); setIsDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-dark-700 dark:text-dark-300 glass-button rounded-xl transition-all duration-200 group hover:bg-white/50 dark:hover:bg-dark-700/70"
                >
                  <Cog6ToothIcon className="h-5 w-5 text-dark-400 dark:text-dark-300 group-hover:text-dark-900 dark:group-hover:text-white transition-colors" />
                  Configurações
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 glass-button rounded-xl transition-all duration-200 group hover:bg-red-100/60 dark:hover:bg-red-950/40"
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 text-red-500 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors" />
                  Sair do Sistema
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default memo(Header);
