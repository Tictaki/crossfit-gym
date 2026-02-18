'use client';

import { useTheme } from '@/context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-8 right-8 z-[100] p-4 rounded-2xl bg-white/40 dark:bg-dark-900/40 backdrop-blur-xl border border-white/40 dark:border-dark-700/50 shadow-glass-premium hover:shadow-glass-strong hover:-translate-y-1 transition-all duration-300 group"
      aria-label="Toggle Theme"
    >
      <div className="relative h-6 w-6">
        <SunIcon 
          className={`absolute inset-0 h-6 w-6 text-yellow-500 transition-all duration-500 transform ${
            isDarkMode ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`} 
        />
        <MoonIcon 
          className={`absolute inset-0 h-6 w-6 text-primary-500 transition-all duration-500 transform ${
            isDarkMode ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`} 
        />
      </div>
      
      {/* Tooltip */}
      <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-dark-900 dark:bg-white text-white dark:text-dark-900 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-xl">
        {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
      </span>
    </button>
  );
}
