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
import { memo, useMemo, useCallback } from 'react';

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

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[80] lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 lg:static lg:translate-x-0 z-[90]
        w-72 bg-gradient-to-b from-white via-gray-50 to-gray-50 dark:from-dark-900 dark:via-dark-900/95 dark:to-dark-950 
        border-r border-gray-100 dark:border-dark-800/50
        flex flex-col h-[100dvh] transition-all duration-300 ease-out
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="p-6 pb-4 flex items-center justify-between">
          <div className="h-12 w-auto flex-1 relative">
            <img 
              src="/logo.png" 
              alt="Crosstraining Gym" 
              className="h-full w-auto object-contain filter dark:brightness-110" 
              loading="eager"
            />
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-dark-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
            aria-label="Fechar menu"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleNavClick}
                  className={`
                    group flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-primary text-white shadow-md' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-800/80'
                    }
                  `}
                  title={item.name}
                >
                  <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-dark-800/50 bg-gray-50 dark:bg-dark-950/50">
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-3 text-white shadow-md mb-3">
            <p className="text-xs font-semibold opacity-90 mb-1">Versão 2.0</p>
            <p className="text-xs font-bold">Crosstraining Gym</p>
          </div>

          <div className="text-center">
            <p className="text-[9px] text-gray-500 dark:text-dark-400">© 2026 Todos os Direitos Reservados</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(Sidebar);
