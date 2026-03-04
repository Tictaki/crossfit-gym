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
    <div className="min-h-screen bg-white dark:bg-dark-950 flex flex-col">
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

      {/* Header */}
      <div className="relative z-10 border-b border-gray-100 dark:border-dark-700/50 bg-white dark:bg-dark-900/80 backdrop-blur-xl sticky top-0">
        <Header user={user} setSidebarOpen={setIsSidebarOpen} />
      </div>

      {/* Main Content */}
      <div className="relative z-5 flex flex-1 overflow-hidden">
        {/* Sidebar - Fixed while scrolling */}
        <div className="hidden lg:block sticky top-0 h-screen overflow-y-auto">
          <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} user={user} />
        </div>

        {/* Mobile Sidebar */}
        <div className="lg:hidden">
          <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} user={user} />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
