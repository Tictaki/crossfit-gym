'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { memo } from 'react';

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

const Sidebar = ({ currentPath, user, isOpen, setIsOpen }) => {
  const filteredNavigation = navigation.filter(item => {
    if (user?.role === 'RECEPTIONIST') {
      return !['Dashboard', 'Contabilidade', 'Relatórios', 'Pagamentos', 'Utilizadores'].includes(item.name);
    }
    return true;
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-dark-950/40 backdrop-blur-md z-[80] lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 lg:static lg:translate-x-0 z-[90]
        w-72 bg-white/60 dark:bg-dark-900/60 backdrop-blur-2xl border-r border-white/20 dark:border-dark-800/50 
        flex flex-col h-[100dvh] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-glass
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'}
      `}>
        <div className="p-8 pb-4 flex justify-center">
          <div className="h-16 w-full relative">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain filter dark:brightness-110" 
            />
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4 custom-scrollbar">
          <p className="px-4 text-xs font-bold text-secondary-600 dark:text-dark-200 uppercase tracking-wider mb-2 opacity-90">Main Menu</p>
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  group flex items-center px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300
                  ${isActive 
                    ? 'bg-gradient-primary text-white shadow-lg shadow-primary-500/30 translate-x-1' 
                    : 'text-dark-700 dark:text-dark-50 hover:bg-white dark:hover:bg-dark-800 hover:text-primary-600 dark:hover:text-primary-400 hover:shadow-premium'
                  }
                `}
              >
                <Icon 
                  className={`
                    h-6 w-6 mr-3 transition-transform duration-300 group-hover:scale-110
                    ${isActive ? 'text-white' : 'text-dark-600 dark:text-dark-200 group-hover:text-primary-500'}
                  `} 
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-gray-100/50 bg-gradient-to-t from-white/50 to-transparent">
          <div className="bg-gradient-primary rounded-2xl p-4 text-white shadow-lg shadow-primary-500/20 relative overflow-hidden group mb-4">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <TagIcon className="h-16 w-16 -rotate-12" />
            </div>
            <p className="text-xs font-bold opacity-80 mb-1">Status Pro</p>
            <p className="text-sm font-bold">Crosstraining Gym</p>
            <p className="text-[10px] opacity-70 mt-2">© 2026 All Rights Reserved</p>
          </div>

          <div className="flex justify-center items-center">
            <a 
              href="https://idesignmoz.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-[10px] font-bold opacity-80 hover:opacity-100 transition-opacity"
            >
              <span className="text-gray-400 dark:text-dark-200 mr-1 font-medium italic">powered by</span>
              <span style={{ color: '#080707' }} className="dark:text-white dark:brightness-100">IDesign</span>
              <span style={{ color: '#bf0404' }}>moz</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(Sidebar);
