'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  UsersIcon,
  ShoppingBagIcon,
  PlusIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  UsersIcon as UsersSolid,
  ShoppingBagIcon as ShoppingBagSolid,
  Cog6ToothIcon as CogSolid
} from '@heroicons/react/24/solid';

const navItems = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon, activeIcon: HomeSolid },
  { name: 'Membros', href: '/dashboard/members', icon: UsersIcon, activeIcon: UsersSolid },
  { name: 'Venda', href: '/dashboard/products', icon: PlusIcon, isAction: true },
  { name: 'Loja', href: '/dashboard/products', icon: ShoppingBagIcon, activeIcon: ShoppingBagSolid },
  { name: 'Definições', href: '/dashboard/settings', icon: Cog6ToothIcon, activeIcon: CogSolid },
];

export default function BottomNav({ user }) {
  const pathname = usePathname();

  // Filter items based on role if needed (similar to Sidebar)
  const filteredNav = navItems.filter(item => {
    if (user?.role === 'RECEPTIONIST') {
      return !['Home', 'Definições'].includes(item.name);
    }
    return true;
  });

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-safe pt-2">
      <div className="bg-white/80 dark:bg-dark-950/80 backdrop-blur-2xl border border-white/20 dark:border-dark-800/50 rounded-[2.5rem] shadow-glass-premium px-6 py-2 flex items-center justify-between gap-1 max-w-lg mx-auto mb-2">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = isActive && item.activeIcon ? item.activeIcon : item.icon;

          if (item.isAction) {
            return (
              <Link
                key={item.name}
                href={item.href}
                className="relative -top-6 flex flex-col items-center"
              >
                <div className="h-14 w-14 rounded-full bg-gradient-primary shadow-glow flex items-center justify-center text-white transform hover:scale-110 active:scale-95 transition-all duration-300">
                  <item.icon className="h-8 w-8" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[3.5rem] py-1 transition-all duration-300 ${
                isActive ? 'text-primary-600 dark:text-primary-500 scale-110' : 'text-dark-400 dark:text-dark-300 opacity-60'
              }`}
            >
              <Icon className={`h-6 w-6 mb-0.5 ${isActive ? 'animate-pulse-slow' : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-tight">{item.name}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-primary-500 mt-1 animate-fade-in" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
