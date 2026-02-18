'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { settingsAPI, UPLOAD_URL } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';

export default function DashboardLayout({ children }) {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsAPI.get();
        if (response.data.background_image) {
          setBackgroundImage(`${UPLOAD_URL}${response.data.background_image}`);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();

    const handleBackgroundUpdate = (e) => {
      const { path, theme } = e.detail;
      if (theme === 'light') {
        setBackgroundImage(path);
      }
    };

    window.addEventListener('backgroundUpdate', handleBackgroundUpdate);
    return () => window.removeEventListener('backgroundUpdate', handleBackgroundUpdate);
  }, []);

  useEffect(() => {
    const updateUser = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // Role-based access control
        const forbiddenForReceptionist = [
          '/dashboard', 
          '/dashboard/reports', 
          '/dashboard/accounting', 
          '/dashboard/payments', 
          '/dashboard/users'
        ];
        if (parsedUser.role === 'RECEPTIONIST' && forbiddenForReceptionist.includes(pathname)) {
          router.push('/dashboard/members');
        }
      }
    };

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    updateUser();
    setLoading(false);

    window.addEventListener('userUpdate', updateUser);
    return () => window.removeEventListener('userUpdate', updateUser);
  }, [router, pathname]);

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh h-dvh overflow-hidden bg-gray-50 dark:bg-black transition-colors duration-500">
      {/* Dynamic Background Image - Only in Light Mode */}
      {!isDarkMode && backgroundImage && (
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
          style={{ 
            backgroundImage: `url(${backgroundImage})`,
            filter: 'blur(20px) brightness(0.7) saturate(1.2)'
          }}
        />
      )}
      
      {/* App Content */}
      <div className="relative z-10 flex w-full h-full overflow-hidden">
        <Sidebar 
          currentPath={pathname} 
          user={user} 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
        />
        
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          <Header 
            user={user} 
            setSidebarOpen={setIsSidebarOpen} 
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
            {children}
          </main>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}
