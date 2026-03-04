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

  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
        fixed inset-y-0 left-0 z-[90]
        bg-white/70 dark:bg-dark-900/70 backdrop-blur-2xl
        border-r border-gray-200/50 dark:border-white/10 
        flex flex-col h-[100dvh] transition-all duration-300 ease-in-out shadow-2xl
        /* Mobile handling: */
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        /* Desktop size handling: */
        lg:top-4 lg:bottom-4 lg:h-[calc(100vh-2rem)] lg:left-4 lg:rounded-3xl
        ${isHovered ? 'w-[260px]' : 'w-[80px] lg:w-[80px]'}
        ${!isOpen && !isHovered ? 'w-full max-w-[260px] lg:w-[80px]' : ''}
        ${isOpen && 'w-[260px] lg:w-[260px]'}
      `}>
        {/* Logo Section */}
        <div className={`p-4 flex items-center transition-all duration-300 ${isHovered || isOpen ? 'justify-between' : 'justify-center'}`}>
          <div className={`relative flex items-center justify-center transition-all duration-300 ${isHovered || isOpen ? 'h-10 w-32' : 'h-10 w-10'}`}>
            <img 
              src="/logo.png" 
              alt="Crosstraining Gym" 
              className={`object-contain filter dark:brightness-110 transition-all duration-300 ${isHovered || isOpen ? 'opacity-100 w-full h-full' : 'opacity-0 scale-50 hidden'}`} 
              loading="eager"
            />
            {/* Minimal Logo for collapsed state */}
            <div className={`absolute inset-0 flex items-center justify-center font-black text-2xl bg-gradient-to-br from-primary-500 to-primary-600 bg-clip-text text-transparent transition-all duration-300 ${!isHovered && !isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50 hidden'}`}>
              CG
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-dark-600 dark:text-dark-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-all"
            aria-label="Fechar menu"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar overflow-x-hidden">
          <div className="space-y-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleNavClick}
                  className={`
                    group flex items-center px-3 py-3 rounded-xl transition-all duration-300 relative
                    ${isActive 
                      ? 'bg-gradient-primary text-white shadow-md shadow-primary-500/20' 
                      : 'text-dark-600 dark:text-dark-300 hover:bg-black/5 dark:hover:bg-white/10'
                    }
                    ${!isHovered && !isOpen ? 'justify-center' : 'justify-start'}
                  `}
                  title={!isHovered && !isOpen ? item.name : undefined}
                >
                  <Icon className={`h-6 w-6 flex-shrink-0 transition-all duration-300 ${isActive ? 'text-white' : 'group-hover:scale-110'}`} />
                  
                  {/* Label with fade + translate */}
                  <span className={`
                    whitespace-nowrap font-medium text-sm ml-3
                    transition-all duration-300 ease-in-out
                    ${isHovered || isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 hidden lg:block lg:absolute lg:left-14 lg:invisible'}
                  `}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer Section */}
        <div className="p-4 border-t border-gray-200/50 dark:border-white/10">
          <div className="flex flex-col items-center justify-center">
            <a 
              href="https://idesignmoz.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`flex items-center justify-center transition-all duration-300 hover:opacity-100
                ${isHovered || isOpen ? 'opacity-80' : 'opacity-0 scale-50 hidden'}
              `}
            >
              <div className="flex items-center gap-1 text-[10px] font-bold">
                <span className="text-dark-400 dark:text-dark-500">powered by</span>
                <span className="text-dark-900 dark:text-white">IDesign<span className="text-[#bf0404]">moz</span></span>
              </div>
            </a>
            
            {/* Minimal footer logo for collapsed state */}
            <div className={`h-6 w-6 rounded-full bg-dark-100 dark:bg-dark-800 flex items-center justify-center transition-all duration-300 ${!isHovered && !isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
              <span className="text-[8px] font-black text-dark-500">ID</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(Sidebar);
