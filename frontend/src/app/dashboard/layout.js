'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { settingsAPI, UPLOAD_URL, getImageUrl } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
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
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
    } else {
      setUser(JSON.parse(storedUser));
      loadSettings();
    }
    setLoading(false);
  }, [router]);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.get();
      if (response.data?.background_image) {
        setBackgroundImage(getImageUrl(response.data.background_image));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950 flex font-sans">
      {/* Background Image */}
      {backgroundImage && (
        <div 
          className="fixed inset-0 z-0 opacity-10 dark:opacity-5"
          style={{
            backgroundImage: `url('${backgroundImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Smart Sidebar (Fixed to left) */}
      <div className="hidden lg:block z-40">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} user={user} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <div className="lg:hidden z-50">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} user={user} />
      </div>

      {/* Main Content Area (Pushed right by sidebar) */}
      <div className="flex-1 flex flex-col min-h-screen relative w-full lg:pl-[80px] transition-[padding] duration-300 ease-in-out group-hover/sidebar:lg:pl-[260px]">
        {/* Suspended Header */}
        <div className="sticky top-4 z-30 mx-4 sm:mx-6 lg:mx-8 mb-4">
          <Header user={user} setSidebarOpen={setIsSidebarOpen} />
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8 pt-0 relative z-10 w-full">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <BottomNav />
      </div>
    </div>
  );
}
