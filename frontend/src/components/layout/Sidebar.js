'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  UsersIcon,
  CreditCardIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  TagIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  ShoppingBagIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { memo, useMemo, useCallback, useState, useEffect } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Membros', href: '/dashboard/members', icon: UsersIcon },
  { name: 'Inadimplentes', href: '/dashboard/defaulters', icon: ExclamationTriangleIcon },
  { name: 'Planos', href: '/dashboard/plans', icon: TagIcon },
  { name: 'Contabilidade', href: '/dashboard/accounting', icon: BanknotesIcon },
  { name: 'Pagamentos', href: '/dashboard/payments', icon: CreditCardIcon },
  { name: 'Relatórios', href: '/dashboard/reports', icon: ChartBarIcon },
  { name: 'Produtos', href: '/dashboard/products', icon: ShoppingBagIcon },
  { name: 'Utilizadores', href: '/dashboard/users', icon: UserGroupIcon },
  { name: 'Configurações', href: '/dashboard/settings', icon: CogIcon },
];

const Sidebar = ({ isOpen, setIsOpen, user }) => {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  // Persist expanded preference in localStorage (optional pin state)
  const [isPinned, setIsPinned] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebarPinned') === 'true';
    }
    return false;
  });

  const isExpanded = isHovered || isPinned || isOpen;

  const filteredNavigation = useMemo(() => {
    return navigation.filter(item => {
      if (user?.role === 'RECEPTIONIST') {
        return !['Dashboard', 'Contabilidade', 'Relatórios', 'Pagamentos', 'Utilizadores'].includes(item.name);
      }
      return true;
    });
  }, [user?.role]);

  const handleNavClick = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const togglePin = useCallback(() => {
    setIsPinned(prev => {
      const next = !prev;
      localStorage.setItem('sidebarPinned', String(next));
      return next;
    });
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ width: isExpanded ? '260px' : '80px' }}
        className={`
          fixed top-0 left-0 h-screen z-[90]
          bg-white/40 dark:bg-dark-900/40 backdrop-blur-2xl
          border-r border-black/5 dark:border-white/10
          flex flex-col
          transition-[width,transform] duration-300 ease-in-out
          shadow-[4px_0_30px_rgba(0,0,0,0.06)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center h-[72px] px-4 border-b border-black/5 dark:border-white/10 overflow-hidden`}>
          <div className="flex items-center gap-3 min-w-0">
            {/* Icon mark - always visible */}
            <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-white dark:bg-dark-800 flex items-center justify-center shadow-lg border border-black/5 dark:border-white/10 overflow-hidden group">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className={`h-7 w-7 object-contain transition-transform duration-300 ${isExpanded ? 'scale-110' : 'scale-100'}`} 
              />
            </div>
            {/* Full name - visible when expanded */}
            <div
              className={`flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
                isExpanded ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'
              }`}
            >
              <span className="text-sm font-bold text-dark-900 dark:text-white whitespace-nowrap">Crosstraining</span>
              <span className="text-xs text-dark-400 dark:text-dark-400 whitespace-nowrap">Gym Manager</span>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden ml-auto p-2 rounded-xl text-dark-500 hover:bg-black/5 dark:hover:bg-white/10 transition-all flex-shrink-0"
            aria-label="Fechar menu lateral"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden no-scrollbar">
          <div className="space-y-1">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleNavClick}
                  title={!isExpanded ? item.name : undefined}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-all duration-200 group relative overflow-hidden
                    ${isActive
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                      : 'text-dark-600 dark:text-dark-300 hover:bg-black/5 dark:hover:bg-white/8'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 ${!isActive && 'group-hover:scale-110'}`} />
                  <span
                    className={`
                      text-sm font-medium whitespace-nowrap
                      transition-all duration-300 ease-in-out
                      ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 absolute pointer-events-none'}
                    `}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-black/5 dark:border-white/10 overflow-hidden">
          <a
            href="https://idesignmoz.com"
            target="_blank"
            rel="noopener noreferrer"
            className={`
              flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold
              text-dark-400 dark:text-dark-500 hover:text-dark-700 dark:hover:text-dark-300
              transition-all duration-300
              ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
          >
            <span>powered by IDesign<span className="text-[#bf0404]">moz</span></span>
          </a>
          {!isExpanded && (
            <div className="flex justify-center py-1">
              <span className="text-[9px] font-black text-dark-300 dark:text-dark-600">ID</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default memo(Sidebar);
